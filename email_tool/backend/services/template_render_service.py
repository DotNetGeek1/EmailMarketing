import asyncio
import os
import uuid
from pathlib import Path
from playwright.async_api import async_playwright
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.template import Template
from ..models.placeholder import Placeholder

class TemplateRenderService:
    def __init__(self):
        self.screenshots_dir = Path("static/screenshots")
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
    
    async def render_template_to_image(self, db: AsyncSession, template_id: int) -> str:
        """Render a template to an image and return the file path"""
        # Get template from database using async query
        result = await db.execute(select(Template).filter(Template.id == template_id))
        template = result.scalar_one_or_none()
        if not template:
            raise ValueError("Template not found")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.png"
        filepath = self.screenshots_dir / filename
        
        # Create a temporary HTML file with the template content
        temp_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ margin: 0; padding: 20px; font-family: Arial, sans-serif; }}
                img {{ max-width: 100%; height: auto; }}
            </style>
        </head>
        <body>
            {template.content}
        </body>
        </html>
        """
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Set viewport size for consistent rendering
            await page.set_viewport_size({"width": 800, "height": 600})
            
            # Load the HTML content
            await page.set_content(temp_html)
            
            # Wait for any dynamic content to load
            await page.wait_for_timeout(1000)
            
            # Take screenshot
            await page.screenshot(path=str(filepath), full_page=True)
            await browser.close()
        
        return filename
    
    async def get_template_preview(self, db: AsyncSession, template_id: int) -> dict:
        """Get template preview with rendered image"""
        # Get template using async query
        result = await db.execute(select(Template).filter(Template.id == template_id))
        template = result.scalar_one_or_none()
        if not template:
            raise ValueError("Template not found")
        
        # Get placeholder keys
        placeholder_result = await db.execute(select(Placeholder.key).filter(Placeholder.template_id == template_id))
        placeholders = [row[0] for row in placeholder_result.fetchall()]
        
        # Check if preview image already exists
        existing_files = list(self.screenshots_dir.glob(f"template_{template_id}_*.png"))
        if existing_files:
            # Use existing preview
            filename = existing_files[0].name
        else:
            # Generate new preview
            filename = await self.render_template_to_image(db, template_id)
            # Rename to include template ID for easier management
            new_filename = f"template_{template_id}_{filename}"
            os.rename(self.screenshots_dir / filename, self.screenshots_dir / new_filename)
            filename = new_filename
        
        return {
            'template_id': template_id,
            'filename': template.filename,
            'content': template.content,
            'placeholders': placeholders,
            'preview_image': f"/static/screenshots/{filename}",
            'created_at': template.created_at.isoformat()
        }
    
    async def delete_template_previews(self, template_id: int):
        """Delete all preview images for a template"""
        pattern = f"template_{template_id}_*.png"
        for file in self.screenshots_dir.glob(pattern):
            file.unlink() 