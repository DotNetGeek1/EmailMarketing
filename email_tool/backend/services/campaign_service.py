from sqlalchemy.orm import Session
from ..models import Campaign


class CampaignService:
    """Business logic related to campaigns."""

    def create_campaign(self, db: Session, name: str) -> Campaign:
        campaign = Campaign(name=name)
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    def update_campaign(self, db: Session, campaign_id: int, name: str) -> Campaign | None:
        campaign = db.query(Campaign).get(campaign_id)
        if not campaign:
            return None
        campaign.name = name
        db.commit()
        db.refresh(campaign)
        return campaign

    def get_campaign(self, db: Session, campaign_id: int) -> Campaign | None:
        return db.query(Campaign).get(campaign_id)
