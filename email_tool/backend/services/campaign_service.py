from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models import Campaign, Template, LocalizedCopy


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

    async def get_all_campaigns(self, db: AsyncSession) -> list[dict]:
        """Get all campaigns with template and language counts"""
        # Get campaigns with counts
        result = await db.execute(
            select(
                Campaign,
                func.count(Template.id).label('templates_count'),
                func.count(func.distinct(LocalizedCopy.language)).label('languages_count')
            )
            .outerjoin(Template, Campaign.id == Template.campaign_id)
            .outerjoin(LocalizedCopy, Campaign.id == LocalizedCopy.campaign_id)
            .group_by(Campaign.id)
            .order_by(Campaign.created_at.desc())
        )
        
        campaigns_with_counts = result.all()
        
        # Convert to list of dictionaries
        campaigns = []
        for campaign, templates_count, languages_count in campaigns_with_counts:
            campaign_dict = {
                'id': campaign.id,
                'name': campaign.name,
                'created_at': campaign.created_at.isoformat(),
                'templates_count': templates_count,
                'languages_count': languages_count
            }
            campaigns.append(campaign_dict)
        
        return campaigns

