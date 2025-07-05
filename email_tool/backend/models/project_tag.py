from sqlalchemy import Column, Integer, ForeignKey, Table
from .base import Base

# Many-to-many relationship table between projects and tags
project_tags = Table(
    'project_tags',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('project.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tag.id'), primary_key=True)
) 