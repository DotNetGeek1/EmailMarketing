from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class MarketingGroup(Base):
    __tablename__ = 'marketing_group'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to projects (formerly campaigns)
    projects = relationship('Project', back_populates='marketing_group')

    @classmethod
    def get_default_groups(cls):
        """Return the default marketing groups as defined in the spec"""
        return [
            {'name': 'D2C', 'code': 'D2C'},
            {'name': 'Creative Pro', 'code': 'CPro'},
            {'name': 'Consumer', 'code': 'CONS'},
            {'name': 'Gaming', 'code': 'Gam'},
            {'name': 'NAS', 'code': 'NAS'},
            {'name': 'Surveillance', 'code': 'SV'},
            {'name': 'Other (multiple POIs)', 'code': 'Other'},
            {'name': 'Seagate Partner', 'code': 'SPP'},
            {'name': 'Enterprise Drives', 'code': 'ED'},
            {'name': 'Lyve Cloud', 'code': 'LC'},
            {'name': 'Lyve Mobile', 'code': 'LM'},
            {'name': 'Systems', 'code': 'Sys'},
        ] 