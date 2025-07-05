import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import GeneratedEmail, PlaywrightResult
from ...playwright.test_runner import run as run_test
from typing import Optional, List, Dict, Any


class TestService:
    """Execute Playwright tests against generated emails."""

    async def run_tests(self, db: AsyncSession, project_id: int, test_config: Optional[Dict[str, Any]] = None) -> int:
        result = await db.execute(
            select(GeneratedEmail).filter_by(project_id=project_id)
        )
        emails = result.scalars().all()
        
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
                    issues=str(test_result['issues']),
                )
            )
        await db.commit()
        return len(emails)

