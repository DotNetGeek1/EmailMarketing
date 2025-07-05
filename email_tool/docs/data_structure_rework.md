# Data Structure Rework

This document outlines the planned changes to the hierarchy used in the Email Marketing tool.

## Current Hierarchy
```
Customer -> Campaign -> Template -> Copy
```

## Proposed Hierarchy
```
Customer -> Project (Campaign) -> Marketing Group -> Template -> Copy -> Locale Version
```
Each **Project** represents what was previously called a *Campaign*. A Marketing Group provides another level of organisation under a project.  A single copy may then have one or more locale versions.

### Marketing Group Labels
The following labels will be used for Marketing Groups.

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

These codes can be used in the database or API responses to identify the group.

## Next Steps
1. Update the database schema to add a `marketing_group` table (or field) linked to projects.
2. Update the API and frontend labels to reflect "Project" instead of "Campaign".
3. Support locale‐specific versions of each copy entry.
