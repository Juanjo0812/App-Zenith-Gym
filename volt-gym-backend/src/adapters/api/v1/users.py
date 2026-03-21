from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.auth import AuthenticatedUser, get_current_user
from src.infrastructure.database.base import get_session
from src.infrastructure.database.models import (
    MealLogModel,
    MealPlanModel,
    RoleModel,
    SetLogModel,
    UserModel,
    UserRoleModel,
    WorkoutRoutineModel,
    WorkoutSessionModel,
)

router = APIRouter(prefix="/users", tags=["Users"])


class UserProfileResponse(BaseModel):
    id: UUID
    name: str | None = None
    username: str | None = None
    email: str | None = None
    level: int
    total_xp: int
    roles: list[str] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None
    address: str | None = None
    profile_image_url: str | None = None
    avatar_url: str | None = None
    phone_number: str | None = None
    phone: str | None = None


class WorkoutSummaryResponse(BaseModel):
    name: str
    date: str
    duration: str


class TodayCaloriesResponse(BaseModel):
    consumed: int
    target: int


class UserDashboardResponse(BaseModel):
    last_workout: WorkoutSummaryResponse | None = None
    weekly_count: int
    today_calories: TodayCaloriesResponse


class UserStatsResponse(BaseModel):
    total_workouts: int
    streak: int
    prs: int
    member_since: str


class UpdateUserProfileRequest(BaseModel):
    name: str | None = None
    username: str | None = None
    address: str | None = None
    phone_number: str | None = None
    phone: str | None = None
    profile_image_url: str | None = None
    avatar_url: str | None = None


def _metadata_value(current_user: AuthenticatedUser, *keys: str) -> str | None:
    metadata_sources = [current_user.user_metadata, current_user.app_metadata]
    for metadata in metadata_sources:
        for key in keys:
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def _format_relative_date(started_at: datetime | None, now: datetime) -> str:
    if not started_at:
        return ""

    diff_days = (now.date() - started_at.date()).days
    if diff_days <= 0:
        return "Hoy"
    if diff_days == 1:
        return "Ayer"
    return f"Hace {diff_days} días"


