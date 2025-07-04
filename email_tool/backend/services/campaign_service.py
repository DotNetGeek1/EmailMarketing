from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models import Campaign, Template, LocalizedCopy, Tag


class CampaignService:
    """Business logic related to campaigns."""

    async def create_campaign(self, db: AsyncSession, name: str, customer_id: int = None) -> Campaign:
        campaign = Campaign(name=name, customer_id=customer_id)
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

    async def update_campaign_status(self, db: AsyncSession, campaign_id: int, status: str) -> Campaign | None:
        campaign = await db.get(Campaign, campaign_id)
        if not campaign:
            return None
        campaign.status = status
        await db.commit()
        await db.refresh(campaign)
        return campaign

    async def get_campaign(self, db: AsyncSession, campaign_id: int) -> Campaign | None:
        return await db.get(Campaign, campaign_id)

    async def get_all_campaigns(self, db: AsyncSession, customer_id: int = None) -> list[dict]:
        """Get all campaigns with template and language counts, optionally filtered by customer_id"""
        query = select(
            Campaign,
            func.count(Template.id).label('templates_count'),
            func.count(func.distinct(LocalizedCopy.language)).label('languages_count')
        )
        query = query.outerjoin(Template, Campaign.id == Template.campaign_id)
        query = query.outerjoin(LocalizedCopy, Campaign.id == LocalizedCopy.campaign_id)
        if customer_id is not None:
            query = query.filter(Campaign.customer_id == customer_id)
        query = query.group_by(Campaign.id).order_by(Campaign.created_at.desc())
        result = await db.execute(query)
        campaigns_with_counts = result.all()
        campaigns = []
        for campaign, templates_count, languages_count in campaigns_with_counts:
            await db.refresh(campaign, attribute_names=['tags'])
            campaign_dict = {
                'id': campaign.id,
                'name': campaign.name,
                'created_at': campaign.created_at.isoformat(),
                'status': campaign.status,
                'templates_count': templates_count,
                'languages_count': languages_count,
                'tags': [
                    {
                        'id': tag.id,
                        'name': tag.name,
                        'color': tag.color,
                        'description': tag.description
                    }
                    for tag in campaign.tags
                ]
            }
            campaigns.append(campaign_dict)
        return campaigns

