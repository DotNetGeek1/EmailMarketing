from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Campaign(Base):
    __tablename__ = 'campaign'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    templates = relationship('Template', back_populates='campaign')
    copies = relationship('LocalizedCopy', back_populates='campaign')
    generated_emails = relationship('GeneratedEmail', back_populates='campaign')

class Template(Base):
    __tablename__ = 'template'
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id'))
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship('Campaign', back_populates='templates')
    placeholders = relationship('Placeholder', back_populates='template')

class Placeholder(Base):
    __tablename__ = 'placeholder'
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey('template.id'))
    key = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship('Template', back_populates='placeholders')

class LocalizedCopy(Base):
    __tablename__ = 'localized_copy'
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id'))
    language = Column(String, nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=False)

    campaign = relationship('Campaign', back_populates='copies')

class GeneratedEmail(Base):
    __tablename__ = 'generated_email'
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaign.id'))
    language = Column(String, nullable=False)
    html_content = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship('Campaign', back_populates='generated_emails')
    test_result = relationship('PlaywrightResult', back_populates='generated_email', uselist=False)

class PlaywrightResult(Base):
    __tablename__ = 'playwright_result'
    id = Column(Integer, primary_key=True, index=True)
    generated_email_id = Column(Integer, ForeignKey('generated_email.id'))
    passed = Column(Boolean, default=False)
    issues = Column(Text)
    tested_at = Column(DateTime, default=datetime.utcnow)

    generated_email = relationship('GeneratedEmail', back_populates='test_result')
