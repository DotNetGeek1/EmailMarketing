import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import Campaign, Template, Placeholder


class TemplateService:
    """Handle template uploads and placeholder extraction."""

    async def upload_template(
        self,
        db: AsyncSession,
        campaign_id: int,
        filename: str,
        content: str,
    ) -> tuple[Template | None, list[str]]:
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return None, []
        template = Template(campaign_id=campaign_id, filename=filename, content=content)
        db.add(template)
        keys = set(re.findall(r"{{\s*(\w+)\s*}}", content))
        for key in keys:
            db.add(Placeholder(template=template, key=key))
        await db.commit()
        await db.refresh(template)
        return template, list(keys)

    async def get_placeholders(self, db: AsyncSession, template_id: int) -> list[str]:
        result = await db.execute(select(Placeholder.key).filter_by(template_id=template_id))
        return result.scalars().all()
