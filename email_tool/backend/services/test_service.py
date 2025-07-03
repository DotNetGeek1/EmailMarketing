import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import GeneratedEmail, PlaywrightResult
from ..playwright.test_runner import run as run_test


class TestService:
    """Execute Playwright tests against generated emails."""

    async def run_tests(self, db: AsyncSession, campaign_id: int) -> int:
        result = await db.execute(
            select(GeneratedEmail).filter_by(campaign_id=campaign_id)
        )
        emails = result.scalars().all()
        for email in emails:
            test_result = await run_test(email.html_content)
            if re.search(r"{{\s*\w+\s*}}", email.html_content):
                test_result['passed'] = False
                test_result['issues'].append('Unreplaced placeholders')
            db.add(
                PlaywrightResult(
                    generated_email_id=email.id,
                    passed=test_result['passed'],
                    issues=str(test_result['issues']),
                )
            )
        await db.commit()
        return len(emails)
