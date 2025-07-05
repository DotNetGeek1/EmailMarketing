"""Store issues as JSON in PlaywrightResult

Revision ID: a9deaecb7996
Revises: 64af9871a726
Create Date: 2024-06-20 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9deaecb7996'
down_revision: Union[str, Sequence[str], None] = '64af9871a726'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'playwright_result',
        'issues',
        type_=sa.JSON(),
        existing_type=sa.Text(),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'playwright_result',
        'issues',
        type_=sa.Text(),
        existing_type=sa.JSON(),
    )

