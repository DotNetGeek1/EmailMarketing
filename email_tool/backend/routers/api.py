from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from ..data_access.database import get_db
from ..services.project_service import ProjectService
from ..services.marketing_group_service import MarketingGroupService
from ..services.template_service import TemplateService
from ..services.copy_service import CopyService
from ..services.email_service import EmailService
from ..services.test_service import TestService
from ..services.tag_service import TagService
from ..services.test_builder_service import TestBuilderService
from ..services.template_render_service import TemplateRenderService
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from sqlalchemy import select
from ..models.generated_email import GeneratedEmail
from ..models.customer import Customer
from ..models.copy_comment import CopyComment
from fastapi.responses import JSONResponse

router = APIRouter()

project_service = ProjectService()
marketing_group_service = MarketingGroupService()
template_service = TemplateService()
copy_service = CopyService()
email_service = EmailService()
test_service = TestService()
tag_service = TagService()
test_builder_service = TestBuilderService()
template_render_service = TemplateRenderService()

class TagCreate(BaseModel):
    name: str
    color: str
    description: Optional[str] = None

class TagUpdate(BaseModel):
    name: str
    color: str
    description: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class TestStep(BaseModel):
    type: str
    selector: str
    text: Optional[str] = None

class TestConfig(BaseModel):
    steps: List[TestStep]

from ..data_access.customer_repository import CustomerRepository

customer_repository = CustomerRepository()

@router.post('/customer')
async def create_customer(name: str = Form(...), db: AsyncSession = Depends(get_db)):
    customer = Customer(name=name)
    customer = await customer_repository.create(db, customer)
    return {'id': customer.id, 'name': customer.name, 'created_at': customer.created_at.isoformat()}

@router.get('/customers')
async def get_customers(db: AsyncSession = Depends(get_db)):
    customers = await customer_repository.get_all(db)
    return [
        {'id': c.id, 'name': c.name, 'created_at': c.created_at.isoformat()}
        for c in customers
    ]


