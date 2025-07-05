from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import Optional
from ..models.template import Template

class TemplateRepository:
    async def get_all(self, db: AsyncSession, project_id: Optional[int] = None, marketing_group_id: Optional[int] = None):
        query = select(Template).order_by(Template.created_at.desc())
        if project_id is not None:
            query = query.filter(Template.project_id == project_id)
        if marketing_group_id is not None:
            query = query.filter(Template.marketing_group_id == marketing_group_id)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_marketing_group(self, db: AsyncSession, marketing_group_id: int):
        result = await db.execute(select(Template).where(Template.marketing_group_id == marketing_group_id))
        return result.scalars().all()

    async def get_by_project(self, db: AsyncSession, project_id: int):
        result = await db.execute(select(Template).where(Template.project_id == project_id))
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