import sys
import os
import asyncio
import pytest
from datetime import datetime

# Ensure package imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from email_tool.backend.services.template_service import TemplateService
from email_tool.backend.models.template import Template
from email_tool.backend.models.placeholder import Placeholder

class DummyProjectRepository:
    async def get(self, db, project_id):
        return object()

class DummyTemplateRepository:
    async def create(self, db, template):
        return template

class DummyPlaceholderRepository:
    def __init__(self):
        self.created = []

    async def create(self, db, placeholder):
        self.created.append(placeholder)
        return placeholder

class DummyTag:
    def __init__(self, name, description):
        self.id = 1
        self.name = name
        self.color = "#000000"
        self.description = description
        self.created_at = datetime.utcnow()

class DummyTagService:
    async def get_or_create_tag(self, db, name, description):
        return DummyTag(name, description)

@pytest.mark.asyncio
async def test_upload_template_hyphenated_placeholders():
    service = TemplateService()
    service.project_repository = DummyProjectRepository()
    service.template_repository = DummyTemplateRepository()
    service.placeholder_repository = DummyPlaceholderRepository()
    service.tag_service = DummyTagService()

    html = "<p>{{first-name}}</p><div>{{last_name}}</div>"
    template, keys, tags = await service.upload_template(None, 1, 1, "test.html", html)

    assert set(keys) == {"first-name", "last_name"}
    placeholder_keys = [p.key for p in service.placeholder_repository.created]
    assert set(placeholder_keys) == {"first-name", "last_name"}
