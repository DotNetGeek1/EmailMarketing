from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.localized_copy import LocalizedCopy

class LocalizedCopyRepository:
    async def get_by_template(self, db: AsyncSession, template_id: int):
        result = await db.execute(select(LocalizedCopy).where(LocalizedCopy.template_id == template_id))
        return result.scalars().all()

    async def get(self, db: AsyncSession, copy_id: int):
        result = await db.execute(select(LocalizedCopy).where(LocalizedCopy.id == copy_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, copy: LocalizedCopy):
        db.add(copy)
        await db.commit()
        await db.refresh(copy)
        return copy

    async def delete(self, db: AsyncSession, copy_id: int):
        await db.execute(delete(LocalizedCopy).where(LocalizedCopy.id == copy_id))
        await db.commit() 