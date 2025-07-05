from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class LocalizedCopy(Base):
    __tablename__ = 'localized_copy'

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('project.id'))
    locale = Column(String, nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    status = Column(String, nullable=False, default='Draft')
    created_at = Column(DateTime, default=datetime.utcnow)
    template_id = Column(Integer, ForeignKey('template.id'), nullable=False)

    project = relationship('Project', back_populates='copies')
    template = relationship('Template', back_populates='localized_copies')
