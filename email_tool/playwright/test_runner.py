import asyncio
from playwright.async_api import async_playwright

async def run(html: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html)
        links = await page.query_selector_all('a')
        broken = []
        for link in links:
            url = await link.get_attribute('href')
            if not url:
                broken.append('missing href')
        await browser.close()
        return {'passed': len(broken) == 0, 'issues': broken}

if __name__ == '__main__':
    import sys, json
    html_path = sys.argv[1]
    html = open(html_path).read()
    result = asyncio.run(run(html))
    print(json.dumps(result))
