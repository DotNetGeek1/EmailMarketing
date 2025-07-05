from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
from .project_tag import project_tags

class Project(Base):
    __tablename__ = 'project'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, nullable=False, default='New')
    customer_id = Column(Integer, ForeignKey('customer.id'), nullable=True)

    customer = relationship('Customer', backref='projects')
    marketing_groups = relationship('MarketingGroup', back_populates='project')
    templates = relationship('Template', back_populates='project')
    copies = relationship('LocalizedCopy', back_populates='project')
    generated_emails = relationship('GeneratedEmail', back_populates='project')
    tags = relationship('Tag', secondary=project_tags, back_populates='projects') 