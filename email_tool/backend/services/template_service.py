import re
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import Project, Template, Placeholder
from ..data_access.project_repository import ProjectRepository
from ..data_access.template_repository import TemplateRepository
from ..data_access.placeholder_repository import PlaceholderRepository
from .tag_service import TagService
from typing import Optional


class TemplateService:
    """Handle template uploads and placeholder extraction."""

    def __init__(self):
        self.tag_service = TagService()
        self.project_repository = ProjectRepository()
        self.template_repository = TemplateRepository()
        self.placeholder_repository = PlaceholderRepository()

    async def upload_template(
        self,
        db: AsyncSession,
        project_id: int,
        marketing_group_id: int,
        filename: str,
        content: str,
    ) -> tuple[Template | None, list[str], list[dict]]:
        project = await self.project_repository.get(db, project_id)
        if not project:
            return None, [], []
        
        template = Template(project_id=project_id, marketing_group_id=marketing_group_id, filename=filename, content=content)
        template = await self.template_repository.create(db, template)
        
        # Extract placeholder keys (allow hyphens)
        keys = set(re.findall(r"{{\s*([\w-]+)\s*}}", content))
        
        # Create placeholders and auto-create tags
        created_tags = []
        for key in keys:
            placeholder = Placeholder(template=template, key=key)
            await self.placeholder_repository.create(db, placeholder)
            
            # Auto-create tag if it doesn't exist
            tag = await self.tag_service.get_or_create_tag(
                db, 
                key, 
                f"Auto-generated from template {filename}"
            )
            created_tags.append({
                'id': tag.id,
                'name': tag.name,
                'color': tag.color,
                'description': tag.description,
                'created_at': tag.created_at.isoformat()
            })
        
        return template, list(keys), created_tags

    async def get_placeholders(self, db: AsyncSession, template_id: int) -> list[str]:
        placeholders = await self.placeholder_repository.get_keys_by_template(db, template_id)
        return list(placeholders)

    async def get_all_templates(self, db: AsyncSession, project_id: Optional[int] = None, marketing_group_id: Optional[int] = None) -> list[dict]:
        """Get all templates with project information and placeholders, optionally filtered by project_id"""
        templates = await self.template_repository.get_all(db, project_id, marketing_group_id)
        
        # Convert to list of dictionaries with placeholders
        template_list = []
        screenshots_dir = Path("static/screenshots")
        
        for template in templates:
            template_id = getattr(template, 'id')
            placeholders = await self.get_placeholders(db, template_id)
            
            # Check for existing preview image
            preview_image = None
            if screenshots_dir.exists():
                existing_files = list(screenshots_dir.glob(f"template_{template_id}_*.png"))
                if existing_files:
                    preview_image = f"/static/screenshots/{existing_files[0].name}"
            
            template_dict = {
                'id': template_id,
                'project_id': template.project_id,
                'filename': template.filename,
                'content': template.content,
                'created_at': template.created_at.isoformat(),
                'placeholders': placeholders,
                'preview_image': preview_image
            }
            template_list.append(template_dict)
        
        return template_list

    async def delete_template(self, db: AsyncSession, template_id: int) -> bool:
        """Delete a template and its placeholders"""
        template = await self.template_repository.get(db, template_id)
        if template:
            await self.placeholder_repository.delete_by_template(db, template_id)
            await self.template_repository.delete(db, template_id)
            return True
        return False

