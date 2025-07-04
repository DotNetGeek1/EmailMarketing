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
                
                # Get unique languages from copy entries
                languages = {c.language for c in copies}
                
                for lang in languages:
                    # Get copy entries for this language
                    lang_copy = {str(c.key): str(c.value) for c in copies if c.language == lang}
                    
                    # Check if we have all required placeholders for this language
                    if not placeholders.issubset(set(lang_copy.keys())):
                        continue
                    
                    try:
                        # Render the template with the copy
                        jinja = JinjaTemplate(str(template.content))
                        html = jinja.render(**lang_copy)
                        
                        # Create and save the generated email
                        email = GeneratedEmail(
                            campaign_id=campaign_id,
                            language=lang,
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
                            'language': lang,
                            'html_content': html,
                            'generated_at': datetime.utcnow().isoformat(),
                            'thumbnail_url': screenshot_url
                        })
                        generated_count += 1
                        
                    except Exception as e:
                        print(f"Error rendering template for language {lang}: {e}")
                        continue
            
            await db.commit()
            return {'generated': generated_count, 'emails': emails}
            
        except Exception as e:
            print(f"Error generating emails: {e}")
            await db.rollback()
            return None

