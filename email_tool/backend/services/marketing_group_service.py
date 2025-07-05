from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import MarketingGroup
from typing import List, Dict, Any

class MarketingGroupService:
    async def get_all_groups(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Get all marketing groups"""
        result = await db.execute(select(MarketingGroup))
        groups = result.scalars().all()
        return [
            {
                'id': group.id,
                'name': group.name,
                'code': group.code,
                'created_at': group.created_at.isoformat()
            }
            for group in groups
        ]

    async def create_default_groups(self, db: AsyncSession) -> List[MarketingGroup]:
        """Create default marketing groups if they don't exist"""
        default_groups = MarketingGroup.get_default_groups()
        created_groups = []
        
        for group_data in default_groups:
            # Check if group already exists
            existing = await db.execute(
                select(MarketingGroup).filter(MarketingGroup.code == group_data['code'])
            )
            if not existing.scalar_one_or_none():
                group = MarketingGroup(**group_data)
                db.add(group)
                created_groups.append(group)
        
        if created_groups:
            await db.commit()
            for group in created_groups:
                await db.refresh(group)
        
        return created_groups

    async def get_group_by_code(self, db: AsyncSession, code: str) -> MarketingGroup | None:
        """Get marketing group by code"""
        result = await db.execute(
            select(MarketingGroup).filter(MarketingGroup.code == code)
        )
        return result.scalar_one_or_none()

    async def create_group(self, db: AsyncSession, name: str, code: str) -> MarketingGroup:
        """Create a new marketing group"""
        group = MarketingGroup(name=name, code=code)
        db.add(group)
        await db.commit()
        await db.refresh(group)
        return group 