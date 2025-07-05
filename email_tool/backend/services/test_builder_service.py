import re
import os
import tempfile
import asyncio
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from bs4 import BeautifulSoup
from ..models import TestScenario, TestStep, TestResult
from ..data_access.test_scenario_repository import TestScenarioRepository
from ..data_access.test_step_repository import TestStepRepository
from ..data_access.test_result_repository import TestResultRepository
from playwright.async_api import async_playwright
import json
from datetime import datetime


class TestBuilderService:
    """Handle test scenario management, HTML parsing, and test execution."""

    def __init__(self):
        self.test_scenario_repository = TestScenarioRepository()
        self.test_step_repository = TestStepRepository()
        self.test_result_repository = TestResultRepository()

    async def create_test_scenario(
        self,
        db: AsyncSession,
        name: str,
        description: str,
        html_content: str,
        html_filename: str
    ) -> TestScenario:
        """Create a new test scenario with uploaded HTML content."""
        scenario = TestScenario(
            name=name,
            description=description,
            html_content=html_content,
            html_filename=html_filename
        )
        return await self.test_scenario_repository.create(db, scenario)

    async def extract_data_testids(self, html_content: str) -> List[Dict[str, str]]:
        """Extract all data-testid attributes from HTML content."""
        soup = BeautifulSoup(html_content, 'html.parser')
        elements_with_testid = []
        
        # Find all elements with data-testid attribute
        for element in soup.find_all(attrs={"data-testid": True}):
            testid = element.get('data-testid')
            tag_name = element.name
            element_text = element.get_text(strip=True)[:50]  # First 50 chars of text
            
            elements_with_testid.append({
                'testid': testid,
                'tag': tag_name,
                'text': element_text,
                'selector': f'[data-testid="{testid}"]'
            })
        
        return elements_with_testid

    async def add_test_step(
        self,
        db: AsyncSession,
        scenario_id: int,
        step_order: int,
        action: str,
        selector: Optional[str] = None,
        value: Optional[str] = None,
        attr: Optional[str] = None,
        description: Optional[str] = None
    ) -> TestStep:
        """Add a test step to a scenario."""
        step = TestStep(
            scenario_id=scenario_id,
            step_order=step_order,
            action=action,
            selector=selector,
            value=value,
            attr=attr,
            description=description
        )
        return await self.test_step_repository.create(db, step)

    async def get_test_scenarios(self, db: AsyncSession) -> List[Dict]:
        """Get all test scenarios with their step counts and latest results."""
        scenarios = await self.test_scenario_repository.get_all(db)
        
        scenario_list = []
        for scenario in scenarios:
            # Get step count
            steps = await self.test_step_repository.get_by_scenario(db, getattr(scenario, 'id'))
            step_count = len(steps)
            
            # Get latest result
            latest_result = await self.test_result_repository.get_latest_by_scenario(db, getattr(scenario, 'id'))
            
            scenario_dict = {
                'id': scenario.id,
                'name': scenario.name,
                'description': scenario.description,
                'html_filename': scenario.html_filename,
                'is_active': scenario.is_active,
                'created_at': scenario.created_at.isoformat(),
                'updated_at': scenario.updated_at.isoformat(),
                'step_count': step_count,
                'latest_result': {
                    'status': latest_result.status,
                    'execution_time': latest_result.execution_time.isoformat(),
                    'duration_ms': latest_result.duration_ms
                } if latest_result else None
            }
            scenario_list.append(scenario_dict)
        
        return scenario_list

    async def get_test_scenario(self, db: AsyncSession, scenario_id: int) -> Optional[Dict]:
        """Get a specific test scenario with all its steps."""
        scenario = await self.test_scenario_repository.get(db, scenario_id)
        if not scenario:
            return None
        
        # Get all steps
        steps = await self.test_step_repository.get_by_scenario(db, scenario_id)
        
        # Get all results
        results = await self.test_result_repository.get_by_scenario(db, scenario_id)
        
        return {
            'id': scenario.id,
            'name': scenario.name,
            'description': scenario.description,
            'html_content': scenario.html_content,
            'html_filename': scenario.html_filename,
            'is_active': scenario.is_active,
            'created_at': scenario.created_at.isoformat(),
            'updated_at': scenario.updated_at.isoformat(),
            'steps': [
                {
                    'id': step.id,
                    'step_order': step.step_order,
                    'action': step.action,
                    'selector': step.selector,
                    'value': step.value,
                    'attr': step.attr,
                    'description': step.description
                }
                for step in steps
            ],
            'results': [
                {
                    'id': result.id,
                    'status': result.status,
                    'execution_time': result.execution_time.isoformat(),
                    'duration_ms': result.duration_ms,
                    'error_message': result.error_message,
                    'screenshot_path': result.screenshot_path,
                    'logs': result.logs
                }
                for result in results
            ]
        }

    async def update_test_step(
        self,
        db: AsyncSession,
        step_id: int,
        step_order: int,
        action: str,
        selector: Optional[str] = None,
        value: Optional[str] = None,
        attr: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[TestStep]:
        """Update an existing test step."""
        step = await self.test_step_repository.get(db, step_id)
        if not step:
            return None
        
        setattr(step, 'step_order', step_order)
        setattr(step, 'action', action)
        setattr(step, 'selector', selector)
        setattr(step, 'value', value)
        setattr(step, 'attr', attr)
        setattr(step, 'description', description)
        
        await db.commit()
        await db.refresh(step)
        return step

    async def delete_test_step(self, db: AsyncSession, step_id: int) -> bool:
        """Delete a test step."""
        step = await self.test_step_repository.get(db, step_id)
        if step:
            await self.test_step_repository.delete(db, step_id)
            return True
        return False

    async def delete_test_scenario(self, db: AsyncSession, scenario_id: int) -> bool:
        """Delete a test scenario and all its steps and results."""
        scenario = await self.test_scenario_repository.get(db, scenario_id)
        if scenario:
            await self.test_scenario_repository.delete(db, scenario_id)
            return True
        return False

    async def run_test_scenario(self, db: AsyncSession, scenario_id: int) -> Dict:
        """Run a test scenario using Playwright and return results."""
        scenario = await self.test_scenario_repository.get(db, scenario_id)
        if not scenario:
            return {'error': 'Test scenario not found'}
        
        # Get all steps
        steps = await self.test_step_repository.get_by_scenario(db, scenario_id)
        
        if not steps:
            return {'error': 'No test steps found for this scenario'}
        
        start_time = datetime.now()
        
        # Try Playwright first, fallback to validation if it fails
        try:
            return await self._run_test_scenario_playwright(db, scenario_id, steps, start_time, scenario)
        except Exception as e:
            # If Playwright fails, use fallback
            return await self._run_test_scenario_fallback(db, scenario_id, steps, start_time)

    async def _run_test_scenario_playwright(self, db: AsyncSession, scenario_id: int, steps, start_time: datetime, scenario) -> Dict:
        """Run test scenario using Playwright with Docker-compatible configuration."""
        import tempfile
        import os
        import uuid
        
        logs = []
        screenshot_path = None
        
        try:
            logs.append("Starting Playwright test execution...")
            
            # Create temporary HTML file
            logs.append("Creating temporary HTML file...")
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                f.write(str(scenario.html_content))
                temp_html_path = f.name
            logs.append(f"Temporary HTML file created: {temp_html_path}")

            # Compute absolute screenshots directory
            screenshots_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../static/screenshots'))
            os.makedirs(screenshots_dir, exist_ok=True)

            # Run test using Playwright directly
            from playwright.async_api import async_playwright
            
            async with async_playwright() as p:
                # Launch browser with Docker-compatible settings
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                )
                
                page = await browser.new_page()
                
                # Load the HTML content
                file_url = f"file:///{temp_html_path.replace(os.sep, '/')}"
                await page.goto(file_url)
                
                # Execute test steps
                results = []
                for step in steps:
                    step_order = getattr(step, 'step_order')
                    action = getattr(step, 'action')
                    selector = getattr(step, 'selector')
                    value = getattr(step, 'value')
                    attr = getattr(step, 'attr')
                    
                    logs.append(f"Executing step {step_order}: {action} on {selector}")
                    
                    try:
                        if action == 'click':
                            await page.click(f'[data-testid="{selector}"]')
                        elif action == 'expectText':
                            text_content = await page.text_content(f'[data-testid="{selector}"]')
                            # Normalize and clean text for comparison
                            text_content_clean = text_content.strip() if text_content else ""
                            value_clean = value.strip() if value else ""
                            
                            # Additional normalization
                            text_content_normalized = text_content_clean.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                            value_normalized = value_clean.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                            
                            # Remove multiple spaces
                            text_content_normalized = ' '.join(text_content_normalized.split())
                            value_normalized = ' '.join(value_normalized.split())
                            
                            logs.append(f"Found text: '{text_content}'")
                            logs.append(f"Expected text: '{value}'")
                            
                            if value_normalized and value_normalized != text_content_normalized:
                                raise Exception(f"Expected text '{value_normalized}' does not match '{text_content_normalized}' in element '{selector}'")
                        elif action == 'expectAttr':
                            attr_value = await page.get_attribute(f'[data-testid="{selector}"]', attr)
                            logs.append(f"Found attribute {attr}: '{attr_value}'")
                            logs.append(f"Expected attribute {attr}: '{value}'")
                            if attr_value != value:
                                raise Exception(f"Expected attribute '{attr}' to be '{value}', got '{attr_value}'")
                        elif action == 'expectUrlContains':
                            current_url = page.url
                            logs.append(f"Current URL: '{current_url}'")
                            logs.append(f"Expected URL to contain: '{value}'")
                            if value and value not in current_url:
                                raise Exception(f"Expected URL to contain '{value}', got '{current_url}'")
                        elif action == 'expectPageTitle':
                            page_title = await page.title()
                            logs.append(f"Current page title: '{page_title}'")
                            logs.append(f"Expected page title: '{value}'")
                            if value and value != page_title:
                                raise Exception(f"Expected page title '{value}', got '{page_title}'")
                        elif action == 'waitForSelector':
                            await page.wait_for_selector(f'[data-testid="{selector}"]')
                        elif action == 'waitForPageLoad':
                            await page.wait_for_load_state('domcontentloaded')
                            logs.append(f"Page load completed")
                        elif action == 'fill':
                            await page.fill(f'[data-testid="{selector}"]', value)
                        else:
                            raise Exception(f"Unknown action: {action}")
                        
                        logs.append(f"Step {step_order} completed successfully")
                        results.append({"step": step_order, "status": "passed"})
                        
                    except Exception as step_error:
                        # Capture screenshot on step failure
                        try:
                            screenshot_filename = f"screenshot_{uuid.uuid4()}.png"
                            screenshot_path = os.path.join(screenshots_dir, screenshot_filename)
                            await page.screenshot(path=screenshot_path, full_page=True)
                            logs.append(f"Screenshot captured at: {screenshot_path}")
                        except Exception as screenshot_error:
                            logs.append(f"Failed to capture screenshot: {screenshot_error}")
                            screenshot_path = None
                        
                        # Re-raise the step error
                        raise step_error
                
                await browser.close()
                
                # Clean up temporary file
                try:
                    os.unlink(temp_html_path)
                except:
                    pass
                
                status = 'passed'
                error_message = None
                logs.append("Test completed successfully")
                
        except Exception as e:
            status = 'failed'
            error_message = str(e)
            logs.append(f"Test failed: {error_message}")
            
            # Clean up temporary file
            try:
                os.unlink(temp_html_path)
            except:
                pass
        
        # Calculate duration
        end_time = datetime.now()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Create test result
        public_screenshot_url = None
        if screenshot_path:
            public_screenshot_url = f"/static/screenshots/{os.path.basename(screenshot_path)}"
        test_result = TestResult(
            scenario_id=scenario_id,
            status=status,
            execution_time=start_time,
            duration_ms=duration_ms,
            error_message=error_message,
            screenshot_path=screenshot_path,
            logs='\n'.join(logs)
        )
        
        db.add(test_result)
        await db.commit()
        await db.refresh(test_result)
        
        return {
            'status': status,
            'duration_ms': duration_ms,
            'error_message': error_message,
            'screenshot_path': public_screenshot_url,
            'logs': logs
        }

    async def _run_test_scenario_fallback(self, db: AsyncSession, scenario_id: int, steps, start_time: datetime) -> Dict:
        """Fallback test execution method for Windows when Playwright fails."""
        logs = []
        logs.append("Playwright browser launch failed on Windows. This is a known issue with subprocess creation.")
        logs.append("Using fallback test execution method - only step validation is performed.")
        
        # Simulate test execution (for now, just validate steps)
        try:
            for step in steps:
                step_order = getattr(step, 'step_order')
                action = getattr(step, 'action')
                selector = getattr(step, 'selector')
                
                step_log = f"Validating step {step_order}: {action}"
                if selector:
                    step_log += f" on {selector}"
                logs.append(step_log)
                
                # Basic validation
                if action not in ['click', 'expectText', 'expectAttr', 'expectUrlContains', 'expectPageTitle', 'waitForSelector', 'waitForPageLoad', 'fill']:
                    raise Exception(f"Unknown action: {action}")
                
                logs.append(f"Step {step_order} validation passed")
            
            # Mark as "error" instead of "passed" to indicate Playwright failure
            status = 'error'
            error_message = "Playwright execution failed - only step validation performed. Browser automation requires Playwright to be properly configured on Windows."
            logs.append("All steps validated successfully (Playwright execution skipped due to Windows compatibility)")
            
        except Exception as e:
            status = 'failed'
            error_message = str(e)
            logs.append(f"Validation error: {error_message}")
        
        end_time = datetime.now()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Save test result
        result = TestResult(
            scenario_id=scenario_id,
            status=status,
            duration_ms=duration_ms,
            error_message=error_message,
            screenshot_path=None,
            logs='\n'.join(logs)
        )
        db.add(result)
        await db.commit()
        await db.refresh(result)
        
        return {
            'id': result.id,
            'status': result.status,
            'duration_ms': result.duration_ms,
            'error_message': result.error_message,
            'screenshot_path': result.screenshot_path,
            'logs': result.logs,
            'execution_time': result.execution_time.isoformat()
        } 