from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.tag import Tag

class TagRepository:
    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(Tag))
        return result.scalars().all()

    async def get_by_name(self, db: AsyncSession, name: str):
        result = await db.execute(select(Tag).where(Tag.name == name))
        return result.scalar_one_or_none()

    async def get(self, db: AsyncSession, tag_id: int):
        result = await db.execute(select(Tag).where(Tag.id == tag_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, tag: Tag):
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
        return tag

    async def update(self, db: AsyncSession, tag: Tag):
        await db.commit()
        await db.refresh(tag)
        return tag

    async def delete(self, db: AsyncSession, tag_id: int):
        await db.execute(delete(Tag).where(Tag.id == tag_id))
        await db.commit() 