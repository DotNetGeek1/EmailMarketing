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
        
        # Create temporary HTML file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(str(scenario.html_content))
            temp_html_path = f.name
        
        try:
            start_time = datetime.now()
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                # Navigate to the HTML file
                file_url = f"file://{temp_html_path}"
                await page.goto(file_url)
                
                logs = []
                error_message = None
                screenshot_path = None
                
                try:
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
                            await page.click(str(selector))
                        elif action == 'expectText':
                            text_content = await page.text_content(str(selector))
                            if value and value not in text_content:
                                raise Exception(f"Expected text '{value}' not found in element")
                        elif action == 'expectAttr':
                            attr_value = await page.get_attribute(str(selector), str(attr))
                            if attr_value != value:
                                raise Exception(f"Expected attribute '{attr}' to be '{value}', got '{attr_value}'")
                        elif action == 'expectUrlContains':
                            current_url = page.url
                            if value and value not in current_url:
                                raise Exception(f"Expected URL to contain '{value}', got '{current_url}'")
                        elif action == 'waitForSelector':
                            await page.wait_for_selector(str(selector))
                        elif action == 'fill':
                            await page.fill(str(selector), str(value))
                        else:
                            raise Exception(f"Unknown action: {action}")
                        
                        logs.append(f"Step {step_order} completed successfully")
                    
                    status = 'passed'
                    
                except Exception as e:
                    status = 'failed'
                    error_message = str(e)
                    logs.append(f"Error: {error_message}")
                    
                    # Take screenshot on failure
                    screenshot_dir = os.path.join(os.getcwd(), 'static', 'screenshots')
                    os.makedirs(screenshot_dir, exist_ok=True)
                    screenshot_filename = f"test_failure_{scenario_id}_{int(start_time.timestamp())}.png"
                    screenshot_path = os.path.join(screenshot_dir, screenshot_filename)
                    await page.screenshot(path=screenshot_path)
                    logs.append(f"Screenshot saved: {screenshot_path}")
                
                finally:
                    await browser.close()
                
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
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_html_path):
                os.unlink(temp_html_path) 