from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from ..data_access.database import get_db
from ..services.campaign_service import CampaignService
from ..services.template_service import TemplateService
from ..services.copy_service import CopyService
from ..services.email_service import EmailService
from ..services.test_service import TestService
from ..services.tag_service import TagService
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

campaign_service = CampaignService()
template_service = TemplateService()
copy_service = CopyService()
email_service = EmailService()
test_service = TestService()
tag_service = TagService()

class TagCreate(BaseModel):
    name: str
    color: str
    description: Optional[str] = None

class TagUpdate(BaseModel):
    name: str
    color: str
    description: Optional[str] = None


@router.post('/campaign')
async def create_campaign(name: str, db: AsyncSession = Depends(get_db)):
    campaign = await campaign_service.create_campaign(db, name)
    return {'id': campaign.id, 'name': campaign.name}


@router.put('/campaign/{campaign_id}')
async def update_campaign(campaign_id: int, name: str, db: AsyncSession = Depends(get_db)):
    campaign = await campaign_service.update_campaign(db, campaign_id, name)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'id': campaign.id, 'name': campaign.name}


@router.post('/template')
async def upload_template(
    campaign_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = (await file.read()).decode('utf-8')
    template, keys = await template_service.upload_template(db, campaign_id, file.filename, content)
    if not template:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'template_id': template.id, 'placeholders': keys}


@router.get('/placeholders/{template_id}')
async def get_placeholders(template_id: int, db: AsyncSession = Depends(get_db)):
    keys = await template_service.get_placeholders(db, template_id)
    return {'placeholders': keys}


@router.post('/copy/{campaign_id}/{language}')
async def submit_copy(
    campaign_id: int,
    language: str,
    key: str,
    value: str,
    db: AsyncSession = Depends(get_db),
):
    copy = await copy_service.submit_copy(db, campaign_id, language, key, value)
    if not copy:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'id': copy.id}


@router.post('/generate/{campaign_id}')
async def generate_emails(campaign_id: int, db: AsyncSession = Depends(get_db)):
    emails = await email_service.generate_emails(db, campaign_id)
    if emails is None:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'generated': emails}


@router.post('/test/{campaign_id}')
async def run_tests(campaign_id: int, db: AsyncSession = Depends(get_db)):
    count = await test_service.run_tests(db, campaign_id)
    return {'tested': count}


@router.get('/tags')
async def get_tags(db: AsyncSession = Depends(get_db)):
    """Get all tags with campaign counts"""
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

@router.post('/campaigns/{campaign_id}/tags/{tag_id}')
async def add_tag_to_campaign(campaign_id: int, tag_id: int, db: AsyncSession = Depends(get_db)):
    """Add a tag to a campaign"""
    success = await tag_service.add_tag_to_campaign(db, campaign_id, tag_id)
    if not success:
        raise HTTPException(status_code=400, detail='Failed to add tag to campaign')
    return {'message': 'Tag added to campaign successfully'}

@router.delete('/campaigns/{campaign_id}/tags/{tag_id}')
async def remove_tag_from_campaign(campaign_id: int, tag_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a tag from a campaign"""
    success = await tag_service.remove_tag_from_campaign(db, campaign_id, tag_id)
    if not success:
        raise HTTPException(status_code=400, detail='Failed to remove tag from campaign')
    return {'message': 'Tag removed from campaign successfully'}

@router.get('/campaigns')
async def get_campaigns(db: AsyncSession = Depends(get_db)):
    """Get all campaigns with template and language counts"""
    campaigns = await campaign_service.get_all_campaigns(db)
    return campaigns

@router.get('/templates')
async def get_templates(db: AsyncSession = Depends(get_db)):
    """Get all templates with campaign information"""
    templates = await template_service.get_all_templates(db)
    return templates

@router.delete('/template/{template_id}')
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a template"""
    success = await template_service.delete_template(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail='Template not found')
    return {'message': 'Template deleted successfully'}

