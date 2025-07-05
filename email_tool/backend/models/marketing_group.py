from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class MarketingGroup(Base):
    __tablename__ = 'marketing_group'

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('project.id'), nullable=False)
    marketing_group_type_id = Column(Integer, ForeignKey('marketing_group_type.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='marketing_groups')
    type = relationship('MarketingGroupType', back_populates='marketing_groups')

    __table_args__ = (
        UniqueConstraint('project_id', 'marketing_group_type_id', name='uix_project_group_type'),
    ) 