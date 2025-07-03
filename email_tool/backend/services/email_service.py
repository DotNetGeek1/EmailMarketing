from sqlalchemy.orm import Session
from jinja2 import Template as JinjaTemplate
from ..models import Campaign, GeneratedEmail, LocalizedCopy


class EmailService:
    """Generate localized HTML emails."""

    def generate_emails(self, db: Session, campaign_id: int) -> list[dict] | None:
        campaign = db.query(Campaign).get(campaign_id)
        if not campaign:
            return None
        templates = campaign.templates
        emails: list[dict] = []
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
                email = GeneratedEmail(
                    campaign_id=campaign_id,
                    language=lang,
                    html_content=html,
                )
                db.add(email)
                emails.append({'language': lang, 'content': html})
        db.commit()
        return emails
