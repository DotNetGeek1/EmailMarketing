from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
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
def create_campaign(name: str, db: Session = Depends(get_db)):
    campaign = campaign_service.create_campaign(db, name)
    return {'id': campaign.id, 'name': campaign.name}


@router.put('/campaign/{campaign_id}')
def update_campaign(campaign_id: int, name: str, db: Session = Depends(get_db)):
    campaign = campaign_service.update_campaign(db, campaign_id, name)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'id': campaign.id, 'name': campaign.name}


@router.post('/template')
def upload_template(
    campaign_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = file.file.read().decode('utf-8')
    template, keys = template_service.upload_template(db, campaign_id, file.filename, content)
    if not template:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'template_id': template.id, 'placeholders': keys}


@router.get('/placeholders/{template_id}')
def get_placeholders(template_id: int, db: Session = Depends(get_db)):
    keys = template_service.get_placeholders(db, template_id)
    return {'placeholders': keys}


@router.post('/copy/{campaign_id}/{language}')
def submit_copy(
    campaign_id: int,
    language: str,
    key: str,
    value: str,
    db: Session = Depends(get_db),
):
    copy = copy_service.submit_copy(db, campaign_id, language, key, value)
    if not copy:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'id': copy.id}


@router.post('/generate/{campaign_id}')
def generate_emails(campaign_id: int, db: Session = Depends(get_db)):
    emails = email_service.generate_emails(db, campaign_id)
    if emails is None:
        raise HTTPException(status_code=404, detail='Campaign not found')
    return {'generated': emails}


@router.post('/test/{campaign_id}')
def run_tests(campaign_id: int, db: Session = Depends(get_db)):
    count = test_service.run_tests(db, campaign_id)
    return {'tested': count}
