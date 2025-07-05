import requests
import json

# Test the copy submission API
def test_copy_submission():
    base_url = "http://localhost:8000"
    
    # First, create a project
    print("Creating project...")
    project_data = {"name": "Test Project for Copy"}
    response = requests.post(f"{base_url}/project", data=project_data)
    if response.status_code == 200:
        project = response.json()
        project_id = project['id']
        print(f"✅ Project created: {project['name']} (ID: {project_id})")
    else:
        print(f"❌ Failed to create project: {response.text}")
        return
    
    # Test copy submission
    print("\nTesting copy submission...")
    copy_data = {
        "key": "headline",
        "value": "Welcome to our amazing product!"
    }
    
    response = requests.post(
        f"{base_url}/copy/{project_id}/en",
        data=copy_data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Copy submitted successfully! ID: {result['id']}")
    else:
        print(f"❌ Failed to submit copy: {response.status_code} - {response.text}")
    
    # Test getting copy entries
    print("\nTesting copy retrieval...")
    response = requests.get(f"{base_url}/copy/{project_id}")
    
    if response.status_code == 200:
        copies = response.json()
        print(f"✅ Retrieved {len(copies)} copy entries:")
        for copy in copies:
            print(f"  - {copy['language']}: {copy['key']} = '{copy['value']}'")
    else:
        print(f"❌ Failed to retrieve copy: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_copy_submission() 