from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .base import Base

class Customer(Base):
    __tablename__ = 'customer'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow) 