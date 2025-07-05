import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from playwright.test_runner import run

async def test_text_matching():
    # Test case 1: Should pass - text is found
    html1 = '<div class="Hero-Heading">Shop Our Back-to-School Essentials</div>'
    test_steps1 = [{'type': 'expectText', 'selector': 'Hero-Heading', 'text': 'Shop'}]
    result1 = await run(html1, test_steps1)
    print("Test 1 (should pass):", result1)
    
    # Test case 2: Should fail - text is not found
    html2 = '<div class="Hero-Heading">Our Back-to-School Essentials</div>'
    test_steps2 = [{'type': 'expectText', 'selector': 'Hero-Heading', 'text': 'Shop'}]
    result2 = await run(html2, test_steps2)
    print("Test 2 (should fail):", result2)
    
    # Test case 3: Should fail - element not found
    html3 = '<div class="Other-Heading">Shop Our Back-to-School Essentials</div>'
    test_steps3 = [{'type': 'expectText', 'selector': 'Hero-Heading', 'text': 'Shop'}]
    result3 = await run(html3, test_steps3)
    print("Test 3 (should fail):", result3)

if __name__ == "__main__":
    asyncio.run(test_text_matching()) 