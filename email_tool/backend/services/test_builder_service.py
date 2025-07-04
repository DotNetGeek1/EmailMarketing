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
            # Use subprocess to run Playwright completely outside FastAPI context
            import subprocess
            import json
            import sys
            
            logs.append("Starting Playwright test execution via subprocess...")
            
            # Create temporary HTML file
            logs.append("Creating temporary HTML file...")
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                f.write(str(scenario.html_content))
                temp_html_path = f.name
            logs.append(f"Temporary HTML file created: {temp_html_path}")
            logs.append(f"HTML content length: {len(str(scenario.html_content))} characters")
            
            # Create a temporary Python script to run the test
            test_script_content = f'''
import sys
import json
from playwright.sync_api import sync_playwright

def run_test():
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            file_url = "file:///{temp_html_path.replace(os.sep, '/')}"
            page.goto(file_url)
            
            # Execute test steps
            steps = {[{"step_order": getattr(step, 'step_order'), "action": getattr(step, 'action'), "selector": getattr(step, 'selector'), "value": getattr(step, 'value'), "attr": getattr(step, 'attr')} for step in steps]}
            
            results = []
            for step in steps:
                step_order = step["step_order"]
                action = step["action"]
                selector = step["selector"]
                value = step["value"]
                attr = step["attr"]
                
                print(f"Executing step {{step_order}}: {{action}} on {{selector}}")
                
                if action == 'click':
                    page.click(f'[data-testid="{{selector}}"]')
                elif action == 'expectText':
                    text_content = page.text_content(f'[data-testid="{{selector}}"]')
                    # Strip whitespace for comparison
                    text_content_clean = text_content.strip()
                    print(f"Found text: '{{text_content}}'")
                    print(f"Cleaned text: '{{text_content_clean}}'")
                    print(f"Expected text: '{{value}}'")
                    if value and value != text_content_clean:
                        raise Exception(f"Expected text '{{value}}' does not match '{{text_content_clean}}' in element '{{selector}}'")
                elif action == 'expectAttr':
                    attr_value = page.get_attribute(f'[data-testid="{{selector}}"]', attr)
                    print(f"Found attribute {{attr}}: '{{attr_value}}'")
                    print(f"Expected attribute {{attr}}: '{{value}}'")
                    if attr_value != value:
                        raise Exception(f"Expected attribute '{{attr}}' to be '{{value}}', got '{{attr_value}}'")
                elif action == 'expectUrlContains':
                    current_url = page.url
                    print(f"Current URL: '{{current_url}}'")
                    print(f"Expected URL to contain: '{{value}}'")
                    if value and value not in current_url:
                        raise Exception(f"Expected URL to contain '{{value}}', got '{{current_url}}'")
                elif action == 'waitForSelector':
                    page.wait_for_selector(f'[data-testid="{{selector}}"]')
                elif action == 'fill':
                    page.fill(f'[data-testid="{{selector}}"]', value)
                else:
                    raise Exception(f"Unknown action: {{action}}")
                
                print(f"Step {{step_order}} completed successfully")
                results.append({{"step": step_order, "status": "passed"}})
            
            browser.close()
            return {{"status": "passed", "results": results}}
            
    except Exception as e:
        print(f"Test failed with error: {{str(e)}}")
        return {{"status": "failed", "error": str(e)}}

if __name__ == "__main__":
    result = run_test()
    print(json.dumps(result))
'''
            
            # Write the test script to a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write(test_script_content)
                test_script_path = f.name
            
            logs.append(f"Test script created: {test_script_path}")
            
            # Run the test script
            logs.append("Executing test script...")
            result = subprocess.run([sys.executable, test_script_path], 
                                  capture_output=True, text=True, timeout=30)
            
            logs.append(f"Subprocess completed with return code: {result.returncode}")
            # Extract debug output and JSON result
            stdout_lines = result.stdout.strip().split('\n')
            debug_output = []
            json_result = None
            
            for line in stdout_lines:
                if line.startswith('{') and line.endswith('}'):
                    json_result = line
                else:
                    debug_output.append(line)
            
            logs.append("Debug output from subprocess:")
            for line in debug_output:
                logs.append(f"  {line}")
            
            logs.append(f"Subprocess stderr: {result.stderr}")
            
            if result.returncode == 0 and json_result:
                try:
                    test_result = json.loads(json_result)
                    if test_result["status"] == "passed":
                        status = 'passed'
                        error_message = None
                        logs.append("Test completed successfully via subprocess")
                    else:
                        status = 'failed'
                        error_message = test_result.get("error", "Unknown error")
                        logs.append(f"Test failed via subprocess: {error_message}")
                except json.JSONDecodeError:
                    status = 'failed'
                    error_message = "Failed to parse test results"
                    logs.append("Failed to parse test results from subprocess")
            else:
                status = 'failed'
                error_message = f"Subprocess failed with return code {result.returncode}"
                logs.append(f"Subprocess failed: {result.stderr}")
            
            # Clean up temporary files
            try:
                os.unlink(test_script_path)
                os.unlink(temp_html_path)
            except:
                pass
                
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