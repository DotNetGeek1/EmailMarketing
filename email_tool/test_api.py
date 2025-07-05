#!/usr/bin/env python3
"""
Test script to verify project creation and template upload functionality
"""
import requests
import json
import os

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_project_creation():
    """Test creating a new project"""
    print("Testing project creation...")
    
    data = {"name": "Test Project 2024"}
    response = requests.post(f"{API_BASE}/project", data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        project_data = response.json()
        print(f"✅ Project created successfully!")
        print(f"   ID: {project_data['id']}")
        print(f"   Name: {project_data['name']}")
        return project_data['id']
    else:
        print("❌ Project creation failed")
        return None

def test_template_upload(project_id):
    """Test uploading a template"""
    print(f"\nTesting template upload for project {project_id}...")
    
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
            data = {"project_id": str(project_id)}
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

def test_get_projects():
    """Test getting all projects"""
    print("\nTesting get projects...")
    
    response = requests.get(f"{API_BASE}/projects")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        projects = response.json()
        print(f"✅ Retrieved {len(projects)} projects")
        for project in projects:
            print(f"   - {project['name']} (ID: {project['id']})")
    else:
        print(f"❌ Failed to get projects: {response.text}")

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
    
    # Test project creation
    project_id = test_project_creation()
    
    if project_id:
        # Test template upload
        template_id = test_template_upload(project_id)
        
        # Test getting projects and templates
        test_get_projects()
        test_get_templates()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
    else:
        print("\n❌ Project creation failed, skipping other tests")

if __name__ == "__main__":
    main() 