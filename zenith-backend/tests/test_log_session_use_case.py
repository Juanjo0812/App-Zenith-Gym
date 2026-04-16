from uuid import uuid4

import pytest

from src.domain.user.entities import UserEntity
from src.domain.workout.entities import SetLog, WorkoutSessionEntity
from src.time_utils import utc_now
from src.use_cases.log_session_apply_xp import LogSessionUseCase


class FakeWorkoutRepo:
    def __init__(self, session: WorkoutSessionEntity | None):
        self.session = session
        self.saved_session: WorkoutSessionEntity | None = None

    async def get_by_id(self, session_id):
        if self.session and self.session.id == session_id:
            return self.session
        return None

    async def save(self, entity: WorkoutSessionEntity):
        self.saved_session = entity


class FakeUserRepo:
    def __init__(self, user: UserEntity | None):
        self.user = user
        self.saved_user: UserEntity | None = None

    async def get_by_id(self, user_id):
        if self.user and self.user.id == user_id:
            return self.user
        return None

    async def save(self, entity: UserEntity):
        self.saved_user = entity


@pytest.mark.asyncio
async def test_log_session_use_case_awards_five_xp_per_set():
    user_id = uuid4()
    session = WorkoutSessionEntity(
        id=uuid4(),
        user_id=user_id,
        started_at=utc_now(),
        sets=[
            SetLog(exercise_id=uuid4(), reps=10, weight_kg=20),
            SetLog(exercise_id=uuid4(), reps=8, weight_kg=30),
            SetLog(exercise_id=uuid4(), reps=6, weight_kg=40),
        ],
    )
    user = UserEntity(id=user_id, name="Zenith", level=1, total_xp=0)
    workout_repo = FakeWorkoutRepo(session)
    user_repo = FakeUserRepo(user)

    result = await LogSessionUseCase(workout_repo, user_repo).execute(session.id, user_id)

    assert result["xp_earned"] == 15
    assert result["new_total_xp"] == 15
    assert result["new_level"] == 1
    assert workout_repo.saved_session is not None
    assert workout_repo.saved_session.ended_at is not None
    assert user_repo.saved_user is not None
    assert user_repo.saved_user.total_xp == 15


@pytest.mark.asyncio
async def test_log_session_use_case_rejects_foreign_session():
    owner_id = uuid4()
    other_user_id = uuid4()
    session = WorkoutSessionEntity(
        id=uuid4(),
        user_id=owner_id,
        started_at=utc_now(),
    )
    user = UserEntity(id=other_user_id, name="Zenith", level=1, total_xp=0)

    with pytest.raises(PermissionError):
        await LogSessionUseCase(
            FakeWorkoutRepo(session),
            FakeUserRepo(user),
        ).execute(session.id, other_user_id)
