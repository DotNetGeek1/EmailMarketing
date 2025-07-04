from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class CopyComment(Base):
    __tablename__ = 'copy_comment'

    id = Column(Integer, primary_key=True, index=True)
    copy_id = Column(Integer, ForeignKey('localized_copy.id'))
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = Column(String, nullable=True)  # Placeholder for future user support

    copy = relationship('LocalizedCopy', backref='comments') 