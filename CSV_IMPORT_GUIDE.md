# CSV Import Guide for Copy Management

This guide explains how to import copy content from a CSV file into the Email Marketing Tool.

## CSV Format

Your CSV file should have exactly 2 columns:
- **Tag**: The tag name (supports both `{{tag}}` and `tag` formats)
- **Copy**: The copy content for that tag

## Example CSV Content

```csv
Tag,Copy
{{headline}},Get ready for back to school!
{{subheadline}},Save big on school supplies
{{cta_text}},Shop Now
{{footer_text}},© 2024 Your Company. All rights reserved.
```

**Note**: The system automatically handles both `{{tag}}` and `tag` formats. You can use either format in your CSV file, and the system will normalize them for comparison with existing project tags.

## Import Process

1. **Select Project**: Choose the project you want to import copy for
2. **Select Locale**: Choose the language/locale for the copy
3. **Upload CSV**: Select your CSV file
4. **Review Validation**: The system will show:
   - ✅ Valid entries ready to import
   - ❌ Missing tags (tags in CSV that don't exist in the project)
   - ⚠️ Extra tags (project tags not included in CSV)
5. **Import**: Click "Import" to create the copy entries

## Validation Rules

- Tags must exist in the selected project
- Duplicate tags will be skipped
- Empty copy content is allowed
- The system automatically normalizes tag names (removes `{{}}` brackets if present)

## Tips

- Use the preview table to verify your data before importing
- Check the validation results to ensure all tags exist in your project
- Consider adding missing tags to your project before importing
- The import creates copy entries with "Draft" status by default

## Best Practices

1. **Template First**: Always upload your HTML template before importing copy
2. **Tag Matching**: Ensure CSV tags exactly match template placeholders
3. **Locale Selection**: Choose the correct language/locale for your copy
4. **Backup**: Keep a backup of your CSV files
5. **Test Import**: Use the preview feature to validate before importing

## Troubleshooting

### Common Issues:

1. **"Tags not found in project"**
   - Upload your HTML template first
   - Check that tag names match exactly (case-sensitive)
   - Ensure template placeholders use `{{tag_name}}` format

2. **"Invalid CSV format"**
   - Check that your file has the correct header row
   - Ensure the file is saved as `.csv` format
   - Verify there are no extra columns

3. **"Import failed"**
   - Check your internet connection
   - Ensure you have the correct project selected
   - Try importing a smaller subset of data first

### Getting Help:
- Use the preview feature to catch issues before importing
- Check the validation results for specific error messages
- Ensure your project has the necessary templates uploaded

## File Structure

The system expects:
- **Tags**: Must match template placeholders exactly
- **Copy**: Can contain any text, including HTML and special characters
- **Encoding**: UTF-8 encoding is recommended for international characters

## Security Notes

- Only upload CSV files from trusted sources
- The system validates all input before processing
- Imported copy is stored securely in the database
- No sensitive data should be included in copy content 