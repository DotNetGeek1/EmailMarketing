from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jinja2 import Template as JinjaTemplate
from ..models import Campaign, GeneratedEmail, LocalizedCopy, Template, Placeholder


class EmailService:
    """Generate localized HTML emails."""

    async def generate_emails(self, db: AsyncSession, campaign_id: int) -> list[dict] | None:
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return None
        result = await db.execute(select(Template).filter_by(campaign_id=campaign_id))
        templates = result.scalars().all()
        emails: list[dict] = []
        for template in templates:
            ph_res = await db.execute(select(Placeholder.key).filter_by(template_id=template.id))
            placeholders = {row for row in ph_res.scalars().all()}
            copy_res = await db.execute(select(LocalizedCopy).filter_by(campaign_id=campaign_id))
            copies = copy_res.scalars().all()
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
        await db.commit()
        return emails

