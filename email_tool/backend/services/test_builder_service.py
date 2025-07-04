import re
import os
import tempfile
import asyncio
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from bs4 import BeautifulSoup
from ..models import TestScenario, TestStep, TestResult
from playwright.async_api import async_playwright
import json
from datetime import datetime


class TestBuilderService:
    """Handle test scenario management, HTML parsing, and test execution."""

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
        db.add(scenario)
        await db.commit()
        await db.refresh(scenario)
        return scenario

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
        db.add(step)
        await db.commit()
        await db.refresh(step)
        return step

    async def get_test_scenarios(self, db: AsyncSession) -> List[Dict]:
        """Get all test scenarios with their step counts and latest results."""
        result = await db.execute(
            select(TestScenario).order_by(desc(TestScenario.created_at))
        )
        scenarios = result.scalars().all()
        
        scenario_list = []
        for scenario in scenarios:
            # Get step count
            steps_result = await db.execute(
                select(TestStep).filter(TestStep.scenario_id == scenario.id)
            )
            step_count = len(steps_result.scalars().all())
            
            # Get latest result
            latest_result_result = await db.execute(
                select(TestResult)
                .filter(TestResult.scenario_id == scenario.id)
                .order_by(desc(TestResult.execution_time))
                .limit(1)
            )
            latest_result = latest_result_result.scalar_one_or_none()
            
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
        scenario = await db.get(TestScenario, scenario_id)
        if not scenario:
            return None
        
        # Get all steps
        steps_result = await db.execute(
            select(TestStep)
            .filter(TestStep.scenario_id == scenario_id)
            .order_by(TestStep.step_order)
        )
        steps = steps_result.scalars().all()
        
        # Get all results
        results_result = await db.execute(
            select(TestResult)
            .filter(TestResult.scenario_id == scenario_id)
            .order_by(desc(TestResult.execution_time))
        )
        results = results_result.scalars().all()
        
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
        step = await db.get(TestStep, step_id)
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
        step = await db.get(TestStep, step_id)
        if step:
            await db.delete(step)
            await db.commit()
            return True
        return False

    async def delete_test_scenario(self, db: AsyncSession, scenario_id: int) -> bool:
        """Delete a test scenario and all its steps and results."""
        scenario = await db.get(TestScenario, scenario_id)
        if scenario:
            await db.delete(scenario)
            await db.commit()
            return True
        return False

    async def run_test_scenario(self, db: AsyncSession, scenario_id: int) -> Dict:
        """Run a test scenario using Playwright and return results."""
        scenario = await db.get(TestScenario, scenario_id)
        if not scenario:
            return {'error': 'Test scenario not found'}
        
        # Get all steps
        steps_result = await db.execute(
            select(TestStep)
            .filter(TestStep.scenario_id == scenario_id)
            .order_by(TestStep.step_order)
        )
        steps = steps_result.scalars().all()
        
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
        """Run test scenario using Playwright with Windows-compatible configuration."""
        import tempfile
        import os
        import threading
        import time
        
        logs = []
        screenshot_path = None
        
        try:
            # Try sync API first (might work better in FastAPI context)
            from playwright.sync_api import sync_playwright
            import threading
            
            logs.append("Starting Playwright test execution...")
            
            # Create temporary HTML file
            logs.append("Creating temporary HTML file...")
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                f.write(str(scenario.html_content))
                temp_html_path = f.name
            logs.append(f"Temporary HTML file created: {temp_html_path}")
            logs.append(f"HTML content length: {len(str(scenario.html_content))} characters")
            
            def run_playwright_test_inner():
                nonlocal screenshot_path
                browser = None
                page = None
                
                try:
                    logs.append("Starting Playwright sync API...")
                    logs.append("Creating Playwright context...")
                    
                    # Try to get more diagnostic information
                    import sys
                    logs.append(f"Python version: {sys.version}")
                    logs.append(f"Platform: {sys.platform}")
                    
                    with sync_playwright() as p:
                        logs.append("Playwright context created successfully")
                        
                        # Launch browser with Windows-specific options
                        logs.append("Attempting to launch Chromium browser...")
                        try:
                            # Try simpler launch first
                            logs.append("Attempting simple browser launch...")
                            browser = p.chromium.launch(headless=True)
                            logs.append("Chromium browser launched successfully (simple)")
                        except Exception as simple_error:
                            logs.append(f"Simple browser launch failed: {str(simple_error)}")
                            logs.append("Trying with Windows-specific arguments...")
                            try:
                                browser = p.chromium.launch(
                                    headless=True,
                                    args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
                                )
                                logs.append("Chromium browser launched successfully (with args)")
                            except Exception as browser_error:
                                logs.append(f"Browser launch with args failed: {str(browser_error)}")
                                raise browser_error
                        
                        logs.append("Creating new page...")
                        try:
                            page = browser.new_page()
                            logs.append("New page created successfully")
                        except Exception as page_error:
                            logs.append(f"Page creation failed: {str(page_error)}")
                            raise page_error
                        
                        logs.append("Browser and page setup completed")
                        
                        # Navigate to the HTML file
                        file_url = f"file:///{temp_html_path.replace(os.sep, '/')}"
                        logs.append(f"Attempting to navigate to: {file_url}")
                        page.goto(file_url)
                        logs.append(f"Successfully navigated to test page")
                        
                        # Log the page content for debugging
                        page_content = page.content()
                        logs.append(f"Page content length: {len(page_content)} characters")
                        
                        # Execute test steps
                        for step in steps:
                            step_order = getattr(step, 'step_order')
                            action = getattr(step, 'action')
                            selector = getattr(step, 'selector')
                            value = getattr(step, 'value')
                            attr = getattr(step, 'attr')
                            
                            step_log = f"Executing step {step_order}: {action}"
                            if selector:
                                step_log += f" on {selector}"
                            logs.append(step_log)
                            
                            if action == 'click':
                                page.click(f'[data-testid="{selector}"]')
                            elif action == 'expectText':
                                text_content = page.text_content(f'[data-testid="{selector}"]')
                                if value and value not in text_content:
                                    raise Exception(f"Expected text '{value}' not found in element '{selector}'")
                            elif action == 'expectAttr':
                                attr_value = page.get_attribute(f'[data-testid="{selector}"]', attr)
                                if attr_value != value:
                                    raise Exception(f"Expected attribute '{attr}' to be '{value}', got '{attr_value}'")
                            elif action == 'expectUrlContains':
                                current_url = page.url
                                if value and value not in current_url:
                                    raise Exception(f"Expected URL to contain '{value}', got '{current_url}'")
                            elif action == 'waitForSelector':
                                page.wait_for_selector(f'[data-testid="{selector}"]')
                            elif action == 'fill':
                                page.fill(f'[data-testid="{selector}"]', value)
                            else:
                                raise Exception(f"Unknown action: {action}")
                            
                            logs.append(f"Step {step_order} completed successfully")
                        
                        browser.close()
                        logs.append("Test completed successfully")
                        
                except Exception as e:
                    logs.append(f"Test execution failed: {str(e)}")
                    # Try to take screenshot on failure
                    try:
                        if page and browser:
                            screenshot_dir = os.path.join(os.getcwd(), 'static', 'screenshots')
                            os.makedirs(screenshot_dir, exist_ok=True)
                            screenshot_filename = f"test_failure_{scenario_id}_{int(time.time())}.png"
                            screenshot_path = os.path.join(screenshot_dir, screenshot_filename)
                            page.screenshot(path=screenshot_path)
                            logs.append(f"Screenshot saved to {screenshot_path}")
                        else:
                            logs.append("Cannot take screenshot - browser or page not available")
                            screenshot_path = None
                    except Exception as screenshot_error:
                        screenshot_path = None
                        logs.append(f"Failed to take screenshot: {str(screenshot_error)}")
                    raise e
                finally:
                    # Clean up browser
                    try:
                        if browser:
                            browser.close()
                    except:
                        pass
                    # Clean up temporary file
                    try:
                        if os.path.exists(temp_html_path):
                            os.unlink(temp_html_path)
                    except:
                        pass
            
            # Run sync test in thread to avoid blocking
            test_exception = None
            
            def run_playwright_test():
                nonlocal test_exception
                try:
                    run_playwright_test_inner()
                except Exception as e:
                    test_exception = e
            
            thread = threading.Thread(target=run_playwright_test)
            thread.start()
            thread.join(timeout=30)  # 30 second timeout
            
            if thread.is_alive():
                raise Exception("Test execution timed out after 30 seconds")
            
            if test_exception:
                raise test_exception
                
            status = 'passed'
            error_message = None
                
        except Exception as e:
            logs.append(f"Test execution failed: {str(e)}")
            status = 'failed'
            error_message = str(e)
        
        end_time = datetime.now()
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Save test result
        result = TestResult(
            scenario_id=scenario_id,
            status=status,
            duration_ms=duration_ms,
            error_message=error_message,
            screenshot_path=screenshot_path,
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
                if action not in ['click', 'expectText', 'expectAttr', 'expectUrlContains', 'waitForSelector', 'fill']:
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