@router.get('/marketing-groups')
async def get_marketing_groups(project_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Get all marketing groups, optionally filtered by project_id"""
    groups = await marketing_group_service.get_all_groups(db, project_id=project_id)
    return groups


@router.post('/marketing-groups')
async def create_marketing_group(
    project_id: int = Form(...),
    marketing_group_type_id: int = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Create a new marketing group for a project and type (enforces uniqueness)"""
    try:
        group = await marketing_group_service.create_group(db, project_id, marketing_group_type_id)
        # Get the group with the relationship loaded
        group_with_type = await marketing_group_service.get_group_by_id(db, group.id)
        if not group_with_type:
            raise HTTPException(status_code=500, detail='Failed to retrieve created marketing group')
        
        return {
            'id': group_with_type.id,
            'project_id': group_with_type.project_id,
            'type': {
                'id': group_with_type.type.id,
                'label': group_with_type.type.label,
                'code': group_with_type.type.code
            },
            'created_at': group_with_type.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/marketing-groups/{group_id}')
async def delete_marketing_group(group_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a marketing group"""
    try:
        success = await marketing_group_service.delete_group(db, group_id)
        if not success:
            raise HTTPException(status_code=404, detail='Marketing group not found')
        return {'message': 'Marketing group deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/marketing-group-types')
async def get_marketing_group_types(db: AsyncSession = Depends(get_db)):
    """Get all marketing group types"""
    types = await marketing_group_service.get_all_types(db)
    return types


@router.post('/marketing-group-types')
async def create_marketing_group_type(
    label: str = Form(...),
    code: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Create a new marketing group type"""
    try:
        group_type = await marketing_group_service.create_type(db, label, code)
        return {
            'id': group_type.id,
            'label': group_type.label,
            'code': group_type.code
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/marketing-group-types/{type_id}')
async def update_marketing_group_type(
    type_id: int,
    label: str = Form(...),
    code: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Update a marketing group type"""
    try:
        group_type = await marketing_group_service.update_type(db, type_id, label, code)
        if not group_type:
            raise HTTPException(status_code=404, detail='Marketing group type not found')
        return {
            'id': group_type.id,
            'label': group_type.label,
            'code': group_type.code
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/marketing-group-types/{type_id}')
async def delete_marketing_group_type(type_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a marketing group type"""
    try:
        success = await marketing_group_service.delete_type(db, type_id)
        if not success:
            raise HTTPException(status_code=404, detail='Marketing group type not found')
        return {'message': 'Marketing group type deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/project')
async def create_project(
    name: str = Form(...), 
    customer_id: int = Form(None), 
    db: AsyncSession = Depends(get_db)
):
    try:
        project = await project_service.create_project(db, name, customer_id)
        return {
            'id': project.id, 
            'name': project.name,
            'created_at': project.created_at.isoformat(),
            'status': project.status,
            'customer_id': project.customer_id,
            'templates_count': 0,
            'languages_count': 0
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put('/project/{project_id}')
async def update_project(project_id: int, name: str = Form(...), db: AsyncSession = Depends(get_db)):
    project = await project_service.update_project(db, project_id, name)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    return {'id': project.id, 'name': project.name, 'status': project.status}


@router.put('/project/{project_id}/status')
async def update_project_status(project_id: int, status_update: StatusUpdate, db: AsyncSession = Depends(get_db)):
    project = await project_service.update_project_status(db, project_id, status_update.status)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    return {'id': project.id, 'name': project.name, 'status': project.status}


@router.post('/template')
async def upload_template(
    project_id: int = Form(...),
    marketing_group_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file provided')
    
    try:
        content = (await file.read()).decode('utf-8')
        template, keys, created_tags = await template_service.upload_template(db, project_id, marketing_group_id, file.filename, content)
        if not template:
            raise HTTPException(status_code=404, detail='Project not found')
        
        # Generate preview image in background
        try:
            template_id = getattr(template, 'id')
            await template_render_service.get_template_preview(db, template_id)
        except Exception as preview_error:
            # Don't fail the upload if preview generation fails
            print(f"Failed to generate preview for template {getattr(template, 'id')}: {preview_error}")
        
        return {
            'template_id': template.id, 
            'placeholders': keys,
            'created_tags': created_tags,
            'message': f'Template uploaded successfully. {len(created_tags)} new tags were created.'
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/placeholders/{template_id}')
async def get_placeholders(template_id: int, db: AsyncSession = Depends(get_db)):
    keys = await template_service.get_placeholders(db, template_id)
    return {'placeholders': keys}


@router.get('/copy/{project_id}')
async def get_project_copy(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get all copy entries for a project"""
    copies = await copy_service.get_copies(db, project_id)
    return [
        {
            'id': copy.id,
            'project_id': copy.project_id,
            'locale': copy.locale,
            'key': copy.key,
            'value': copy.value,
            'status': copy.status,
            'created_at': copy.created_at.isoformat()
        }
        for copy in copies
    ]


@router.get('/localized-copy')
async def get_localized_copy(
    project_id: Optional[int] = None, 
    template_id: Optional[int] = None, 
    db: AsyncSession = Depends(get_db)
):
    """Get localized copy entries filtered by project_id and/or template_id"""
    if template_id and project_id:
        copies = await copy_service.get_copies_by_template(db, project_id, template_id)
    elif project_id:
        copies = await copy_service.get_copies(db, project_id)
    else:
        copies = []
    
    return [
        {
            'id': copy.id,
            'project_id': copy.project_id,
            'template_id': copy.template_id,
            'locale': copy.locale,
            'placeholder_name': copy.key,
            'copy_text': copy.value,
            'status': copy.status,
            'created_at': copy.created_at.isoformat()
        }
        for copy in copies
    ]


@router.post('/localized-copy')
async def create_localized_copy(
    project_id: int = Form(...),
    template_id: int = Form(...),
    placeholder_name: str = Form(...),
    copy_text: str = Form(...),
    locale: str = Form(...),
    status: str = Form('Draft'),
    db: AsyncSession = Depends(get_db)
):
    """Create a new localized copy entry"""
    try:
        copy = await copy_service.create_copy(
            db, project_id, template_id, placeholder_name, copy_text, locale, status
        )
        if not copy:
            raise HTTPException(status_code=400, detail='Failed to create copy entry')
        
        return {
            'id': copy.id,
            'project_id': copy.project_id,
            'template_id': copy.template_id,
            'locale': copy.locale,
            'placeholder_name': copy.key,
            'copy_text': copy.value,
            'status': copy.status,
            'created_at': copy.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete('/localized-copy/{copy_id}')
async def delete_localized_copy(copy_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a localized copy entry"""
    try:
        await copy_service.localized_copy_repository.delete(db, copy_id)
        return {'message': 'Copy entry deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/copy/{project_id}/{locale}')
async def submit_copy(
    project_id: int,
    locale: str,
    key: str = Form(...),
    value: str = Form(...),
    status: str = Form('Draft'),
    db: AsyncSession = Depends(get_db),
):
    copy = await copy_service.submit_copy(db, project_id, locale, key, value, status)
    if not copy:
        raise HTTPException(status_code=404, detail='Project not found')
    return {'id': copy.id}


@router.put('/copy/{copy_id}/status')
async def update_copy_status(copy_id: int, status: str = Form(...), db: AsyncSession = Depends(get_db)):
    updated = await copy_service.update_copy_status(db, copy_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail='Copy entry not found')
    return {'id': copy_id, 'status': status}


@router.delete('/copy/{project_id}/{locale}/{key}')
async def delete_copy(
    project_id: int,
    locale: str,
    key: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific copy entry"""
    success = await copy_service.delete_copy(db, project_id, locale, key)
    if not success:
        raise HTTPException(status_code=404, detail='Copy entry not found')
    return {'message': 'Copy entry deleted successfully'}


@router.delete('/copy/{project_id}/{locale}')
async def delete_locale_copies(
    project_id: int,
    locale: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete all copy entries for a specific locale in a project"""
    count = await copy_service.delete_copies_for_locale(db, project_id, locale)
    return {'message': f'Deleted {count} copy entries for locale {locale}'}


@router.post('/generate/{project_id}')
async def generate_emails(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await email_service.generate_emails(db, project_id)
    if result is None:
        raise HTTPException(status_code=404, detail='Project not found')
    return result


@router.post('/test/{project_id}')
async def run_tests(
    project_id: int, 
    test_config: Optional[TestConfig] = None,
    db: AsyncSession = Depends(get_db)
):
    count = await test_service.run_tests(db, project_id, test_config.dict() if test_config else None)
    return {'tested': count}


@router.get('/tags')
async def get_tags(db: AsyncSession = Depends(get_db)):
    """Get all tags with project counts"""
    tags = await tag_service.get_all_tags(db)
    return tags

@router.post('/tags')
async def create_tag(tag_data: TagCreate, db: AsyncSession = Depends(get_db)):
    """Create a new tag"""
    try:
        tag = await tag_service.create_tag(db, tag_data.name, tag_data.color, tag_data.description)
        return {
            'id': tag.id,
            'name': tag.name,
            'color': tag.color,
            'description': tag.description,
            'created_at': tag.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put('/tags/{tag_id}')
async def update_tag(tag_id: int, tag_data: TagUpdate, db: AsyncSession = Depends(get_db)):
    """Update a tag"""
    tag = await tag_service.update_tag(db, tag_id, tag_data.name, tag_data.color, tag_data.description)
    if not tag:
        raise HTTPException(status_code=404, detail='Tag not found')
    return {
        'id': tag.id,
        'name': tag.name,
        'color': tag.color,
        'description': tag.description,
        'created_at': tag.created_at.isoformat()
    }

@router.delete('/tags/{tag_id}')
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a tag"""
    success = await tag_service.delete_tag(db, tag_id)
    if not success:
        raise HTTPException(status_code=404, detail='Tag not found')
    return {'message': 'Tag deleted successfully'}

@router.post('/projects/{project_id}/tags/{tag_id}')
async def add_tag_to_project(project_id: int, tag_id: int, db: AsyncSession = Depends(get_db)):
    """Add a tag to a project"""
    success = await tag_service.add_tag_to_project(db, project_id, tag_id)
    if not success:
        raise HTTPException(status_code=400, detail='Failed to add tag to project')
    return {'message': 'Tag added to project successfully'}

@router.delete('/projects/{project_id}/tags/{tag_id}')
async def remove_tag_from_project(project_id: int, tag_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a tag from a project"""
    success = await tag_service.remove_tag_from_project(db, project_id, tag_id)
    if not success:
        raise HTTPException(status_code=400, detail='Failed to remove tag from project')
    return {'message': 'Tag removed from project successfully'}

@router.get('/projects')
async def get_projects(customer_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Get all projects with template and language counts, optionally filtered by customer_id"""
    projects = await project_service.get_projects(db, customer_id=customer_id)
    return projects

@router.get('/templates')
async def get_templates(project_id: Optional[int] = None, marketing_group_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Get all templates with project information, optionally filtered by project_id and marketing_group_id"""
    templates = await template_service.get_all_templates(db, project_id, marketing_group_id)
    return templates

@router.delete('/template/{template_id}')
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a template"""
    success = await template_service.delete_template(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail='Template not found')
    # Also delete any preview images
    await template_render_service.delete_template_previews(template_id)
    return {'message': 'Template deleted successfully'}

@router.get('/template/{template_id}/preview')
async def get_template_preview(template_id: int, db: AsyncSession = Depends(get_db)):
    """Get template preview with rendered image"""
    try:
        preview = await template_render_service.get_template_preview(db, template_id)
        return preview
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")

@router.post('/template/{template_id}/preview/regenerate')
async def regenerate_template_preview(template_id: int, db: AsyncSession = Depends(get_db)):
    """Regenerate template preview image"""
    try:
        # Delete existing previews first
        await template_render_service.delete_template_previews(template_id)
        # Generate new preview
        preview = await template_render_service.get_template_preview(db, template_id)
        return preview
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate preview: {str(e)}")

from ..data_access.generated_email_repository import GeneratedEmailRepository

generated_email_repository = GeneratedEmailRepository()

@router.get('/emails/{project_id}')
async def get_generated_emails(project_id: int, db: AsyncSession = Depends(get_db)):
    emails = await generated_email_repository.get_by_project(db, project_id)
    # Compose thumbnail URL
    results = []
    for email in emails:
        guid = str(email.id)  # fallback to id for filename if needed
        screenshot_filename = f"{guid}.png"
        thumbnail_url = f"/static/screenshots/{screenshot_filename}"
        results.append({
            'id': email.id,
            'project_id': email.project_id,
            'language': email.language,
            'html_content': email.html_content,
            'generated_at': email.generated_at.isoformat() if getattr(email, 'generated_at', None) else None,
            'thumbnail_url': thumbnail_url
        })
    return results

from ..data_access.copy_comment_repository import CopyCommentRepository

copy_comment_repository = CopyCommentRepository()

@router.get('/copy/{copy_id}/comments')
async def get_copy_comments(copy_id: int, db: AsyncSession = Depends(get_db)):
    comments = await copy_comment_repository.get_by_copy(db, copy_id)
    return [
        {
            'id': c.id,
            'copy_id': c.copy_id,
            'comment': c.comment,
            'created_at': c.created_at.isoformat(),
            'user': c.user
        }
        for c in comments
    ]

@router.post('/copy/{copy_id}/comments')
async def add_copy_comment(copy_id: int, comment: str = Form(...), user: str = Form(None), db: AsyncSession = Depends(get_db)):
    new_comment = CopyComment(copy_id=copy_id, comment=comment, user=user)
    new_comment = await copy_comment_repository.create(db, new_comment)
    return {
        'id': new_comment.id,
        'copy_id': new_comment.copy_id,
        'comment': new_comment.comment,
        'created_at': new_comment.created_at.isoformat(),
        'user': new_comment.user
    }


# Test Builder API Endpoints

class TestStepCreate(BaseModel):
    step_order: int
    action: str
    selector: Optional[str] = None
    value: Optional[str] = None
    attr: Optional[str] = None
    description: Optional[str] = None

class TestStepUpdate(BaseModel):
    step_order: int
    action: str
    selector: Optional[str] = None
    value: Optional[str] = None
    attr: Optional[str] = None
    description: Optional[str] = None

@router.post('/test-builder/scenario')
async def create_test_scenario(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Create a new test scenario with uploaded HTML file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file provided')
    
    try:
        content = (await file.read()).decode('utf-8')
        scenario = await test_builder_service.create_test_scenario(
            db, name, description, content, file.filename
        )
        return {
            'id': scenario.id,
            'name': scenario.name,
            'description': scenario.description,
            'html_filename': scenario.html_filename,
            'created_at': scenario.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/test-builder/scenarios')
async def get_test_scenarios(db: AsyncSession = Depends(get_db)):
    """Get all test scenarios with step counts and latest results"""
    scenarios = await test_builder_service.get_test_scenarios(db)
    return scenarios

@router.get('/test-builder/scenario/{scenario_id}')
async def get_test_scenario(scenario_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific test scenario with all its steps and results"""
    scenario = await test_builder_service.get_test_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail='Test scenario not found')
    return scenario

@router.post('/test-builder/scenario/{scenario_id}/extract-testids')
async def extract_data_testids(scenario_id: int, db: AsyncSession = Depends(get_db)):
    """Extract data-testid attributes from the HTML content of a scenario"""
    scenario = await test_builder_service.get_test_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail='Test scenario not found')
    
    testids = await test_builder_service.extract_data_testids(scenario['html_content'])
    return {'testids': testids}

@router.post('/test-builder/scenario/{scenario_id}/step')
async def add_test_step(
    scenario_id: int,
    step_data: TestStepCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a test step to a scenario"""
    try:
        step = await test_builder_service.add_test_step(
            db, scenario_id, step_data.step_order, step_data.action,
            step_data.selector, step_data.value, step_data.attr, step_data.description
        )
        return {
            'id': step.id,
            'step_order': step.step_order,
            'action': step.action,
            'selector': step.selector,
            'value': step.value,
            'attr': step.attr,
            'description': step.description
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put('/test-builder/step/{step_id}')
async def update_test_step(
    step_id: int,
    step_data: TestStepUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a test step"""
    step = await test_builder_service.update_test_step(
        db, step_id, step_data.step_order, step_data.action,
        step_data.selector, step_data.value, step_data.attr, step_data.description
    )
    if not step:
        raise HTTPException(status_code=404, detail='Test step not found')
    return {
        'id': step.id,
        'step_order': step.step_order,
        'action': step.action,
        'selector': step.selector,
        'value': step.value,
        'attr': step.attr,
        'description': step.description
    }

@router.delete('/test-builder/step/{step_id}')
async def delete_test_step(step_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a test step"""
    success = await test_builder_service.delete_test_step(db, step_id)
    if not success:
        raise HTTPException(status_code=404, detail='Test step not found')
    return {'message': 'Test step deleted successfully'}

@router.delete('/test-builder/scenario/{scenario_id}')
async def delete_test_scenario(scenario_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a test scenario and all its steps and results"""
    success = await test_builder_service.delete_test_scenario(db, scenario_id)
    if not success:
        raise HTTPException(status_code=404, detail='Test scenario not found')
    return {'message': 'Test scenario deleted successfully'}

@router.post('/test-builder/scenario/{scenario_id}/run')
async def run_test_scenario(scenario_id: int, db: AsyncSession = Depends(get_db)):
    """Run a test scenario and return results"""
    result = await test_builder_service.run_test_scenario(db, scenario_id)
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    return result

class LocalizedCopyBulkCreate(BaseModel):
    project_id: int
    template_id: int
    placeholder_name: str
    copy_text: str
    locale: str
    status: str = 'Draft'

@router.post("/localized-copy/bulk")
async def bulk_create_copy(
    items: List[LocalizedCopyBulkCreate],
    db: AsyncSession = Depends(get_db)
):
    # Validate all items have a valid template_id
    for idx, item in enumerate(items):
        if not hasattr(item, 'template_id') or item.template_id is None:
            return JSONResponse(status_code=400, content={"error": f"Row {idx+1} is missing template_id. All rows must include a valid template_id."})
    try:
        result = await copy_service.bulk_create_copies(db, [item.dict() for item in items])
        return {"inserted": len(result)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

