from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.placeholder import Placeholder

class PlaceholderRepository:
    async def get_by_template(self, db: AsyncSession, template_id: int):
        result = await db.execute(select(Placeholder).where(Placeholder.template_id == template_id))
        return result.scalars().all()

    async def get_keys_by_template(self, db: AsyncSession, template_id: int):
        result = await db.execute(select(Placeholder.key).where(Placeholder.template_id == template_id))
        return result.scalars().all()

    async def create(self, db: AsyncSession, placeholder: Placeholder):
        db.add(placeholder)
        await db.commit()
        await db.refresh(placeholder)
        return placeholder

    async def delete_by_template(self, db: AsyncSession, template_id: int):
        await db.execute(delete(Placeholder).where(Placeholder.template_id == template_id))
        await db.commit() 