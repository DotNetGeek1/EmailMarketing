from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import random
from ..models.tag import Tag
from ..models.project_tag import project_tags
from ..data_access.tag_repository import TagRepository
from ..data_access.project_tag_repository import ProjectTagRepository

class TagService:
    def __init__(self):
        self.tag_repository = TagRepository()
        self.project_tag_repository = ProjectTagRepository()

    async def create_tag(self, db: AsyncSession, name: str, color: str, description: Optional[str] = None) -> Tag:
        """Create a new tag"""
        tag = Tag(name=name, color=color, description=description)
        return await self.tag_repository.create(db, tag)

    async def get_tag_by_name(self, db: AsyncSession, name: str) -> Optional[Tag]:
        """Get a tag by name"""
        return await self.tag_repository.get_by_name(db, name)

    async def get_or_create_tag(self, db: AsyncSession, name: str, description: Optional[str] = None) -> Tag:
        """Get a tag by name or create it if it doesn't exist"""
        tag = await self.get_tag_by_name(db, name)
        if not tag:
            # Generate a random color for new tags
            colors = [
                '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
                '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
            ]
            color = random.choice(colors)
            tag = await self.create_tag(db, name, color, description)
        return tag

    async def get_all_tags(self, db: AsyncSession) -> list[dict]:
        """Get all tags with project counts"""
        # Subquery to count projects per tag
        project_count_subquery = select(
            project_tags.c.tag_id,
            func.count(project_tags.c.project_id).label('project_count')
        ).group_by(project_tags.c.tag_id).subquery()

        # Main query with project counts
        query = select(
            Tag,
            func.coalesce(project_count_subquery.c.project_count, 0).label('project_count')
        ).outerjoin(project_count_subquery, Tag.id == project_count_subquery.c.tag_id)

        result = await db.execute(query)
        tags_with_counts = result.all()
        
        # Convert to list of dictionaries
        tags = []
        for tag, project_count in tags_with_counts:
            tag_dict = {
                'id': tag.id,
                'name': tag.name,
                'color': tag.color,
                'description': tag.description,
                'created_at': tag.created_at.isoformat(),
                'project_count': project_count
            }
            tags.append(tag_dict)
        
        return tags

    async def get_tag_by_id(self, db: AsyncSession, tag_id: int) -> Optional[Tag]:
        """Get a tag by ID"""
        return await self.tag_repository.get(db, tag_id)

    async def update_tag(self, db: AsyncSession, tag_id: int, name: str, color: str, description: Optional[str] = None) -> Optional[Tag]:
        """Update a tag"""
        tag = await self.tag_repository.get(db, tag_id)
        if tag:
            # Use setattr to avoid type annotation issues
            setattr(tag, 'name', name)
            setattr(tag, 'color', color)
            setattr(tag, 'description', description)
            return await self.tag_repository.update(db, tag)
        return None

    async def delete_tag(self, db: AsyncSession, tag_id: int) -> bool:
        """Delete a tag"""
        tag = await self.tag_repository.get(db, tag_id)
        if tag:
            await self.tag_repository.delete(db, tag_id)
            return True
        return False

    async def add_tag_to_project(self, db: AsyncSession, project_id: int, tag_id: int) -> bool:
        """Add a tag to a project"""
        return await self.project_tag_repository.add_tag_to_project(db, project_id, tag_id)

    async def remove_tag_from_project(self, db: AsyncSession, project_id: int, tag_id: int) -> bool:
        """Remove a tag from a project"""
        return await self.project_tag_repository.remove_tag_from_project(db, project_id, tag_id) 