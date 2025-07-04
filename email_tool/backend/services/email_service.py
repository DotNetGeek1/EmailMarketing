import os
import uuid
import subprocess
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jinja2 import Template as JinjaTemplate
from ..models import Campaign, GeneratedEmail, LocalizedCopy, Template, Placeholder
from datetime import datetime


class EmailService:
    """Generate localized HTML emails with screenshot thumbnails."""

    async def generate_emails(self, db: AsyncSession, campaign_id: int) -> dict | None:
        try:
            campaign = await db.get(Campaign, campaign_id)
            if campaign is None:
                return None
            
            # Get templates for this campaign
            result = await db.execute(select(Template).filter_by(campaign_id=campaign_id))
            templates = list(result.scalars().all())
            
            if len(templates) == 0:
                return {'generated': 0, 'emails': []}
            
            # Get all copy entries for this campaign
            copy_res = await db.execute(select(LocalizedCopy).filter_by(campaign_id=campaign_id))
            copies = list(copy_res.scalars().all())
            
            if len(copies) == 0:
                return {'generated': 0, 'emails': []}
            
            emails: list[dict] = []
            generated_count = 0
            
            for template in templates:
                # Get placeholders for this template
                ph_res = await db.execute(select(Placeholder.key).filter_by(template_id=template.id))
                placeholders = {str(row) for row in ph_res.scalars().all()}
                
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
                            campaign_id=campaign_id,
                            language=locale,  # keep field name for now
                            html_content=html,
                        )
                        db.add(email)
                        await db.flush()  # Flush to get the ID

                        # --- Screenshot logic ---
                        guid = str(uuid.uuid4())
                        html_temp_path = f"/tmp/{guid}.html" if os.name != 'nt' else f"C:\\Windows\\Temp\\{guid}.html"
                        screenshot_filename = f"{guid}.png"
                        screenshot_path = os.path.join("email_tool/backend/static/screenshots", screenshot_filename)
                        screenshot_url = f"/static/screenshots/{screenshot_filename}"
                        # Write HTML to temp file
                        with open(html_temp_path, 'w', encoding='utf-8') as f:
                            f.write(html)
                        # Call Playwright runner to generate screenshot
                        subprocess.run([
                            'python', 'email_tool/playwright/test_runner.py',
                            html_temp_path, 'screenshot', screenshot_path
                        ], check=True)
                        # Clean up temp HTML file
                        os.remove(html_temp_path)
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
                        print(f"Error rendering template for locale {locale}: {e}")
                        continue
            
            await db.commit()
            return {'generated': generated_count, 'emails': emails}
            
        except Exception as e:
            print(f"Error generating emails: {e}")
            await db.rollback()
            return None

