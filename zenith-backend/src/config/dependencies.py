"""
Dependency Injection for FastAPI.
Provides repository and use-case instances per-request via Depends().
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.database.base import get_session
from src.adapters.repositories.sqlalchemy_workout_repository import SQLAlchemyWorkoutRepository
from src.adapters.repositories.sqlalchemy_user_repository import SQLAlchemyUserRepository
from src.adapters.repositories.sqlalchemy_exercise_repository import SQLAlchemyExerciseRepository
from src.use_cases.log_session_apply_xp import LogSessionUseCase


async def get_workout_repo(session: AsyncSession = Depends(get_session)):
    return SQLAlchemyWorkoutRepository(session)


async def get_user_repo(session: AsyncSession = Depends(get_session)):
    return SQLAlchemyUserRepository(session)


async def get_exercise_repo(session: AsyncSession = Depends(get_session)):
    return SQLAlchemyExerciseRepository(session)


async def get_log_session_use_case(
    session: AsyncSession = Depends(get_session),
):
    workout_repo = SQLAlchemyWorkoutRepository(session)
    user_repo = SQLAlchemyUserRepository(session)
    return LogSessionUseCase(workout_repo, user_repo)
