import asyncio
import re
from playwright.async_api import async_playwright
import sys, json, os
from typing import List, Optional, Dict, Any

async def run(html: str, test_steps: Optional[List[Dict[str, Any]]] = None):
    issues = []
    if re.search(r"{{\s*\w+\s*}}", html):
        issues.append('Unreplaced placeholders')
    try:
        async with async_playwright() as p:
            # Launch browser with proper Docker configuration
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
            await page.set_content(html)
            links = await page.query_selector_all('a')
            for link in links:
                url = await link.get_attribute('href')
                if not url:
                    issues.append('missing href')
            await browser.close()
    except Exception as e:
        issues.append(f'Browser automation failed: {str(e)}')
    return {'passed': len(issues) == 0, 'issues': issues}

async def screenshot(html: str, out_path: str):
    try:
        async with async_playwright() as p:
            # Launch browser with proper Docker configuration
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
            await page.set_content(html)
            # Set viewport for consistent thumbnail size
            await page.set_viewport_size({"width": 600, "height": 800})
            await page.screenshot(path=out_path, full_page=True)
            await browser.close()
    except Exception as e:
        print(f"Screenshot failed: {str(e)}", file=sys.stderr)

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
