import os
import uuid
from email_tool.playwright.test_runner import screenshot
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jinja2 import Template as JinjaTemplate
from ..models import Project, GeneratedEmail, LocalizedCopy, Template, Placeholder
from ..data_access.project_repository import ProjectRepository
from ..data_access.template_repository import TemplateRepository
from ..data_access.localized_copy_repository import LocalizedCopyRepository
from ..data_access.placeholder_repository import PlaceholderRepository
from ..data_access.generated_email_repository import GeneratedEmailRepository
from datetime import datetime


class EmailService:
    """Generate localized HTML emails with screenshot thumbnails."""

    def __init__(self):
        self.project_repository = ProjectRepository()
        self.template_repository = TemplateRepository()
        self.localized_copy_repository = LocalizedCopyRepository()
        self.placeholder_repository = PlaceholderRepository()
        self.generated_email_repository = GeneratedEmailRepository()

    async def generate_emails(self, db: AsyncSession, project_id: int) -> dict | None:
        try:
            project = await self.project_repository.get(db, project_id)
            if project is None:
                return None
            
            # Get templates for this project
            templates = await self.template_repository.get_by_project(db, project_id)
            
            if len(templates) == 0:
                return {'generated': 0, 'emails': []}
            
            # Get all copy entries for this project
            copies = await self.localized_copy_repository.get_by_project(db, project_id)
            
            if len(copies) == 0:
                return {'generated': 0, 'emails': []}
            
            emails: list[dict] = []
            generated_count = 0
            
            for template in templates:
                # Get placeholders for this template
                placeholder_keys = await self.placeholder_repository.get_keys_by_template(db, getattr(template, 'id'))
                placeholders = {str(key) for key in placeholder_keys}
                
                # Get unique locales from copy entries
                locales = {c.locale for c in copies}
                
                for locale in locales:
                    # Get copy entries for this locale
                    locale_copy = {str(c.key): str(c.value) for c in copies if c.locale == locale}
                    
                    # Fallback: if missing, try base language (e.g., en-GB -> en)
                    if '-' in locale:
                        base_lang = locale.split('-')[0]
                        base_copy = {str(c.key): str(c.value) for c in copies if c.locale == base_lang}
                        for k, v in base_copy.items():
                            if k not in locale_copy:
                                locale_copy[k] = v
                    # Fallback: if still missing, try 'en' as global default
                    if locale != 'en':
                        en_copy = {str(c.key): str(c.value) for c in copies if c.locale == 'en'}
                        for k, v in en_copy.items():
                            if k not in locale_copy:
                                locale_copy[k] = v
                    
                    # Check if we have all required placeholders for this locale
                    if not placeholders.issubset(set(locale_copy.keys())):
                        continue
                    
                    try:
                        # Render the template with the copy
                        jinja = JinjaTemplate(str(template.content))
                        html = jinja.render(**locale_copy)
                        
                        # Create and save the generated email
                        email = GeneratedEmail(
                            project_id=project_id,
                            language=locale,  # keep field name for now
                            html_content=html,
                        )
                        email = await self.generated_email_repository.create(db, email)

                        # --- Screenshot logic ---
                        guid = str(uuid.uuid4())
                        screenshot_filename = f"{guid}.png"
                        screenshot_path = os.path.join(

                            Path(__file__).resolve().parent / 'static' / 'screenshots',

                            screenshot_filename,
                        )
                        screenshot_url = f"/static/screenshots/{screenshot_filename}"
                        # Generate screenshot using Playwright
                        await screenshot(html, screenshot_path)
                        # --- End screenshot logic ---
                        
                        # Add to our result list
                        emails.append({
                            'id': email.id,
                            'locale': locale,
                            'html_content': html,
                            'generated_at': datetime.utcnow().isoformat(),
                            'thumbnail_url': screenshot_url
                        })
                        generated_count += 1
                        
                    except Exception as e:
                        print(
                            f"Error rendering template or generating screenshot for locale {locale}: {e}"
                        )
                        continue
            
            await db.commit()
            return {'generated': generated_count, 'emails': emails}
            
        except Exception as e:
            print(f"Error generating emails: {e}")
            await db.rollback()
            return None

