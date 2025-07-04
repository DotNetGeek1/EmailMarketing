#!/usr/bin/env python3
"""
Test script to verify campaign creation and template upload functionality
"""
import requests
import json
import os

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_campaign_creation():
    """Test creating a new campaign"""
    print("Testing campaign creation...")
    
    data = {"name": "Test Campaign 2024"}
    response = requests.post(f"{API_BASE}/campaign", data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        campaign_data = response.json()
        print(f"✅ Campaign created successfully!")
        print(f"   ID: {campaign_data['id']}")
        print(f"   Name: {campaign_data['name']}")
        return campaign_data['id']
    else:
        print("❌ Campaign creation failed")
        return None

def test_template_upload(campaign_id):
    """Test uploading a template"""
    print(f"\nTesting template upload for campaign {campaign_id}...")
    
    # Create a simple HTML template for testing
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>{{title}}</title>
    </head>
    <body>
        <h1>{{headline}}</h1>
        <p>{{description}}</p>
        <a href="{{cta_url}}">{{cta_text}}</a>
    </body>
    </html>
    """
    
    # Write to temporary file
    with open("test_template.html", "w") as f:
        f.write(html_content)
    
    try:
        with open("test_template.html", "rb") as f:
            files = {"file": ("test_template.html", f, "text/html")}
            data = {"campaign_id": str(campaign_id)}
            response = requests.post(f"{API_BASE}/template", files=files, data=data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            template_data = response.json()
            print(f"✅ Template uploaded successfully!")
            print(f"   Template ID: {template_data['template_id']}")
            print(f"   Placeholders: {template_data['placeholders']}")
            return template_data['template_id']
        else:
            print("❌ Template upload failed")
            return None
            
    finally:
        # Clean up temporary file
        if os.path.exists("test_template.html"):
            os.remove("test_template.html")

def test_get_campaigns():
    """Test getting all campaigns"""
    print("\nTesting get campaigns...")
    
    response = requests.get(f"{API_BASE}/campaigns")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        campaigns = response.json()
        print(f"✅ Retrieved {len(campaigns)} campaigns")
        for campaign in campaigns:
            print(f"   - {campaign['name']} (ID: {campaign['id']})")
    else:
        print(f"❌ Failed to get campaigns: {response.text}")

def test_get_templates():
    """Test getting all templates"""
    print("\nTesting get templates...")
    
    response = requests.get(f"{API_BASE}/templates")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        templates = response.json()
        print(f"✅ Retrieved {len(templates)} templates")
        for template in templates:
            print(f"   - {template['filename']} (ID: {template['id']})")
    else:
        print(f"❌ Failed to get templates: {response.text}")

def main():
    print("🚀 Testing Email Marketing Tool API")
    print("=" * 50)
    
    # Test campaign creation
    campaign_id = test_campaign_creation()
    
    if campaign_id:
        # Test template upload
        template_id = test_template_upload(campaign_id)
        
        # Test getting campaigns and templates
        test_get_campaigns()
        test_get_templates()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
    else:
        print("\n❌ Campaign creation failed, skipping other tests")

if __name__ == "__main__":
    main() 