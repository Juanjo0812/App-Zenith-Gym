import uuid

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Date, ARRAY, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.time_utils import utc_now

from .base import Base

class UserModel(Base):
    __tablename__ = "users"

    # UUID provided externally by Supabase Auth
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255), nullable=True) # Optional upon signup
    profile_image_url = Column(String, nullable=True)
    phone_number = Column(String(50), nullable=True)
    address = Column(String, nullable=True)
    level = Column(Integer, default=1)
    total_xp = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    roles = relationship("UserRoleModel", back_populates="user", cascade="all, delete-orphan")
    coach_relationships = relationship("CoachClientModel", foreign_keys="[CoachClientModel.coach_id]", back_populates="coach", cascade="all, delete-orphan")
    client_relationships = relationship("CoachClientModel", foreign_keys="[CoachClientModel.client_id]", back_populates="client", cascade="all, delete-orphan")
    
    workout_routines = relationship("WorkoutRoutineModel", back_populates="user")
    workout_sessions = relationship("WorkoutSessionModel", back_populates="user")
    meal_plans = relationship("MealPlanModel", back_populates="user")
    meals_logged = relationship("MealLogModel", back_populates="user")
    recovery_logs = relationship("RecoveryLogModel", back_populates="user")
    water_logs = relationship("WaterLogModel", back_populates="user")
    weight_logs_entries = relationship("WeightLogModel", back_populates="user")
    user_badges = relationship("UserBadgeModel", back_populates="user")
    challenge_progress = relationship("UserChallengeProgressModel", back_populates="user")
    created_exercises = relationship("ExerciseModel", back_populates="creator")

class RoleModel(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("UserRoleModel", back_populates="role")

class UserRoleModel(Base):
    __tablename__ = "user_roles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

    user = relationship("UserModel", back_populates="roles")
    role = relationship("RoleModel", back_populates="users")

class CoachClientModel(Base):
    __tablename__ = "coach_clients"

    coach_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=utc_now)

    coach = relationship("UserModel", foreign_keys=[coach_id], back_populates="coach_relationships")
    client = relationship("UserModel", foreign_keys=[client_id], back_populates="client_relationships")

class ExerciseModel(Base):
    __tablename__ = "exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    primary_muscle = Column(String(100), nullable=False)
    secondary_muscles = Column(ARRAY(String), default=[])
    equipment = Column(String(100))
    difficulty = Column(String(50))
    instructions = Column(String)
    video_url = Column(String)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_public = Column(Boolean, default=True)

    creator = relationship("UserModel", back_populates="created_exercises")

class WorkoutRoutineModel(Base):
    __tablename__ = "workout_routines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="workout_routines")
    routine_exercises = relationship("RoutineExerciseModel", back_populates="routine", cascade="all, delete-orphan")
    sessions = relationship("WorkoutSessionModel", back_populates="routine", cascade="all, delete-orphan")

class RoutineExerciseModel(Base):
    __tablename__ = "routine_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("workout_routines.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, default=0)
    target_sets = Column(Integer, default=3)
    target_reps = Column(Integer, default=10)
    target_weight_kg = Column(Numeric(precision=10, scale=2), default=0.0)

    routine = relationship("WorkoutRoutineModel", back_populates="routine_exercises")
    exercise = relationship("ExerciseModel")

class WorkoutSessionModel(Base):
    __tablename__ = "workout_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("workout_routines.id", ondelete="SET NULL"))
    started_at = Column(DateTime, default=utc_now)
    ended_at = Column(DateTime)

    user = relationship("UserModel", back_populates="workout_sessions")
    routine = relationship("WorkoutRoutineModel", back_populates="sessions")
    sets = relationship("SetLogModel", back_populates="session", cascade="all, delete-orphan")

class SetLogModel(Base):
    __tablename__ = "set_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=False)
    reps = Column(Integer, nullable=False)
    weight_kg = Column(Numeric(precision=10, scale=2), nullable=False)
    rest_seconds = Column(Integer)
    is_pr = Column(Boolean, default=False)

    session = relationship("WorkoutSessionModel", back_populates="sets")
    exercise = relationship("ExerciseModel")

