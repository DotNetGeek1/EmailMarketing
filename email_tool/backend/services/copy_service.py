from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return None
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

    async def get_copies(self, db: AsyncSession, campaign_id: int) -> list[LocalizedCopy]:
        result = await db.execute(
            select(LocalizedCopy).filter_by(campaign_id=campaign_id)
        )
        return result.scalars().all()

