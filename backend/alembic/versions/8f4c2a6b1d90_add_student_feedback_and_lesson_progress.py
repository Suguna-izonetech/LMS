"""add student feedback and lesson progress

Revision ID: 8f4c2a6b1d90
Revises: 1d1dc80dd843
Create Date: 2026-09-21 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "8f4c2a6b1d90"
down_revision: Union[str, Sequence[str], None] = "1d1dc80dd843"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "student_lesson_completions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("lecture_id", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lecture_id"], ["lectures.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id", "lecture_id", name="uq_student_lesson_completion"),
    )
    op.create_index("ix_student_lesson_completions_id", "student_lesson_completions", ["id"])
    op.create_index("ix_student_lesson_completions_student_id", "student_lesson_completions", ["student_id"])
    op.create_index("ix_student_lesson_completions_lecture_id", "student_lesson_completions", ["lecture_id"])

    for table_name in ("teacher_feedback", "institute_admin_feedback"):
        columns = [
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("student_id", sa.Integer(), nullable=False),
            sa.Column("course_id", sa.Integer(), nullable=True),
            sa.Column("message", sa.String(length=2000), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=True),
            sa.Column("response", sa.String(length=2000), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        ]
        if table_name == "teacher_feedback":
            columns.insert(3, sa.Column("teacher_id", sa.Integer(), nullable=True))
            foreign_keys = [
                sa.ForeignKeyConstraint(["teacher_id"], ["users.id"], ondelete="SET NULL")
            ]
        else:
            columns.insert(5, sa.Column("session_mode", sa.String(length=50), nullable=True))
            foreign_keys = []
        foreign_keys.extend([
            sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        ])
        op.create_table(table_name, *columns, *foreign_keys, sa.PrimaryKeyConstraint("id"))
        op.create_index(f"ix_{table_name}_id", table_name, ["id"])
        op.create_index(f"ix_{table_name}_student_id", table_name, ["student_id"])
        op.create_index(f"ix_{table_name}_course_id", table_name, ["course_id"])


def downgrade() -> None:
    for table_name in ("teacher_feedback", "institute_admin_feedback"):
        op.drop_index(f"ix_{table_name}_course_id", table_name)
        op.drop_index(f"ix_{table_name}_student_id", table_name)
        op.drop_index(f"ix_{table_name}_id", table_name)
        op.drop_table(table_name)
    op.drop_index("ix_student_lesson_completions_lecture_id", "student_lesson_completions")
    op.drop_index("ix_student_lesson_completions_student_id", "student_lesson_completions")
    op.drop_index("ix_student_lesson_completions_id", "student_lesson_completions")
    op.drop_table("student_lesson_completions")
