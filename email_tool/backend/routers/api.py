from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from ..data_access.database import get_db
from ..services.campaign_service import CampaignService
from ..services.template_service import TemplateService
from ..services.copy_service import CopyService
from ..services.email_service import EmailService
from ..services.test_service import TestService

router = APIRouter()

campaign_service = CampaignService()
template_service = TemplateService()
copy_service = CopyService()
email_service = EmailService()
test_service = TestService()


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

