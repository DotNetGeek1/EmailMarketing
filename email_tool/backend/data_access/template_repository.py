from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.template import Template

class TemplateRepository:
    async def get_by_marketing_group(self, db: AsyncSession, marketing_group_id: int):
        result = await db.execute(select(Template).where(Template.marketing_group_id == marketing_group_id))
        return result.scalars().all()

    async def get(self, db: AsyncSession, template_id: int):
        result = await db.execute(select(Template).where(Template.id == template_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, template: Template):
        db.add(template)
        await db.commit()
        await db.refresh(template)
        return template

    async def delete(self, db: AsyncSession, template_id: int):
        await db.execute(delete(Template).where(Template.id == template_id))
        await db.commit() 