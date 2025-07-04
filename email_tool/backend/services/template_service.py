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
        return list(result.scalars().all())

    async def get_all_templates(self, db: AsyncSession) -> list[dict]:
        """Get all templates with campaign information and placeholders"""
        result = await db.execute(
            select(Template)
            .order_by(Template.created_at.desc())
        )
        templates = result.scalars().all()
        
        # Convert to list of dictionaries with placeholders
        template_list = []
        for template in templates:
            placeholders = await self.get_placeholders(db, int(template.id))
            template_dict = {
                'id': template.id,
                'campaign_id': template.campaign_id,
                'filename': template.filename,
                'content': template.content,
                'created_at': template.created_at.isoformat(),
                'placeholders': placeholders
            }
            template_list.append(template_dict)
        
        return template_list

    async def delete_template(self, db: AsyncSession, template_id: int) -> bool:
        """Delete a template and its placeholders"""
        template = await db.get(Template, template_id)
        if template:
            await db.delete(template)
            await db.commit()
            return True
        return False

