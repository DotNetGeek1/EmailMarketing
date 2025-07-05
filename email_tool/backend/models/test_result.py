from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class TestResult(Base):
    __tablename__ = 'test_result'

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey('test_scenario.id'))
    status = Column(String(20), nullable=False)  # 'passed', 'failed', 'error'
    execution_time = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Integer, nullable=True)  # Test execution time in milliseconds
    error_message = Column(Text, nullable=True)  # Error details if failed
    screenshot_path = Column(String(500), nullable=True)  # Path to screenshot if failed
    logs = Column(Text, nullable=True)  # Test execution logs

    # Relationships
    scenario = relationship('TestScenario', back_populates='test_results') 