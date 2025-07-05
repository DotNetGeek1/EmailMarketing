# Marketing Group Types Seeding

This document explains how to seed the database with predefined marketing group types.

## Automatic Seeding

The marketing group types are automatically seeded when the backend application starts up. The following types will be created if they don't already exist:

| Label | Code |
|-------|------|
| D2C | D2C |
| Creative Pro | CPro |
| Consumer | CONS |
| Gaming | Gam |
| NAS | NAS |
| Surveillance | SV |
| Other (multiple POIs) | Other |
| Seagate Partner | SPP |
| Enterprise Drives | ED |
| Lyve Cloud | LC |
| Lyve Mobile | LM |
| Systems | Sys |

## Manual Seeding

If you need to manually seed the marketing group types, you can run the seeding script:

### Option 1: Using Docker (Recommended)

```bash
# From the project root directory
docker-compose exec backend python -m email_tool.backend.data_access.seed_marketing_group_types
```

### Option 2: Direct Python Script

```bash
# From the email_tool directory
cd email_tool
python seed_marketing_groups.py
```

### Option 3: From Backend Directory

```bash
# From the email_tool/backend directory
cd email_tool/backend
python -m data_access.seed_marketing_group_types
```

## Verification

After seeding, you can verify the marketing group types were created by:

1. **Using the API**: Visit `http://localhost:8000/marketing-group-types` in your browser
2. **Using the Frontend**: Navigate to "Marketing Group Types" in the sidebar
3. **Database Query**: Connect to the PostgreSQL database and run:
   ```sql
   SELECT * FROM marketing_group_types;
   ```

## Troubleshooting

If you encounter issues:

1. **Database Connection**: Ensure the PostgreSQL database is running
2. **Permissions**: Make sure the database user has CREATE permissions
3. **Duplicate Entries**: The script is idempotent - it won't create duplicate entries
4. **Logs**: Check the backend logs for any error messages

## Adding New Types

To add new marketing group types:

1. Edit `email_tool/backend/data_access/seed_marketing_group_types.py`
2. Add new entries to the `MARKETING_GROUP_TYPES` list
3. Restart the backend application or run the seeding script manually

The format is:
```python
{"label": "Display Name", "code": "SHORT_CODE"}
``` 