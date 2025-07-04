import requests
import json

# Test the copy submission API
def test_copy_submission():
    base_url = "http://localhost:8000"
    
    # First, create a campaign
    print("Creating campaign...")
    campaign_data = {"name": "Test Campaign for Copy"}
    response = requests.post(f"{base_url}/campaign", data=campaign_data)
    if response.status_code == 200:
        campaign = response.json()
        campaign_id = campaign['id']
        print(f"✅ Campaign created: {campaign['name']} (ID: {campaign_id})")
    else:
        print(f"❌ Failed to create campaign: {response.text}")
        return
    
    # Test copy submission
    print("\nTesting copy submission...")
    copy_data = {
        "key": "headline",
        "value": "Welcome to our amazing product!"
    }
    
    response = requests.post(
        f"{base_url}/copy/{campaign_id}/en",
        data=copy_data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Copy submitted successfully! ID: {result['id']}")
    else:
        print(f"❌ Failed to submit copy: {response.status_code} - {response.text}")
    
    # Test getting copy entries
    print("\nTesting copy retrieval...")
    response = requests.get(f"{base_url}/copy/{campaign_id}")
    
    if response.status_code == 200:
        copies = response.json()
        print(f"✅ Retrieved {len(copies)} copy entries:")
        for copy in copies:
            print(f"  - {copy['language']}: {copy['key']} = '{copy['value']}'")
    else:
        print(f"❌ Failed to retrieve copy: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_copy_submission() 