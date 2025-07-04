from sqlalchemy import Column, Integer, ForeignKey, Table
from .base import Base

# Many-to-many relationship table between campaigns and tags
campaign_tags = Table(
    'campaign_tags',
    Base.metadata,
    Column('campaign_id', Integer, ForeignKey('campaign.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tag.id'), primary_key=True)
) 