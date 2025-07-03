from sqlalchemy.orm import Session
from ..models import Campaign, LocalizedCopy


class CopyService:
    """Manage localized copy blocks."""

    def submit_copy(
        self,
        db: Session,
        campaign_id: int,
        language: str,
        key: str,
        value: str,
    ) -> LocalizedCopy | None:
        campaign = db.query(Campaign).get(campaign_id)
        if not campaign:
            return None
        copy = LocalizedCopy(
            campaign_id=campaign_id,
            language=language,
            key=key,
            value=value,
        )
        db.add(copy)
        db.commit()
        db.refresh(copy)
        return copy

    def get_copies(self, db: Session, campaign_id: int) -> list[LocalizedCopy]:
        return db.query(LocalizedCopy).filter_by(campaign_id=campaign_id).all()
