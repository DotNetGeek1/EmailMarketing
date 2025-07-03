from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Placeholder(Base):
    __tablename__ = 'placeholder'

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey('template.id'))
    key = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship('Template', back_populates='placeholders')
