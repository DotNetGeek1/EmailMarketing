import re
from sqlalchemy.orm import Session
from ..models import Campaign, Template, Placeholder


class TemplateService:
    """Handle template uploads and placeholder extraction."""

    def upload_template(
        self,
        db: Session,
        campaign_id: int,
        filename: str,
        content: str,
    ) -> tuple[Template | None, list[str]]:
        campaign = db.query(Campaign).get(campaign_id)
        if not campaign:
            return None, []
        template = Template(campaign_id=campaign_id, filename=filename, content=content)
        db.add(template)
        keys = set(re.findall(r"{{\s*(\w+)\s*}}", content))
        for key in keys:
            db.add(Placeholder(template=template, key=key))
        db.commit()
        db.refresh(template)
        return template, list(keys)

    def get_placeholders(self, db: Session, template_id: int) -> list[str]:
        placeholders = db.query(Placeholder).filter_by(template_id=template_id).all()
        return [p.key for p in placeholders]
