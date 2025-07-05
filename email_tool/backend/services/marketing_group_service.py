from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import MarketingGroup, MarketingGroupType
from typing import List, Dict, Any, Optional

class MarketingGroupService:
    async def get_all_groups(self, db: AsyncSession, project_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all marketing groups, optionally filtered by project_id"""
        query = select(MarketingGroup)
        if project_id is not None:
            query = query.filter(MarketingGroup.project_id == project_id)
        result = await db.execute(query)
        groups = result.scalars().all()
        return [
            {
                'id': group.id,
                'project_id': group.project_id,
                'type': {
                    'id': group.type.id,
                    'label': group.type.label,
                    'code': group.type.code
                },
                'created_at': group.created_at.isoformat()
            }
            for group in groups
        ]

    async def create_group(self, db: AsyncSession, project_id: int, marketing_group_type_id: int) -> MarketingGroup:
        """Create a new marketing group for a project and type (enforces uniqueness)"""
        # Check for existing group of this type for the project
        existing = await db.execute(
            select(MarketingGroup).filter(
                MarketingGroup.project_id == project_id,
                MarketingGroup.marketing_group_type_id == marketing_group_type_id
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError('This marketing group type already exists for this project')
        group = MarketingGroup(project_id=project_id, marketing_group_type_id=marketing_group_type_id)
        db.add(group)
        await db.commit()
        await db.refresh(group)
        return group

    async def get_group_by_type(self, db: AsyncSession, project_id: int, marketing_group_type_id: int) -> MarketingGroup | None:
        result = await db.execute(
            select(MarketingGroup).filter(
                MarketingGroup.project_id == project_id,
                MarketingGroup.marketing_group_type_id == marketing_group_type_id
            )
        )
        return result.scalar_one_or_none() 