def _format_duration(started_at: datetime | None, ended_at: datetime | None) -> str:
    if not started_at or not ended_at:
        return ""

    diff_minutes = max(0, int((ended_at - started_at).total_seconds() // 60))
    hours, minutes = divmod(diff_minutes, 60)
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _calculate_streak(session_dates: list[datetime], today: date) -> int:
    if not session_dates:
        return 0

    workout_dates = sorted({session_date.date() for session_date in session_dates}, reverse=True)
    if workout_dates[0] not in {today, today - timedelta(days=1)}:
        return 0

    streak = 1
    for index in range(1, len(workout_dates)):
        previous = workout_dates[index - 1]
        current = workout_dates[index]
        if (previous - current).days == 1:
            streak += 1
        else:
            break
    return streak


async def _load_user_model(session: AsyncSession, user_id: UUID) -> UserModel:
    result = await session.execute(select(UserModel).where(UserModel.id == user_id))
    return result.scalar_one()


async def _get_user_roles(session: AsyncSession, user_id: UUID) -> list[str]:
    result = await session.execute(
        select(RoleModel.name)
        .join(UserRoleModel, UserRoleModel.role_id == RoleModel.id)
        .where(UserRoleModel.user_id == user_id)
    )
    return [row for row in result.scalars().all()]


def _profile_response(
    db_user: UserModel,
    current_user: AuthenticatedUser,
    roles: list[str] = None
) -> UserProfileResponse:
    metadata_name = _metadata_value(current_user, "name", "full_name", "display_name")
    metadata_username = _metadata_value(current_user, "username")
    metadata_phone = _metadata_value(current_user, "phone")

    name = db_user.name or metadata_name
    phone_number = db_user.phone_number or metadata_phone
    avatar_url = db_user.profile_image_url

    return UserProfileResponse(
        id=db_user.id,
        name=name,
        username=metadata_username,
        email=current_user.email,
        level=db_user.level or 1,
        total_xp=db_user.total_xp or 0,
        roles=roles or [],
        created_at=db_user.created_at,
        updated_at=db_user.updated_at,
        address=db_user.address,
        profile_image_url=avatar_url,
        avatar_url=avatar_url,
        phone_number=phone_number,
        phone=phone_number,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    db_user = await _load_user_model(session, current_user.id)
    roles = await _get_user_roles(session, current_user.id)
    return _profile_response(db_user, current_user, roles)


@router.get("/me/dashboard", response_model=UserDashboardResponse)
async def get_my_dashboard(
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    now = datetime.utcnow()
    today = now.date()
    week_ago = now - timedelta(days=7)

    last_session_result = await session.execute(
        select(
            WorkoutSessionModel.started_at,
            WorkoutSessionModel.ended_at,
            WorkoutRoutineModel.name,
        )
        .outerjoin(WorkoutRoutineModel, WorkoutRoutineModel.id == WorkoutSessionModel.routine_id)
        .where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
        )
        .order_by(WorkoutSessionModel.ended_at.desc())
        .limit(1)
    )
    last_session = last_session_result.first()

    weekly_count_result = await session.execute(
        select(func.count(WorkoutSessionModel.id)).where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
            WorkoutSessionModel.started_at >= week_ago,
        )
    )
    weekly_count = weekly_count_result.scalar_one() or 0

    today_meals_result = await session.execute(
        select(func.coalesce(func.sum(MealLogModel.calories), 0)).where(
            MealLogModel.user_id == current_user.id,
            MealLogModel.logged_at >= datetime.combine(today, datetime.min.time()),
            MealLogModel.logged_at <= datetime.combine(today, datetime.max.time()),
        )
    )
    today_meals = int(today_meals_result.scalar_one() or 0)

    meal_plan_result = await session.execute(
        select(MealPlanModel.target_calories).where(
            MealPlanModel.user_id == current_user.id,
            MealPlanModel.date == today,
        )
    )
    meal_target = int(meal_plan_result.scalar_one_or_none() or 0)

    last_workout = None
    if last_session:
        last_workout = WorkoutSummaryResponse(
            name=last_session.name or "Sesión libre",
            date=_format_relative_date(last_session.started_at, now),
            duration=_format_duration(last_session.started_at, last_session.ended_at),
        )

    return UserDashboardResponse(
        last_workout=last_workout,
        weekly_count=int(weekly_count),
        today_calories=TodayCaloriesResponse(consumed=today_meals, target=meal_target),
    )


@router.get("/me/stats", response_model=UserStatsResponse)
async def get_my_stats(
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    today = date.today()

    total_workouts_result = await session.execute(
        select(func.count(WorkoutSessionModel.id)).where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
        )
    )
    total_workouts = int(total_workouts_result.scalar_one() or 0)

    prs_result = await session.execute(
        select(func.count(SetLogModel.id))
        .join(WorkoutSessionModel, WorkoutSessionModel.id == SetLogModel.session_id)
        .where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
            SetLogModel.is_pr.is_(True),
        )
    )
    prs = int(prs_result.scalar_one() or 0)

    sessions_result = await session.execute(
        select(WorkoutSessionModel.started_at).where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
        )
        .order_by(WorkoutSessionModel.started_at.desc())
        .limit(60)
    )
    session_dates = [value for value in sessions_result.scalars().all() if value is not None]

    db_user = await _load_user_model(session, current_user.id)
    member_since = db_user.created_at.date().isoformat() if db_user.created_at else ""

    return UserStatsResponse(
        total_workouts=total_workouts,
        streak=_calculate_streak(session_dates, today),
        prs=prs,
        member_since=member_since,
    )


@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(
    payload: UpdateUserProfileRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    db_user = await _load_user_model(session, current_user.id)
    roles = await _get_user_roles(session, current_user.id)

    phone_number = payload.phone_number if payload.phone_number is not None else payload.phone
    profile_image_url = (
        payload.profile_image_url
        if payload.profile_image_url is not None
        else payload.avatar_url
    )

    if payload.name is not None:
        db_user.name = payload.name.strip() or None
    if payload.address is not None:
        db_user.address = payload.address.strip() or None
    if phone_number is not None:
        db_user.phone_number = phone_number.strip() or None
    if profile_image_url is not None:
        db_user.profile_image_url = profile_image_url.strip() or None

    db_user.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(db_user)

    return _profile_response(db_user, current_user, roles)
