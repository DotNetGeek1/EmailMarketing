from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class GeneratedEmail(Base):
    __tablename__ = 'generated_email'

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id'))
    language = Column(String, nullable=False)
    html_content = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship('Campaign', back_populates='generated_emails')
    test_result = relationship('PlaywrightResult', back_populates='generated_email', uselist=False)
