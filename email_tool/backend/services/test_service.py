import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import GeneratedEmail, PlaywrightResult
from ..data_access.generated_email_repository import GeneratedEmailRepository
from ...playwright.test_runner import run as run_test
from typing import Optional, List, Dict, Any


class TestService:
    """Execute Playwright tests against generated emails."""

    def __init__(self):
        self.generated_email_repository = GeneratedEmailRepository()

    async def run_tests(self, db: AsyncSession, project_id: int, test_config: Optional[Dict[str, Any]] = None) -> int:
        emails = await self.generated_email_repository.get_by_project(db, project_id)
        
        # Extract test steps from config if provided
        test_steps = None
        if test_config and 'steps' in test_config:
            test_steps = test_config['steps']
        
        for email in emails:
            test_result = await run_test(str(email.html_content), test_steps)
            if re.search(r"{{\s*\w+\s*}}", str(email.html_content)):
                test_result['passed'] = False
                test_result['issues'].append('Unreplaced placeholders')
            db.add(
                PlaywrightResult(
                    generated_email_id=email.id,
                    passed=test_result['passed'],
                    issues=test_result['issues'],
                )
            )
        await db.commit()
        return len(emails)

