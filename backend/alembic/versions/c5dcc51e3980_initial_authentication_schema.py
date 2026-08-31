"""Initial authentication schema

Revision ID: c5dcc51e3980
Revises: 
Create Date: 2026-08-18 10:09:16.377658

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5dcc51e3980'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('institutes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('subdomain', sa.String(length=100), nullable=True),
    sa.Column('custom_domain', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('logo_url', sa.String(), nullable=True),
    sa.Column('banner_url', sa.String(), nullable=True),
    sa.Column('about_text', sa.String(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('google_maps_link', sa.String(), nullable=True),
    sa.Column('seo_metadata', sa.String(), nullable=True),
    sa.Column('youtube_link', sa.String(), nullable=True),
    sa.Column('social_links', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_institutes_id'), 'institutes', ['id'], unique=False)
    op.create_index(op.f('ix_institutes_subdomain'), 'institutes', ['subdomain'], unique=True)

    op.create_table('institute_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institute_id', sa.Integer(), nullable=True),
    sa.Column('header_logo', sa.String(), nullable=True),
    sa.Column('share_zoom_recordings', sa.Boolean(), nullable=True),
    sa.Column('min_attendance_percentage', sa.Integer(), nullable=True),
    sa.Column('enable_student_feedback', sa.Boolean(), nullable=True),
    sa.Column('country', sa.String(), nullable=True),
    sa.Column('time_zone', sa.String(), nullable=True),
    sa.Column('chat_enabled', sa.Boolean(), nullable=True),
    sa.Column('disappearing_chats_enabled', sa.Boolean(), nullable=True),
    sa.Column('allow_message_deletion', sa.Boolean(), nullable=True),
    sa.Column('allow_student_posts', sa.Boolean(), nullable=True),
    sa.Column('allow_student_comments', sa.Boolean(), nullable=True),
    sa.Column('hide_student_info_from_teachers', sa.Boolean(), nullable=True),
    sa.Column('restrict_teacher_content_visibility', sa.Boolean(), nullable=True),
    sa.Column('allow_study_material_download', sa.Boolean(), nullable=True),
    sa.Column('require_live_class_approval', sa.Boolean(), nullable=True),
    sa.Column('allow_book_download', sa.Boolean(), nullable=True),
    sa.Column('strict_quiz_timing', sa.Boolean(), nullable=True),
    sa.Column('strict_assignment_deadlines', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['institute_id'], ['institutes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('institute_id')
    )
    op.create_index(op.f('ix_institute_settings_id'), 'institute_settings', ['id'], unique=False)

    op.create_table('permissions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)

    op.create_table('roles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institute_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['institute_id'], ['institutes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('institute_id', 'name', name='uq_institute_role_name')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=False)

    op.create_table('role_permissions',
    sa.Column('role_id', sa.Integer(), nullable=False),
    sa.Column('permission_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('institute_id', sa.Integer(), nullable=True),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=100), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['institute_id'], ['institutes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table('user_roles',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('role_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    op.create_table('refresh_tokens',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('token', sa.String(length=255), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_tokens_id'), 'refresh_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_token'), 'refresh_tokens', ['token'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_refresh_tokens_token'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_table('user_roles')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    op.drop_table('role_permissions')
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')
    op.drop_index(op.f('ix_permissions_name'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
    op.drop_table('permissions')
    op.drop_index(op.f('ix_institute_settings_id'), table_name='institute_settings')
    op.drop_table('institute_settings')
    op.drop_index(op.f('ix_institutes_subdomain'), table_name='institutes')
    op.drop_index(op.f('ix_institutes_id'), table_name='institutes')
    op.drop_table('institutes')
