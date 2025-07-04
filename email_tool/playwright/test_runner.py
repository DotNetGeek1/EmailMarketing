import asyncio
import re
from playwright.async_api import async_playwright
import sys, json, os

async def run(html: str):
    issues = []
    if re.search(r"{{\s*\w+\s*}}", html):
        issues.append('Unreplaced placeholders')
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html)
        links = await page.query_selector_all('a')
        for link in links:
            url = await link.get_attribute('href')
            if not url:
                issues.append('missing href')
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
    #   python test_runner.py <html_path> [screenshot <screenshot_path>]
    html_path = sys.argv[1]
    html = open(html_path).read()
    if len(sys.argv) > 2 and sys.argv[2] == 'screenshot':
        screenshot_path = sys.argv[3]
        asyncio.run(screenshot(html, screenshot_path))
        print(json.dumps({'screenshot': screenshot_path}))
    else:
        result = asyncio.run(run(html))
        print(json.dumps(result))
