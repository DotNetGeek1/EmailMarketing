from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create marketing_group_type table
    op.create_table(
        'marketing_group_type',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('label', sa.String(), nullable=False, unique=True),
        sa.Column('code', sa.String(), nullable=False, unique=True),
    )

    # Add project_id and marketing_group_type_id to marketing_group
    op.add_column('marketing_group', sa.Column('project_id', sa.Integer(), sa.ForeignKey('project.id'), nullable=False))
    op.add_column('marketing_group', sa.Column('marketing_group_type_id', sa.Integer(), sa.ForeignKey('marketing_group_type.id'), nullable=False))
    op.add_column('marketing_group', sa.Column('created_at', sa.DateTime(), nullable=True))

    # Remove name and code from marketing_group
    op.drop_column('marketing_group', 'name')
    op.drop_column('marketing_group', 'code')

    # Add unique constraint
    op.create_unique_constraint('uix_project_group_type', 'marketing_group', ['project_id', 'marketing_group_type_id'])

    # Remove marketing_group_id from project if it exists
    with op.batch_alter_table('project') as batch_op:
        if 'marketing_group_id' in [c['name'] for c in batch_op.get_columns()]:
            batch_op.drop_column('marketing_group_id')

def downgrade():
    # Drop unique constraint
    op.drop_constraint('uix_project_group_type', 'marketing_group', type_='unique')
    # Add name and code back to marketing_group
    op.add_column('marketing_group', sa.Column('name', sa.String(), nullable=False))
    op.add_column('marketing_group', sa.Column('code', sa.String(), nullable=False, unique=True))
    # Remove project_id and marketing_group_type_id
    op.drop_column('marketing_group', 'project_id')
    op.drop_column('marketing_group', 'marketing_group_type_id')
    op.drop_column('marketing_group', 'created_at')
    # Drop marketing_group_type table
    op.drop_table('marketing_group_type')
    # Add marketing_group_id back to project
    op.add_column('project', sa.Column('marketing_group_id', sa.Integer(), sa.ForeignKey('marketing_group.id'), nullable=True)) 