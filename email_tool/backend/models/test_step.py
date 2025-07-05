from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class TestStep(Base):
    __tablename__ = 'test_step'

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey('test_scenario.id'))
    step_order = Column(Integer, nullable=False)  # Order of execution
    action = Column(String(50), nullable=False)  # click, expectText, expectAttr, etc.
    selector = Column(String(255), nullable=True)  # data-testid or CSS selector
    value = Column(Text, nullable=True)  # Expected value for assertions
    attr = Column(String(50), nullable=True)  # Attribute name for expectAttr
    description = Column(Text, nullable=True)  # Human readable description
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scenario = relationship('TestScenario', back_populates='test_steps') 