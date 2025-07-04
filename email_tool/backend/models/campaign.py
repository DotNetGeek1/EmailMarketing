from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
from .campaign_tag import campaign_tags

class Campaign(Base):
    __tablename__ = 'campaign'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, nullable=False, default='New')
    customer_id = Column(Integer, ForeignKey('customer.id'), nullable=True)

    customer = relationship('Customer', backref='campaigns')
    templates = relationship('Template', back_populates='campaign')
    copies = relationship('LocalizedCopy', back_populates='campaign')
    generated_emails = relationship('GeneratedEmail', back_populates='campaign')
    tags = relationship('Tag', secondary=campaign_tags, back_populates='campaigns')
