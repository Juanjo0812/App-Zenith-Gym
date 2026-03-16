from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Date, ARRAY, JSON, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    level = Column(Integer, default=1)
    total_xp = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workout_sessions = relationship("WorkoutSessionModel", back_populates="user")
    meal_plans = relationship("MealPlanModel", back_populates="user")
    meals_logged = relationship("MealLogModel", back_populates="user")
    recovery_logs = relationship("RecoveryLogModel", back_populates="user")

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

class WorkoutRoutineModel(Base):
    __tablename__ = "workout_routines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String(255), nullable=False)
    is_ai_generated = Column(Boolean, default=False)

    user = relationship("UserModel")

class WorkoutSessionModel(Base):
    __tablename__ = "workout_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("workout_routines.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)

    user = relationship("UserModel", back_populates="workout_sessions")
    routine = relationship("WorkoutRoutineModel")
    sets = relationship("SetLogModel", back_populates="session")

class SetLogModel(Base):
    __tablename__ = "set_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=False)
    reps = Column(Integer, nullable=False)
    weight_kg = Column(Numeric(precision=10, scale=2), nullable=False)
    rest_seconds = Column(Integer)
    is_pr = Column(Boolean, default=False)

    session = relationship("WorkoutSessionModel", back_populates="sets")
    exercise = relationship("ExerciseModel")

class MealPlanModel(Base) :
    __tablename__ = "meal_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    target_calories = Column(Integer)
    target_protein = Column(Integer)
    target_carbs = Column(Integer)
    target_fats = Column(Integer)
    date = Column(Date, nullable=False)

    user = relationship("UserModel", back_populates="meal_plans")

class MealLogModel(Base):
    __tablename__ = "meals_logged"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    food_name = Column(String(255), nullable=False)
    calories = Column(Integer)
    protein = Column(Integer)
    carbs = Column(Integer)
    fats = Column(Integer)
    logged_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserModel", back_populates="meals_logged")

class RecoveryLogModel(Base):
    __tablename__ = "recovery_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    sleep_hours = Column(Float)
    fatigue_score = Column(Integer)
    source = Column(String(50)) # 'manual', 'healthkit', 'health_connect'

    user = relationship("UserModel", back_populates="recovery_logs")
