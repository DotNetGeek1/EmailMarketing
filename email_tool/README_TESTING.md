# Testing Campaign Creation and Template Upload

This guide will help you test that campaign creation and template upload functionality works correctly.

## Prerequisites

1. Make sure the backend server is running:
   ```bash
   cd email_tool/backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Make sure the frontend is running:
   ```bash
   cd email_tool/frontend
   npm start
   ```

## Testing via API Script

### 1. Run the Test Script

```bash
cd email_tool
python test_api.py
```

This script will:
- Create a test campaign
- Upload a sample HTML template
- Verify that campaigns and templates can be retrieved

### 2. Expected Output

You should see output similar to:
```
🚀 Testing Email Marketing Tool API
==================================================
Testing campaign creation...
Status Code: 200
Response: {"id": 1, "name": "Test Campaign 2024", "created_at": "2024-01-15T10:30:00", "templates_count": 0, "languages_count": 0}
✅ Campaign created successfully!
   ID: 1
   Name: Test Campaign 2024

Testing template upload for campaign 1...
Status Code: 200
Response: {"template_id": 1, "placeholders": ["title", "headline", "description", "additional_content", "cta_url", "cta_text", "footer_text", "contact_email"]}
✅ Template uploaded successfully!
   Template ID: 1
   Placeholders: ['title', 'headline', 'description', 'additional_content', 'cta_url', 'cta_text', 'footer_text', 'contact_email']

Testing get campaigns...
Status Code: 200
✅ Retrieved 1 campaigns
   - Test Campaign 2024 (ID: 1)

Testing get templates...
Status Code: 200
✅ Retrieved 1 templates
   - test_template.html (ID: 1)

==================================================
✅ All tests completed!
```

## Testing via Frontend

### 1. Create a Campaign

1. Open your browser and go to `http://localhost:3000`
2. Navigate to the "Campaigns" page
3. Click "Create Campaign"
4. Enter a campaign name (e.g., "Summer Sale 2024")
5. Click "Create"
6. You should see the new campaign appear in the list

### 2. Upload a Template

1. Navigate to the "Templates" page
2. Click "Upload Template"
3. Select a campaign from the dropdown
4. Click "Choose File" and select an HTML file (you can use `sample_template.html`)
5. Click "Upload"
6. You should see the new template appear in the list with extracted placeholders

### 3. Verify Data

1. Go back to the "Campaigns" page
2. You should see the template count updated for your campaign
3. Go to the "Templates" page
4. Click on a template to preview it and see the extracted placeholders

## Sample Template

Use the provided `sample_template.html` file which includes these placeholders:
- `{{title}}` - Page title
- `{{headline}}` - Main headline
- `{{description}}` - Main description
- `{{additional_content}}` - Additional content
- `{{cta_url}}` - Call-to-action URL
- `{{cta_text}}` - Call-to-action text
- `{{footer_text}}` - Footer text
- `{{contact_email}}` - Contact email

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Make sure the database is properly initialized
   - Check that all models are imported in `main.py`

2. **Template Upload Fails**
   - Ensure the file is a valid HTML file
   - Check that the campaign ID exists
   - Verify the file size is reasonable

3. **Campaign Creation Fails**
   - Check that the campaign name is not empty
   - Ensure the database is accessible

### Debug Mode

To see detailed error messages, you can run the backend in debug mode:

```bash
cd email_tool/backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
```

## API Endpoints

The following endpoints are available for testing:

- `POST /api/campaign` - Create a new campaign
- `GET /api/campaigns` - Get all campaigns
- `POST /api/template` - Upload a template
- `GET /api/templates` - Get all templates
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create a new tag

## Next Steps

Once you've verified that campaign creation and template upload work:

1. Test the Copy Management functionality
2. Test the Email Generation feature
3. Test the Testing functionality
4. Explore the Tag Management system 