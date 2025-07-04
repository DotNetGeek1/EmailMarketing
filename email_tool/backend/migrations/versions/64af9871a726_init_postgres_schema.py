"""init postgres schema

Revision ID: 64af9871a726
Revises: 
Create Date: 2025-07-05 16:22:13.627614

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64af9871a726'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('customer',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_id'), 'customer', ['id'], unique=False)
    op.create_table('marketing_group_type',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('label', sa.String(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code'),
    sa.UniqueConstraint('label')
    )
    op.create_index(op.f('ix_marketing_group_type_id'), 'marketing_group_type', ['id'], unique=False)
    op.create_table('tag',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('color', sa.String(length=7), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_tag_id'), 'tag', ['id'], unique=False)
    op.create_table('test_scenario',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('html_content', sa.Text(), nullable=False),
    sa.Column('html_filename', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_scenario_id'), 'test_scenario', ['id'], unique=False)
    op.create_table('project',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('customer_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['customer_id'], ['customer.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_id'), 'project', ['id'], unique=False)
    op.create_table('test_result',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('scenario_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('execution_time', sa.DateTime(), nullable=True),
    sa.Column('duration_ms', sa.Integer(), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('screenshot_path', sa.String(length=500), nullable=True),
    sa.Column('logs', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['scenario_id'], ['test_scenario.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_result_id'), 'test_result', ['id'], unique=False)
    op.create_table('test_step',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('scenario_id', sa.Integer(), nullable=True),
    sa.Column('step_order', sa.Integer(), nullable=False),
    sa.Column('action', sa.String(length=50), nullable=False),
    sa.Column('selector', sa.String(length=255), nullable=True),
    sa.Column('value', sa.Text(), nullable=True),
    sa.Column('attr', sa.String(length=50), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['scenario_id'], ['test_scenario.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_step_id'), 'test_step', ['id'], unique=False)
    op.create_table('generated_email',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('language', sa.String(), nullable=False),
    sa.Column('html_content', sa.Text(), nullable=False),
    sa.Column('generated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_generated_email_id'), 'generated_email', ['id'], unique=False)
    op.create_table('localized_copy',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('locale', sa.String(), nullable=False),
    sa.Column('key', sa.String(), nullable=False),
    sa.Column('value', sa.Text(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_localized_copy_id'), 'localized_copy', ['id'], unique=False)
    op.create_table('marketing_group',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('marketing_group_type_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['marketing_group_type_id'], ['marketing_group_type.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('project_id', 'marketing_group_type_id', name='uix_project_group_type')
    )
    op.create_index(op.f('ix_marketing_group_id'), 'marketing_group', ['id'], unique=False)
    op.create_table('project_tags',
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
    sa.ForeignKeyConstraint(['tag_id'], ['tag.id'], ),
    sa.PrimaryKeyConstraint('project_id', 'tag_id')
    )
    op.create_table('template',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('filename', sa.String(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_template_id'), 'template', ['id'], unique=False)
    op.create_table('placeholder',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('template_id', sa.Integer(), nullable=True),
    sa.Column('key', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['template_id'], ['template.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_placeholder_id'), 'placeholder', ['id'], unique=False)
    op.create_table('playwright_result',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('generated_email_id', sa.Integer(), nullable=True),
    sa.Column('passed', sa.Boolean(), nullable=True),
    sa.Column('issues', sa.Text(), nullable=True),
    sa.Column('tested_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['generated_email_id'], ['generated_email.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_playwright_result_id'), 'playwright_result', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_playwright_result_id'), table_name='playwright_result')
    op.drop_table('playwright_result')
    op.drop_index(op.f('ix_placeholder_id'), table_name='placeholder')
    op.drop_table('placeholder')
    op.drop_index(op.f('ix_template_id'), table_name='template')
    op.drop_table('template')
    op.drop_table('project_tags')
    op.drop_index(op.f('ix_marketing_group_id'), table_name='marketing_group')
    op.drop_table('marketing_group')
    op.drop_index(op.f('ix_localized_copy_id'), table_name='localized_copy')
    op.drop_table('localized_copy')
    op.drop_index(op.f('ix_generated_email_id'), table_name='generated_email')
    op.drop_table('generated_email')
    op.drop_index(op.f('ix_test_step_id'), table_name='test_step')
    op.drop_table('test_step')
    op.drop_index(op.f('ix_test_result_id'), table_name='test_result')
    op.drop_table('test_result')
    op.drop_index(op.f('ix_project_id'), table_name='project')
    op.drop_table('project')
    op.drop_index(op.f('ix_test_scenario_id'), table_name='test_scenario')
    op.drop_table('test_scenario')
    op.drop_index(op.f('ix_tag_id'), table_name='tag')
    op.drop_table('tag')
    op.drop_index(op.f('ix_marketing_group_type_id'), table_name='marketing_group_type')
    op.drop_table('marketing_group_type')
    op.drop_index(op.f('ix_customer_id'), table_name='customer')
    op.drop_table('customer')
    # ### end Alembic commands ###
