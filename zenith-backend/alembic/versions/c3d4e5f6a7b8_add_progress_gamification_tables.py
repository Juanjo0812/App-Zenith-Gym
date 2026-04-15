"""Add progress and gamification tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Weight logs for body weight tracking
    op.create_table(
        'weight_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('weight_kg', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('notes', sa.String, nullable=True),
        sa.Column('logged_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
    )

    # Badges definitions
    op.create_table(
        'badges',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('description', sa.String, nullable=True),
        sa.Column('icon', sa.String(50), nullable=False, server_default='star'),
        sa.Column('condition_type', sa.String(50), nullable=False),  # workouts_count, streak, pr_count, weight_lifted, etc.
        sa.Column('condition_value', sa.Integer, nullable=False, server_default='1'),
        sa.Column('xp_reward', sa.Integer, nullable=False, server_default='50'),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
    )

    # User badges (unlocked achievements)
    op.create_table(
        'user_badges',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('badge_id', UUID(as_uuid=True), sa.ForeignKey('badges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('unlocked_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge'),
    )

    # Challenges
    op.create_table(
        'challenges',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String, nullable=True),
        sa.Column('goal_type', sa.String(50), nullable=False),  # workouts, streak, weight_logged, etc.
        sa.Column('goal_value', sa.Integer, nullable=False),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),
        sa.Column('xp_reward', sa.Integer, nullable=False, server_default='100'),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
    )

    # User challenge progress
    op.create_table(
        'user_challenge_progress',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('challenge_id', UUID(as_uuid=True), sa.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('current_value', sa.Integer, nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('joined_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id', 'challenge_id', name='uq_user_challenge'),
    )

    # Seed badges
    op.execute("""
        INSERT INTO badges (name, description, icon, condition_type, condition_value, xp_reward) VALUES
        ('Primera sangre', 'Completaste tu primer entrenamiento', 'star', 'workouts_count', 1, 50),
        ('Dedicación', 'Completaste 10 entrenamientos', 'emoji-events', 'workouts_count', 10, 100),
        ('Máquina imparable', 'Completaste 50 entrenamientos', 'military-tech', 'workouts_count', 50, 300),
        ('Racha de titán', 'Entrenaste 5 días seguidos', 'local-fire-department', 'streak', 5, 150),
        ('Racha legendaria', 'Entrenaste 30 días seguidos', 'whatshot', 'streak', 30, 500),
        ('Récord personal', 'Lograste tu primer PR', 'fitness-center', 'pr_count', 1, 75)
    """)

    # Seed challenges
    op.execute("""
        INSERT INTO challenges (name, description, goal_type, goal_value, start_date, end_date, xp_reward, is_active) VALUES
        ('Marzo de hierro', 'Completa 20 entrenamientos este mes', 'workouts', 20, '2026-03-01', '2026-03-31', 200, true),
        ('30 días de consistencia', 'Entrena al menos 1 vez al día durante 30 días', 'streak', 30, '2026-03-01', '2026-04-30', 500, true)
    """)


def downgrade() -> None:
    op.drop_table('user_challenge_progress')
    op.drop_table('challenges')
    op.drop_table('user_badges')
    op.drop_table('badges')
    op.drop_table('weight_logs')
