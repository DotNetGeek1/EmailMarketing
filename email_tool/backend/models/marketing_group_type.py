from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .base import Base

class MarketingGroupType(Base):
    __tablename__ = 'marketing_group_type'
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)

    marketing_groups = relationship('MarketingGroup', back_populates='type') 