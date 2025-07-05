from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.marketing_group import MarketingGroup

class MarketingGroupRepository:
    async def get_by_project(self, db: AsyncSession, project_id: int):
        result = await db.execute(select(MarketingGroup).where(MarketingGroup.project_id == project_id))
        return result.scalars().all()

    async def get(self, db: AsyncSession, group_id: int):
        result = await db.execute(select(MarketingGroup).where(MarketingGroup.id == group_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, group: MarketingGroup):
        db.add(group)
        await db.commit()
        await db.refresh(group)
        return group

    async def delete(self, db: AsyncSession, group_id: int):
        await db.execute(delete(MarketingGroup).where(MarketingGroup.id == group_id))
        await db.commit() 