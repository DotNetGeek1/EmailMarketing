from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class TestScenario(Base):
    __tablename__ = 'test_scenario'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    html_content = Column(Text, nullable=False)  # The HTML file content to test
    html_filename = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    test_steps = relationship('TestStep', back_populates='scenario', cascade='all, delete-orphan')
    test_results = relationship('TestResult', back_populates='scenario', cascade='all, delete-orphan') 