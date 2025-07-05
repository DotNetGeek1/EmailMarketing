from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload
from ..models.marketing_group import MarketingGroup
from ..models.marketing_group_type import MarketingGroupType

class MarketingGroupRepository:
    async def get_all(self, db: AsyncSession):
        result = await db.execute(
            select(MarketingGroup).options(selectinload(MarketingGroup.type))
        )
        return result.scalars().all()

    async def get_by_project(self, db: AsyncSession, project_id: int):
        result = await db.execute(
            select(MarketingGroup)
            .where(MarketingGroup.project_id == project_id)
            .options(selectinload(MarketingGroup.type))
        )
        return result.scalars().all()

    async def get_by_project_and_type(self, db: AsyncSession, project_id: int, marketing_group_type_id: int):
        result = await db.execute(
            select(MarketingGroup)
            .where(
                MarketingGroup.project_id == project_id,
                MarketingGroup.marketing_group_type_id == marketing_group_type_id
            )
            .options(selectinload(MarketingGroup.type))
        )
        return result.scalar_one_or_none()

    async def get(self, db: AsyncSession, group_id: int):
        result = await db.execute(
            select(MarketingGroup)
            .where(MarketingGroup.id == group_id)
            .options(selectinload(MarketingGroup.type))
        )
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, group: MarketingGroup):
        db.add(group)
        await db.commit()
        await db.refresh(group)
        return group

    async def delete(self, db: AsyncSession, group_id: int):
        await db.execute(delete(MarketingGroup).where(MarketingGroup.id == group_id))
        await db.commit()

    async def get_by_id(self, db: AsyncSession, group_id: int):
        return await self.get(db, group_id)

    # Marketing Group Type methods
    async def get_all_types(self, db: AsyncSession):
        result = await db.execute(select(MarketingGroupType))
        return result.scalars().all()

    async def get_type_by_id(self, db: AsyncSession, type_id: int):
        result = await db.execute(select(MarketingGroupType).where(MarketingGroupType.id == type_id))
        return result.scalar_one_or_none()

    async def create_type(self, db: AsyncSession, group_type: MarketingGroupType):
        db.add(group_type)
        await db.commit()
        await db.refresh(group_type)
        return group_type

    async def update_type(self, db: AsyncSession, group_type: MarketingGroupType):
        await db.commit()
        await db.refresh(group_type)
        return group_type

    async def delete_type(self, db: AsyncSession, type_id: int):
        await db.execute(delete(MarketingGroupType).where(MarketingGroupType.id == type_id))
        await db.commit() 