# Data Structure Migration Summary

## Overview
This document summarizes the changes made to migrate from the old `Customer -> Campaign -> Template -> Copy` hierarchy to the new `Customer -> Project (Campaign) -> Marketing Group -> Template -> Copy -> Locale Version` hierarchy.

## ✅ Completed Changes

### 1. Database Models
- ✅ **MarketingGroup Model** (`email_tool/backend/models/marketing_group.py`)
  - Created new model with predefined marketing group codes
  - Includes relationship to projects
  - Contains default groups: D2C, CPro, CONS, Gam, NAS, SV, Other, SPP, ED, LC, LM, Sys

- ✅ **Project Model** (`email_tool/backend/models/project.py`)
  - Replaces Campaign model
  - Added `marketing_group_id` field
  - Updated all relationships to use new terminology

- ✅ **Updated Existing Models**
  - `Template`: Changed `campaign_id` → `project_id`
  - `LocalizedCopy`: Changed `campaign_id` → `project_id`
  - `GeneratedEmail`: Changed `campaign_id` → `project_id`
  - `Tag`: Updated relationship from `campaigns` → `projects`

- ✅ **Association Tables**
  - Created `project_tags` to replace `campaign_tags`
  - Updated models `__init__.py` to include new models

### 2. Services Layer
- ✅ **ProjectService** (`email_tool/backend/services/project_service.py`)
  - Replaces CampaignService
  - Added support for marketing groups
  - Updated all methods to use project terminology

- ✅ **MarketingGroupService** (`email_tool/backend/services/marketing_group_service.py`)
  - New service for managing marketing groups
  - Includes methods to create default groups
  - Provides CRUD operations for marketing groups

- ✅ **Updated Existing Services**
  - `CopyService`: Updated all methods to use `project_id`
  - `TemplateService`: Updated all methods to use `project_id`
  - `EmailService`: Updated all methods to use `project_id`
  - `TestService`: Updated all methods to use `project_id`
  - `TagService`: Updated to use `project_tags` and project terminology

### 3. Database Migration
- ✅ **Migration Script** (`email_tool/backend/migrate_to_project_structure.py`)
  - Creates marketing_group table with default data
  - Creates project table
  - Migrates existing campaign data to project table
  - Updates all foreign key references
  - Drops old campaign tables
  - Includes verification steps

## 🔄 Still Need to Update

### 1. API Routes (`email_tool/backend/routers/api.py`)
**High Priority**
- [ ] Rename all `/campaign` endpoints to `/project`
- [ ] Update all request/response models to use project terminology
- [ ] Add marketing group endpoints:
  - `GET /marketing-groups` - List all marketing groups
  - `POST /marketing-groups` - Create new marketing group
  - `PUT /marketing-groups/{id}` - Update marketing group
  - `DELETE /marketing-groups/{id}` - Delete marketing group
- [ ] Update project creation to include marketing group selection
- [ ] Update all existing endpoints to use project_id instead of campaign_id

### 2. Frontend Components
**High Priority**
- [ ] Rename components:
  - `CampaignList.tsx` → `ProjectList.tsx`
  - `CampaignOverview.tsx` → `ProjectOverview.tsx`
  - `CampaignCopy.tsx` → `ProjectCopy.tsx`
  - `CampaignEmails.tsx` → `ProjectEmails.tsx`
  - `CampaignTemplates.tsx` → `ProjectTemplates.tsx`
  - `CampaignTags.tsx` → `ProjectTags.tsx`

- [ ] Rename pages:
  - `Campaigns.tsx` → `Projects.tsx`
  - `CampaignDetail.tsx` → `ProjectDetail.tsx`

- [ ] Update contexts:
  - `CampaignContext.tsx` → `ProjectContext.tsx`

- [ ] Update all UI labels from "Campaign" to "Project"
- [ ] Add marketing group selection UI in project creation/editing
- [ ] Update all API calls to use new endpoints
- [ ] Update navigation and breadcrumbs

### 3. Test Files
**Medium Priority**
- [ ] Update `test_api.py` to use project endpoints
- [ ] Update `test_copy_api.py` to use project endpoints
- [ ] Update any other test files that reference campaigns

### 4. Documentation
**Low Priority**
- [ ] Update API documentation
- [ ] Update user guides
- [ ] Update README files

## 🚀 Migration Steps

### Step 1: Run Database Migration
```bash
cd email_tool/backend
python migrate_to_project_structure.py
```

### Step 2: Update API Routes
1. Update all endpoint paths from `/campaign` to `/project`
2. Add marketing group endpoints
3. Update all request/response models
4. Test API endpoints

### Step 3: Update Frontend
1. Rename all component files
2. Update all imports and references
3. Update UI labels and terminology
4. Add marketing group selection UI
5. Test frontend functionality

### Step 4: Testing
1. Test database migration with existing data
2. Test all API endpoints
3. Test frontend functionality
4. Test end-to-end workflows

## 📋 Checklist for Completion

### Backend
- [ ] Update API routes
- [ ] Add marketing group endpoints
- [ ] Test all services
- [ ] Run database migration
- [ ] Verify data integrity

### Frontend
- [ ] Rename all components
- [ ] Update all imports
- [ ] Update UI labels
- [ ] Add marketing group UI
- [ ] Test all functionality

### Testing
- [ ] Update test files
- [ ] Run full test suite
- [ ] Test migration with real data
- [ ] Verify no data loss

## 🔧 Rollback Plan

If issues arise during migration:

1. **Database Rollback**: Restore from backup before migration
2. **Code Rollback**: Revert to previous git commit
3. **Gradual Migration**: Implement changes incrementally

## 📝 Notes

- The migration script preserves all existing data
- Marketing groups are pre-populated with the specified codes
- All relationships are maintained during migration
- The new structure supports the enhanced hierarchy as specified in the data structure rework document

## 🎯 Next Steps

1. **Immediate**: Update API routes and test backend changes
2. **Short-term**: Update frontend components and test UI
3. **Medium-term**: Update documentation and run full testing
4. **Long-term**: Monitor for any issues and optimize as needed 