"""add gym classes tables

Revision ID: a1b2c3d4e5f6
Revises: f4c02b700893
Create Date: 2026-03-20 23:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f4c02b700893'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- class_types ---
    op.create_table(
        'class_types',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True, server_default='#FF4500'),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_class_types')),
        sa.UniqueConstraint('name', name=op.f('uq_class_types_name')),
    )

    # --- scheduled_classes ---
    op.create_table(
        'scheduled_classes',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('class_type_id', sa.UUID(), nullable=False),
        sa.Column('instructor_id', sa.UUID(), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.String(length=5), nullable=False),
        sa.Column('end_time', sa.String(length=5), nullable=False),
        sa.Column('max_capacity', sa.Integer(), nullable=True, server_default='20'),
        sa.Column('location', sa.String(length=255), nullable=True, server_default="'Sala principal'"),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_cancelled', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_scheduled_classes')),
        sa.ForeignKeyConstraint(['class_type_id'], ['class_types.id'], name=op.f('fk_scheduled_classes_class_type_id_class_types'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['instructor_id'], ['users.id'], name=op.f('fk_scheduled_classes_instructor_id_users'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_scheduled_classes_created_by_users'), ondelete='SET NULL'),
    )

    # --- class_enrollments ---
    op.create_table(
        'class_enrollments',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('scheduled_class_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('enrolled_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('status', sa.String(length=20), nullable=True, server_default="'enrolled'"),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_class_enrollments')),
        sa.ForeignKeyConstraint(['scheduled_class_id'], ['scheduled_classes.id'], name=op.f('fk_class_enrollments_scheduled_class_id_scheduled_classes'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_class_enrollments_user_id_users'), ondelete='CASCADE'),
        sa.UniqueConstraint('scheduled_class_id', 'user_id', name='uq_class_enrollments_class_user'),
    )

    # Enable RLS on all new tables
    op.execute("ALTER TABLE class_types ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE scheduled_classes ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY")

    # RLS policies: allow authenticated users full access (managed by API layer)
    op.execute("""
        CREATE POLICY "class_types_authenticated" ON class_types
        FOR ALL USING (true) WITH CHECK (true)
    """)
    op.execute("""
        CREATE POLICY "scheduled_classes_authenticated" ON scheduled_classes
        FOR ALL USING (true) WITH CHECK (true)
    """)
    op.execute("""
        CREATE POLICY "class_enrollments_authenticated" ON class_enrollments
        FOR ALL USING (true) WITH CHECK (true)
    """)

    # Seed default class types
    op.execute("""
        INSERT INTO class_types (name, description, color, icon) VALUES
        ('Funcional', 'Entrenamiento funcional de alta intensidad', '#FF6B35', 'fitness-center'),
        ('Step', 'Clase de step aeróbico con coreografía', '#4CAF50', 'stairs'),
        ('Cardio box', 'Ejercicio cardiovascular con técnicas de boxeo', '#E91E63', 'sports-mma')
        ON CONFLICT (name) DO NOTHING
    """)

    # Seed some example classes for the next 7 days
    op.execute("""
        INSERT INTO scheduled_classes (class_type_id, scheduled_date, start_time, end_time, location, max_capacity)
        SELECT 
            id, 
            CURRENT_DATE + (id_mod || ' days')::interval,
            '08:00', '09:00', 'Sala principal', 20
        FROM (
            SELECT id, row_number() OVER () % 4 as id_mod FROM class_types
        ) sub
    """)


def downgrade() -> None:
    op.drop_table('class_enrollments')
    op.drop_table('scheduled_classes')
    op.drop_table('class_types')
