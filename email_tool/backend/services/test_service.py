import asyncio
import re
from sqlalchemy.orm import Session
from ..models import GeneratedEmail, PlaywrightResult
from ..playwright.test_runner import run as run_test


class TestService:
    """Execute Playwright tests against generated emails."""

    def run_tests(self, db: Session, campaign_id: int) -> int:
        emails = db.query(GeneratedEmail).filter_by(campaign_id=campaign_id).all()
        for email in emails:
            result = asyncio.run(run_test(email.html_content))
            if re.search(r"{{\s*\w+\s*}}", email.html_content):
                result['passed'] = False
                result['issues'].append('Unreplaced placeholders')
            db.add(
                PlaywrightResult(
                    generated_email_id=email.id,
                    passed=result['passed'],
                    issues=str(result['issues']),
                )
            )
        db.commit()
        return len(emails)
