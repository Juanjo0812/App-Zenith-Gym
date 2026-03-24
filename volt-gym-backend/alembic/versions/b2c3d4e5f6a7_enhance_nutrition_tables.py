"""Enhance nutrition tables with meal_type, serving_size, water tracking

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # meal_type ya existe en la base de datos, así que no lo agregamos.
    
    # Add serving_size for more precise logging
    op.add_column(
        'meals_logged',
        sa.Column('serving_size', sa.String(100), nullable=True)
    )
    # Add notes column
    op.add_column(
        'meals_logged',
        sa.Column('notes', sa.String, nullable=True)
    )

    # Add water tracking to meal_plans
    op.add_column(
        'meal_plans',
        sa.Column('water_ml', sa.Integer, nullable=True, server_default='0')
    )
    # Add notes for the day
    op.add_column(
        'meal_plans',
        sa.Column('notes', sa.String, nullable=True)
    )

    # Create water_logs table for granular hydration tracking
    op.create_table(
        'water_logs',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount_ml', sa.Integer, nullable=False),
        sa.Column('logged_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('water_logs')
    op.drop_column('meal_plans', 'notes')
    op.drop_column('meal_plans', 'water_ml')
    op.drop_column('meals_logged', 'notes')
    op.drop_column('meals_logged', 'serving_size')
