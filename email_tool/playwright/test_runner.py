import asyncio
import re
from playwright.async_api import async_playwright
import sys, json, os
from typing import List, Optional, Dict, Any

async def run(html: str, test_steps: Optional[List[Dict[str, Any]]] = None):
    issues = []
    if re.search(r"{{\s*\w+\s*}}", html):
        issues.append('Unreplaced placeholders')
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html)
        
        # Basic checks
        links = await page.query_selector_all('a')
        for link in links:
            url = await link.get_attribute('href')
            if not url:
                issues.append('missing href')
        
        # Execute test steps if provided
        if test_steps:
            for i, step in enumerate(test_steps, 1):
                try:
                    if step.get('type') == 'expectText':
                        selector = step.get('selector')
                        expected_text = step.get('text')
                        
                        if selector and expected_text:
                            # Try different selector strategies
                            element = None
                            
                            # Try as ID
                            element = await page.query_selector(f'#{selector}')
                            
                            # Try as class
                            if not element:
                                element = await page.query_selector(f'.{selector}')
                            
                            # Try as data attribute
                            if not element:
                                element = await page.query_selector(f'[data-testid="{selector}"]')
                            
                            # Try as any attribute containing the selector
                            if not element:
                                element = await page.query_selector(f'[class*="{selector}"], [id*="{selector}"], [data-*="{selector}"]')
                            
                            if element:
                                actual_text = await element.text_content()
                                if actual_text:
                                    # Clean up whitespace for comparison
                                    actual_text = re.sub(r'\s+', ' ', actual_text.strip())
                                    expected_text = expected_text.strip()
                                    
                                    if expected_text not in actual_text:
                                        issues.append(f'Step {i}: Expected text "{expected_text}" not found in "{actual_text}"')
                                else:
                                    issues.append(f'Step {i}: No text content found in element {selector}')
                            else:
                                issues.append(f'Step {i}: Element {selector} not found')
                
                except Exception as e:
                    issues.append(f'Step {i}: Error executing test - {str(e)}')
        
        await browser.close()
    
    return {'passed': len(issues) == 0, 'issues': issues}

async def screenshot(html: str, out_path: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html)
        # Set viewport for consistent thumbnail size
        await page.set_viewport_size({"width": 600, "height": 800})
        await page.screenshot(path=out_path, full_page=True)
        await browser.close()

if __name__ == '__main__':
    # Usage:
    #   python test_runner.py <html_path> [screenshot <screenshot_path>] [test_steps <test_steps_json>]
    html_path = sys.argv[1]
    html = open(html_path).read()
    
    if len(sys.argv) > 2 and sys.argv[2] == 'screenshot':
        screenshot_path = sys.argv[3]
        asyncio.run(screenshot(html, screenshot_path))
        print(json.dumps({'screenshot': screenshot_path}))
    elif len(sys.argv) > 2 and sys.argv[2] == 'test_steps':
        test_steps_json = sys.argv[3]
        test_steps = json.loads(test_steps_json)
        result = asyncio.run(run(html, test_steps))
        print(json.dumps(result))
    else:
        result = asyncio.run(run(html))
        print(json.dumps(result))
