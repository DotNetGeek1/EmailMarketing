from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import MarketingGroup, MarketingGroupType
from ..data_access.marketing_group_repository import MarketingGroupRepository
from typing import List, Dict, Any, Optional

class MarketingGroupService:
    def __init__(self):
        self.marketing_group_repository = MarketingGroupRepository()

    async def get_all_groups(self, db: AsyncSession, project_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all marketing groups, optionally filtered by project_id"""
        if project_id is not None:
            groups = await self.marketing_group_repository.get_by_project(db, project_id)
        else:
            groups = await self.marketing_group_repository.get_all(db)
        
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
        existing = await self.marketing_group_repository.get_by_project_and_type(db, project_id, marketing_group_type_id)
        if existing:
            raise ValueError('This marketing group type already exists for this project')
        group = MarketingGroup(project_id=project_id, marketing_group_type_id=marketing_group_type_id)
        return await self.marketing_group_repository.create(db, group)

    async def get_group_by_type(self, db: AsyncSession, project_id: int, marketing_group_type_id: int) -> MarketingGroup | None:
        return await self.marketing_group_repository.get_by_project_and_type(db, project_id, marketing_group_type_id)

    async def get_group_by_id(self, db: AsyncSession, group_id: int) -> MarketingGroup | None:
        """Get a marketing group by ID with type relationship loaded"""
        return await self.marketing_group_repository.get(db, group_id)

    async def delete_group(self, db: AsyncSession, group_id: int) -> bool:
        """Delete a marketing group"""
        group = await self.marketing_group_repository.get_by_id(db, group_id)
        if not group:
            return False
        await self.marketing_group_repository.delete(db, group_id)
        return True

    async def get_all_types(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Get all marketing group types"""
        types = await self.marketing_group_repository.get_all_types(db)
        return [
            {
                'id': group_type.id,
                'label': group_type.label,
                'code': group_type.code
            }
            for group_type in types
        ]

    async def create_type(self, db: AsyncSession, label: str, code: str) -> MarketingGroupType:
        """Create a new marketing group type"""
        group_type = MarketingGroupType(label=label, code=code)
        return await self.marketing_group_repository.create_type(db, group_type)

    async def update_type(self, db: AsyncSession, type_id: int, label: str, code: str) -> MarketingGroupType | None:
        """Update a marketing group type"""
        group_type = await self.marketing_group_repository.get_type_by_id(db, type_id)
        if not group_type:
            return None
        group_type.label = label
        group_type.code = code
        return await self.marketing_group_repository.update_type(db, group_type)

    async def delete_type(self, db: AsyncSession, type_id: int) -> bool:
        """Delete a marketing group type"""
        group_type = await self.marketing_group_repository.get_type_by_id(db, type_id)
        if not group_type:
            return False
        await self.marketing_group_repository.delete_type(db, type_id)
        return True 