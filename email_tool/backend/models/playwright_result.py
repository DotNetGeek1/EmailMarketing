from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class PlaywrightResult(Base):
    __tablename__ = 'playwright_result'

    id = Column(Integer, primary_key=True, index=True)
    generated_email_id = Column(Integer, ForeignKey('generated_email.id'))
    passed = Column(Boolean, default=False)
    issues = Column(JSON)
    tested_at = Column(DateTime, default=datetime.utcnow)

    generated_email = relationship('GeneratedEmail', back_populates='test_result')
