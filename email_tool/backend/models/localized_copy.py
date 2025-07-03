from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class LocalizedCopy(Base):
    __tablename__ = 'localized_copy'

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id'))
    language = Column(String, nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)

    campaign = relationship('Campaign', back_populates='copies')
