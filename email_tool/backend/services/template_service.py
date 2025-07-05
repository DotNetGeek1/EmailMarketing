import re
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import Project, Template, Placeholder
from .tag_service import TagService
from typing import Optional


class TemplateService:
    """Handle template uploads and placeholder extraction."""

    def __init__(self):
        self.tag_service = TagService()

    async def upload_template(
        self,
        db: AsyncSession,
        project_id: int,
        filename: str,
        content: str,
    ) -> tuple[Template | None, list[str], list[dict]]:
        project = await db.get(Project, project_id)
        if not project:
            return None, [], []
        
        template = Template(project_id=project_id, filename=filename, content=content)
        db.add(template)
        
        # Extract placeholder keys
        keys = set(re.findall(r"{{\s*(\w+)\s*}}", content))
        
        # Create placeholders and auto-create tags
        created_tags = []
        for key in keys:
            db.add(Placeholder(template=template, key=key))
            
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
        
        await db.commit()
        await db.refresh(template)
        return template, list(keys), created_tags

    async def get_placeholders(self, db: AsyncSession, template_id: int) -> list[str]:
        result = await db.execute(select(Placeholder.key).filter_by(template_id=template_id))
        return list(result.scalars().all())

    async def get_all_templates(self, db: AsyncSession, project_id: Optional[int] = None) -> list[dict]:
        """Get all templates with project information and placeholders, optionally filtered by project_id"""
        query = select(Template).order_by(Template.created_at.desc())
        
        if project_id is not None:
            query = query.filter(Template.project_id == project_id)
        
        result = await db.execute(query)
        templates = result.scalars().all()
        
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
        template = await db.get(Template, template_id)
        if template:
            await db.delete(template)
            await db.commit()
            return True
        return False