class MealPlanModel(Base):
    __tablename__ = "meal_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_calories = Column(Integer)
    target_protein = Column(Integer)
    target_carbs = Column(Integer)
    target_fats = Column(Integer)
    water_ml = Column(Integer, default=0)
    notes = Column(String, nullable=True)
    date = Column(Date, nullable=False)

    user = relationship("UserModel", back_populates="meal_plans")

class MealLogModel(Base):
    __tablename__ = "meals_logged"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    food_name = Column(String(255), nullable=False)
    calories = Column(Integer)
    protein = Column(Integer)
    carbs = Column(Integer)
    fats = Column(Integer)
    meal_type = Column(String(50), default="otro")  # desayuno, almuerzo, cena, snack, otro
    serving_size = Column(String(100), nullable=True)
    notes = Column(String, nullable=True)
    logged_at = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="meals_logged")

class WaterLogModel(Base):
    __tablename__ = "water_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount_ml = Column(Integer, nullable=False)
    logged_at = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="water_logs")

class RecoveryLogModel(Base):
    __tablename__ = "recovery_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    sleep_hours = Column(Float)
    fatigue_score = Column(Integer)
    source = Column(String(50)) # 'manual', 'healthkit', 'health_connect'

    user = relationship("UserModel", back_populates="recovery_logs")


class ClassTypeModel(Base):
    __tablename__ = "class_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String, nullable=True)
    color = Column(String(7), default="#00E5FF")
    icon = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    scheduled_classes = relationship("ScheduledClassModel", back_populates="class_type", cascade="all, delete-orphan")


class ScheduledClassModel(Base):
    __tablename__ = "scheduled_classes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_type_id = Column(UUID(as_uuid=True), ForeignKey("class_types.id", ondelete="CASCADE"), nullable=False)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    start_time = Column(String(5), nullable=False)  # HH:MM format
    end_time = Column(String(5), nullable=False)
    max_capacity = Column(Integer, default=20)
    location = Column(String(255), default="Sala principal")
    notes = Column(String, nullable=True)
    is_cancelled = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    class_type = relationship("ClassTypeModel", back_populates="scheduled_classes")
    instructor = relationship("UserModel", foreign_keys=[instructor_id])
    creator = relationship("UserModel", foreign_keys=[created_by])
    enrollments = relationship("ClassEnrollmentModel", back_populates="scheduled_class", cascade="all, delete-orphan")


class ClassEnrollmentModel(Base):
    __tablename__ = "class_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheduled_class_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_classes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime, default=utc_now)
    status = Column(String(20), default="enrolled")  # 'enrolled', 'cancelled', 'attended'

    scheduled_class = relationship("ScheduledClassModel", back_populates="enrollments")
    user = relationship("UserModel")


class WeightLogModel(Base):
    __tablename__ = "weight_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weight_kg = Column(Numeric(precision=5, scale=2), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    logged_at = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="weight_logs_entries")


class BadgeModel(Base):
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String(50), nullable=False, default="star")
    condition_type = Column(String(50), nullable=False)
    condition_value = Column(Integer, nullable=False, default=1)
    xp_reward = Column(Integer, nullable=False, default=50)
    created_at = Column(DateTime, default=utc_now)

    user_badges = relationship("UserBadgeModel", back_populates="badge")


class UserBadgeModel(Base):
    __tablename__ = "user_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="user_badges")
    badge = relationship("BadgeModel", back_populates="user_badges")


class ChallengeModel(Base):
    __tablename__ = "challenges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    goal_type = Column(String(50), nullable=False)
    goal_value = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    xp_reward = Column(Integer, nullable=False, default=100)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    user_progress = relationship("UserChallengeProgressModel", back_populates="challenge")


class UserChallengeProgressModel(Base):
    __tablename__ = "user_challenge_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    current_value = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="challenge_progress")
    challenge = relationship("ChallengeModel", back_populates="user_progress")
