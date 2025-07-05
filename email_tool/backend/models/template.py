from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Template(Base):
    __tablename__ = 'template'

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('project.id'))
    marketing_group_id = Column(Integer, ForeignKey('marketing_group.id'), nullable=False)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='templates')
    placeholders = relationship('Placeholder', back_populates='template')
    marketing_group = relationship('MarketingGroup', back_populates='templates')
    localized_copies = relationship('LocalizedCopy', back_populates='template', cascade='all, delete')
