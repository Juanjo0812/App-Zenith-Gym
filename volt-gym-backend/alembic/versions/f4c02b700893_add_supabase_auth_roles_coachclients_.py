"""add supabase auth roles coachclients

Revision ID: f4c02b700893
Revises: 
Create Date: 2026-03-12 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f4c02b700893'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # --- Roles Table ---
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # --- Coach Clients Table ---
    op.create_table(
        'coach_clients',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('coach_id', sa.UUID(), nullable=False),
        sa.Column('client_id', sa.UUID(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['client_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('coach_id', 'client_id', name='uq_coach_client')
    )

    # --- Add Columns to Users ---
    op.add_column('users', sa.Column('username', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('level', sa.Integer(), server_default='1', nullable=False))
    op.add_column('users', sa.Column('total_xp', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('is_coach', sa.Boolean(), server_default='false', nullable=False))
    op.create_unique_constraint('uq_users_username', 'users', ['username'])

    # --- User Roles Linking ---
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    # --- Routine Exercises Extension ---
    # Assuming exercise_routines and exercises exist or were part of initial setup
    # If not, add them here.
    op.add_column('exercises', sa.Column('difficulty', sa.String(length=50), nullable=True))
    op.add_column('exercises', sa.Column('equipment', sa.String(length=100), nullable=True))

    op.create_table(
        'routine_exercises',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('routine_id', sa.UUID(), nullable=False),
        sa.Column('exercise_id', sa.UUID(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('target_sets', sa.Integer(), nullable=True),
        sa.Column('target_reps', sa.Integer(), nullable=True),
        sa.Column('target_weight_kg', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ),
        sa.ForeignKeyConstraint(['routine_id'], ['exercise_routines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('routine_exercises')
    op.drop_table('user_roles')
    op.drop_constraint('uq_users_username', 'users', type_='unique')
    op.drop_column('users', 'is_coach')
    op.drop_column('users', 'total_xp')
    op.drop_column('users', 'level')
    op.drop_column('users', 'username')
    op.drop_column('exercises', 'equipment')
    op.drop_column('exercises', 'difficulty')
    op.drop_table('coach_clients')
    op.drop_table('roles')
