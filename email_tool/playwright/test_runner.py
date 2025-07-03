import asyncio
import re
from playwright.async_api import async_playwright

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

if __name__ == '__main__':
    import sys, json
    html_path = sys.argv[1]
    html = open(html_path).read()
    result = asyncio.run(run(html))
    print(json.dumps(result))
