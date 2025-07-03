from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import Campaign


class CampaignService:
    """Business logic related to campaigns."""

    async def create_campaign(self, db: AsyncSession, name: str) -> Campaign:
        campaign = Campaign(name=name)
        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)
        return campaign

    async def update_campaign(self, db: AsyncSession, campaign_id: int, name: str) -> Campaign | None:
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return None
        campaign.name = name
        await db.commit()
        await db.refresh(campaign)
        return campaign

    async def get_campaign(self, db: AsyncSession, campaign_id: int) -> Campaign | None:
        return await db.get(Campaign, campaign_id)
