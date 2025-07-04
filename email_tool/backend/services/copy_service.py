from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ..models import Campaign, LocalizedCopy


class CopyService:
    """Manage localized copy blocks."""

    async def submit_copy(
        self,
        db: AsyncSession,
        campaign_id: int,
        language: str,
        key: str,
        value: str,
    ) -> LocalizedCopy | None:
        """Submit or update a copy entry (upsert operation)"""
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return None
        
        # Check if copy entry already exists
        existing_copy = await db.execute(
            select(LocalizedCopy).filter_by(
                campaign_id=campaign_id,
                language=language,
                key=key
            )
        )
        existing_copy = existing_copy.scalar_one_or_none()
        
        if existing_copy:
            # Update existing entry
            existing_copy.value = value
            await db.commit()
            await db.refresh(existing_copy)
            return existing_copy
        else:
            # Create new entry
            copy = LocalizedCopy(
                campaign_id=campaign_id,
                language=language,
                key=key,
                value=value,
            )
            db.add(copy)
            await db.commit()
            await db.refresh(copy)
            return copy

    async def delete_copy(
        self,
        db: AsyncSession,
        campaign_id: int,
        language: str,
        key: str,
    ) -> bool:
        """Delete a specific copy entry"""
        result = await db.execute(
            delete(LocalizedCopy).filter_by(
                campaign_id=campaign_id,
                language=language,
                key=key
            )
        )
        await db.commit()
        return result.rowcount > 0

    async def delete_copies_for_language(
        self,
        db: AsyncSession,
        campaign_id: int,
        language: str,
    ) -> int:
        """Delete all copy entries for a specific language in a campaign"""
        result = await db.execute(
            delete(LocalizedCopy).filter_by(
                campaign_id=campaign_id,
                language=language
            )
        )
        await db.commit()
        return result.rowcount

    async def get_copies(self, db: AsyncSession, campaign_id: int) -> list[LocalizedCopy]:
        """Get all copy entries for a campaign"""
        result = await db.execute(
            select(LocalizedCopy).filter_by(campaign_id=campaign_id)
        )
        return list(result.scalars().all())

    async def get_copies_by_language(
        self, 
        db: AsyncSession, 
        campaign_id: int, 
        language: str
    ) -> list[LocalizedCopy]:
        """Get all copy entries for a specific language in a campaign"""
        result = await db.execute(
            select(LocalizedCopy).filter_by(
                campaign_id=campaign_id,
                language=language
            )
        )
        return list(result.scalars().all())

