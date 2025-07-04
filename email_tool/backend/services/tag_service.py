from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import random
from ..models.tag import Tag
from ..models.campaign_tag import campaign_tags

class TagService:
    async def create_tag(self, db: AsyncSession, name: str, color: str, description: Optional[str] = None) -> Tag:
        """Create a new tag"""
        tag = Tag(name=name, color=color, description=description)
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
        return tag

    async def get_tag_by_name(self, db: AsyncSession, name: str) -> Optional[Tag]:
        """Get a tag by name"""
        result = await db.execute(select(Tag).where(Tag.name == name))
        return result.scalar_one_or_none()

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
        """Get all tags with campaign counts"""
        # Subquery to count campaigns per tag
        campaign_count_subquery = select(
            campaign_tags.c.tag_id,
            func.count(campaign_tags.c.campaign_id).label('campaign_count')
        ).group_by(campaign_tags.c.tag_id).subquery()

        # Main query with campaign counts
        query = select(
            Tag,
            func.coalesce(campaign_count_subquery.c.campaign_count, 0).label('campaign_count')
        ).outerjoin(campaign_count_subquery, Tag.id == campaign_count_subquery.c.tag_id)

        result = await db.execute(query)
        tags_with_counts = result.all()
        
        # Convert to list of dictionaries
        tags = []
        for tag, campaign_count in tags_with_counts:
            tag_dict = {
                'id': tag.id,
                'name': tag.name,
                'color': tag.color,
                'description': tag.description,
                'created_at': tag.created_at.isoformat(),
                'campaign_count': campaign_count
            }
            tags.append(tag_dict)
        
        return tags

    async def get_tag_by_id(self, db: AsyncSession, tag_id: int) -> Optional[Tag]:
        """Get a tag by ID"""
        result = await db.execute(select(Tag).where(Tag.id == tag_id))
        return result.scalar_one_or_none()

    async def update_tag(self, db: AsyncSession, tag_id: int, name: str, color: str, description: Optional[str] = None) -> Optional[Tag]:
        """Update a tag"""
        tag = await db.get(Tag, tag_id)
        if tag:
            # Use setattr to avoid type annotation issues
            setattr(tag, 'name', name)
            setattr(tag, 'color', color)
            setattr(tag, 'description', description)
            await db.commit()
            await db.refresh(tag)
        return tag

    async def delete_tag(self, db: AsyncSession, tag_id: int) -> bool:
        """Delete a tag"""
        tag = await self.get_tag_by_id(db, tag_id)
        if tag:
            await db.delete(tag)
            await db.commit()
            return True
        return False

    async def add_tag_to_campaign(self, db: AsyncSession, campaign_id: int, tag_id: int) -> bool:
        """Add a tag to a campaign"""
        try:
            await db.execute(
                campaign_tags.insert().values(campaign_id=campaign_id, tag_id=tag_id)
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False

    async def remove_tag_from_campaign(self, db: AsyncSession, campaign_id: int, tag_id: int) -> bool:
        """Remove a tag from a campaign"""
        try:
            await db.execute(
                campaign_tags.delete().where(
                    campaign_tags.c.campaign_id == campaign_id,
                    campaign_tags.c.tag_id == tag_id
                )
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False 