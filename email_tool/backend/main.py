from fastapi import FastAPI, UploadFile, File, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Campaign, Template, Placeholder, LocalizedCopy, GeneratedEmail, PlaywrightResult
from jinja2 import Template as JinjaTemplate
import re

DATABASE_URL = 'sqlite:///../db.sqlite3'
engine = create_engine(DATABASE_URL, connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post('/campaign')
def create_campaign(name: str):
    db = SessionLocal()
    campaign = Campaign(name=name)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    db.close()
    return {'id': campaign.id, 'name': campaign.name}

@app.post('/template')
def upload_template(campaign_id: int, file: UploadFile = File(...)):
    db = SessionLocal()
    campaign = db.query(Campaign).get(campaign_id)
    if not campaign:
        db.close()
        raise HTTPException(status_code=404, detail='Campaign not found')
    content = file.file.read().decode('utf-8')
    template = Template(campaign_id=campaign_id, filename=file.filename, content=content)
    db.add(template)
    # extract placeholders
    keys = set(re.findall(r'{{\s*(\w+)\s*}}', content))
    for key in keys:
        db.add(Placeholder(template=template, key=key))
    db.commit()
    db.refresh(template)
    db.close()
    return {'template_id': template.id, 'placeholders': list(keys)}

@app.get('/placeholders/{template_id}')
def get_placeholders(template_id: int):
    db = SessionLocal()
    placeholders = db.query(Placeholder).filter_by(template_id=template_id).all()
    db.close()
    return {'placeholders': [p.key for p in placeholders]}

@app.post('/copy/{campaign_id}/{language}')
def submit_copy(campaign_id: int, language: str, key: str, value: str):
    db = SessionLocal()
    campaign = db.query(Campaign).get(campaign_id)
    if not campaign:
        db.close()
        raise HTTPException(status_code=404, detail='Campaign not found')
    copy = LocalizedCopy(campaign_id=campaign_id, language=language, key=key, value=value)
    db.add(copy)
    db.commit()
    db.refresh(copy)
    db.close()
    return {'id': copy.id}

@app.post('/generate/{campaign_id}')
def generate_emails(campaign_id: int):
    db = SessionLocal()
    campaign = db.query(Campaign).get(campaign_id)
    if not campaign:
        db.close()
        raise HTTPException(status_code=404, detail='Campaign not found')
    templates = campaign.templates
    emails = []
    for template in templates:
        placeholders = {p.key for p in template.placeholders}
        copies = db.query(LocalizedCopy).filter_by(campaign_id=campaign_id).all()
        languages = {c.language for c in copies}
        for lang in languages:
            lang_copy = {c.key: c.value for c in copies if c.language == lang}
            if not placeholders.issubset(lang_copy.keys()):
                continue
            jinja = JinjaTemplate(template.content)
            html = jinja.render(**lang_copy)
            email = GeneratedEmail(campaign_id=campaign_id, language=lang, html_content=html)
            db.add(email)
            emails.append({'language': lang, 'content': html})
    db.commit()
    db.close()
    return {'generated': emails}

@app.post('/test/{campaign_id}')
def run_tests(campaign_id: int):
    # Placeholder for actual Playwright integration
    db = SessionLocal()
    emails = db.query(GeneratedEmail).filter_by(campaign_id=campaign_id).all()
    for email in emails:
        result = PlaywrightResult(generated_email_id=email.id, passed=True, issues='[]')
        db.add(result)
    db.commit()
    db.close()
    return {'tested': len(emails)}
