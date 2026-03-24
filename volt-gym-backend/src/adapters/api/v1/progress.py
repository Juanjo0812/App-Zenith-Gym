from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc, case
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.auth import get_current_user, AuthenticatedUser
from src.infrastructure.database.base import get_session
from src.infrastructure.database.models import (
    BadgeModel,
    ChallengeModel,
    ExerciseModel,
    SetLogModel,
    UserBadgeModel,
    UserChallengeProgressModel,
    UserModel,
    WeightLogModel,
    WorkoutSessionModel,
)

router = APIRouter(prefix="/progress", tags=["Progreso"])


# ─── Response schemas ────────────────────────────────────────────────

class BadgeResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    icon: str
    condition_type: str
    condition_value: int
    xp_reward: int
    unlocked: bool
    unlocked_at: datetime | None = None


class ChallengeResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    goal_type: str
    goal_value: int
    current_value: int
    xp_reward: int
    start_date: date
    end_date: date
    days_left: int
    completed: bool
    joined: bool


class OverviewResponse(BaseModel):
    level: int
    total_xp: int
    xp_next_level: int
    total_workouts: int
    streak: int
    prs: int
    member_since: str
    badges: list[BadgeResponse]
    challenges: list[ChallengeResponse]


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    xp: int
    is_current_user: bool


class WeightLogResponse(BaseModel):
    id: UUID
    weight_kg: float
    date: str
    notes: str | None
    logged_at: datetime


class LogWeightRequest(BaseModel):
    weight_kg: float = Field(gt=20, lt=500)
    date: str | None = None
    notes: str | None = None


class StrengthGainResponse(BaseModel):
    exercise_name: str
    first_max_kg: float
    current_max_kg: float
    improvement_kg: float
    improvement_pct: float


# ─── Helpers ─────────────────────────────────────────────────────────

XP_PER_LEVEL = 500


def _xp_for_next_level(level: int) -> int:
    return level * XP_PER_LEVEL


def _calculate_streak(session_dates: list[datetime], today: date) -> int:
    if not session_dates:
        return 0

    unique_dates = sorted(set(d.date() if isinstance(d, datetime) else d for d in session_dates), reverse=True)

    if unique_dates[0] != today and unique_dates[0] != today.replace(day=today.day - 1 if today.day > 1 else today.day):
        from datetime import timedelta
        if unique_dates[0] < today - timedelta(days=1):
            return 0

    streak = 1
    for i in range(1, len(unique_dates)):
        from datetime import timedelta
        if unique_dates[i - 1] - unique_dates[i] == timedelta(days=1):
            streak += 1
        else:
            break
    return streak


# ─── Overview endpoint ───────────────────────────────────────────────

@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Resumen completo de progreso: nivel, XP, medallas, retos."""
    today = date.today()

    # User info
    user_result = await session.execute(
        select(UserModel).where(UserModel.id == current_user.id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    level = user.level or 1
    total_xp = user.total_xp or 0
    member_since = user.created_at.date().isoformat() if user.created_at else ""

    # Total workouts
    wk_result = await session.execute(
        select(func.count(WorkoutSessionModel.id)).where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
        )
    )
    total_workouts = int(wk_result.scalar_one() or 0)

    # PRs count
    pr_result = await session.execute(
        select(func.count(SetLogModel.id))
        .join(WorkoutSessionModel, WorkoutSessionModel.id == SetLogModel.session_id)
        .where(
            WorkoutSessionModel.user_id == current_user.id,
            SetLogModel.is_pr.is_(True),
        )
    )
    prs = int(pr_result.scalar_one() or 0)

    # Streak
    sessions_result = await session.execute(
        select(WorkoutSessionModel.started_at).where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
        )
        .order_by(WorkoutSessionModel.started_at.desc())
        .limit(60)
    )
    session_dates = [v for v in sessions_result.scalars().all() if v is not None]
    streak = _calculate_streak(session_dates, today)

    # Badges
    all_badges_result = await session.execute(select(BadgeModel))
    all_badges = all_badges_result.scalars().all()

    user_badges_result = await session.execute(
        select(UserBadgeModel).where(UserBadgeModel.user_id == current_user.id)
    )
    user_badges = {ub.badge_id: ub for ub in user_badges_result.scalars().all()}

    # Auto-check badge unlocks
    badge_values = {
        "workouts_count": total_workouts,
        "streak": streak,
        "pr_count": prs,
    }

    newly_unlocked = []
    for badge in all_badges:
        if badge.id not in user_badges:
            current_val = badge_values.get(badge.condition_type, 0)
            if current_val >= badge.condition_value:
                new_ub = UserBadgeModel(
                    user_id=current_user.id,
                    badge_id=badge.id,
                )
                session.add(new_ub)
                newly_unlocked.append((badge, new_ub))

    if newly_unlocked:
        xp_gain = sum(b.xp_reward for b, _ in newly_unlocked)
        user.total_xp = (user.total_xp or 0) + xp_gain
        total_xp = user.total_xp
        new_level = (total_xp // XP_PER_LEVEL) + 1
        if new_level > level:
            user.level = new_level
            level = new_level
        await session.commit()
        # Refresh user badges
        user_badges_result = await session.execute(
            select(UserBadgeModel).where(UserBadgeModel.user_id == current_user.id)
        )
        user_badges = {ub.badge_id: ub for ub in user_badges_result.scalars().all()}

    badges_response = []
    for badge in all_badges:
        ub = user_badges.get(badge.id)
        badges_response.append(BadgeResponse(
            id=badge.id,
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            condition_type=badge.condition_type,
            condition_value=badge.condition_value,
            xp_reward=badge.xp_reward,
            unlocked=ub is not None,
            unlocked_at=ub.unlocked_at if ub else None,
        ))

    # Challenges
    challenges_result = await session.execute(
        select(ChallengeModel).where(
            ChallengeModel.is_active.is_(True),
            ChallengeModel.end_date >= today,
        )
    )
    challenges = challenges_result.scalars().all()

    user_progress_result = await session.execute(
        select(UserChallengeProgressModel).where(
            UserChallengeProgressModel.user_id == current_user.id,
        )
    )
    user_progress = {up.challenge_id: up for up in user_progress_result.scalars().all()}

    challenges_response = []
    for ch in challenges:
        up = user_progress.get(ch.id)
        days_left = max((ch.end_date - today).days, 0)

        # Auto-calculate progress based on goal_type
        current_val = 0
        if up:
            current_val = up.current_value
        else:
            # Calculate automatically
            if ch.goal_type == "workouts":
                wk_count_result = await session.execute(
                    select(func.count(WorkoutSessionModel.id)).where(
                        WorkoutSessionModel.user_id == current_user.id,
                        WorkoutSessionModel.ended_at.is_not(None),
                        WorkoutSessionModel.started_at >= datetime.combine(ch.start_date, datetime.min.time()),
                    )
                )
                current_val = int(wk_count_result.scalar_one() or 0)
            elif ch.goal_type == "streak":
                current_val = streak

        challenges_response.append(ChallengeResponse(
            id=ch.id,
            name=ch.name,
            description=ch.description,
            goal_type=ch.goal_type,
            goal_value=ch.goal_value,
            current_value=min(current_val, ch.goal_value),
            xp_reward=ch.xp_reward,
            start_date=ch.start_date,
            end_date=ch.end_date,
            days_left=days_left,
            completed=up is not None and up.completed_at is not None,
            joined=up is not None,
        ))

    return OverviewResponse(
        level=level,
        total_xp=total_xp,
        xp_next_level=_xp_for_next_level(level),
        total_workouts=total_workouts,
        streak=streak,
        prs=prs,
        member_since=member_since,
        badges=badges_response,
        challenges=challenges_response,
    )


# ─── Weight tracking ────────────────────────────────────────────────

@router.get("/weight", response_model=list[WeightLogResponse])
async def get_weight_history(
    limit: int = Query(default=20, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Historial de peso corporal."""
    result = await session.execute(
        select(WeightLogModel)
        .where(WeightLogModel.user_id == current_user.id)
        .order_by(WeightLogModel.date.desc())
        .limit(limit)
    )
    logs = result.scalars().all()

    return [
        WeightLogResponse(
            id=log.id,
            weight_kg=float(log.weight_kg),
            date=log.date.isoformat(),
            notes=log.notes,
            logged_at=log.logged_at,
        )
        for log in reversed(logs)  # chronological order
    ]


@router.post("/weight", response_model=WeightLogResponse, status_code=201)
async def log_weight(
    payload: LogWeightRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Registrar peso corporal."""
    log_date = date.fromisoformat(payload.date) if payload.date else date.today()

    log = WeightLogModel(
        user_id=current_user.id,
        weight_kg=Decimal(str(payload.weight_kg)),
        date=log_date,
        notes=payload.notes,
    )
    session.add(log)
    await session.commit()
    await session.refresh(log)

    return WeightLogResponse(
        id=log.id,
        weight_kg=float(log.weight_kg),
        date=log.date.isoformat(),
        notes=log.notes,
        logged_at=log.logged_at,
    )


@router.delete("/weight/{log_id}", status_code=204)
async def delete_weight_log(
    log_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Eliminar un registro de peso."""
    result = await session.execute(
        select(WeightLogModel).where(
            WeightLogModel.id == log_id,
            WeightLogModel.user_id == current_user.id,
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    await session.delete(log)
    await session.commit()


# ─── Strength gains ─────────────────────────────────────────────────

@router.get("/strength", response_model=list[StrengthGainResponse])
async def get_strength_gains(
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Ganancias de fuerza: peso máximo por ejercicio (primera vez vs mejor actual)."""
    # Toda la comparaciÃ³n se resuelve en SQL para evitar mezclar datetimes aware/naive.
    session_maxes_subquery = (
        select(
            SetLogModel.exercise_id,
            ExerciseModel.name,
            func.max(SetLogModel.weight_kg).label("session_max_kg"),
            func.row_number().over(
                partition_by=SetLogModel.exercise_id,
                order_by=(WorkoutSessionModel.started_at.asc(), WorkoutSessionModel.id.asc()),
            ).label("session_rank"),
        )
        .join(WorkoutSessionModel, WorkoutSessionModel.id == SetLogModel.session_id)
        .join(ExerciseModel, ExerciseModel.id == SetLogModel.exercise_id)
        .where(
            WorkoutSessionModel.user_id == current_user.id,
            WorkoutSessionModel.ended_at.is_not(None),
        )
        .group_by(
            SetLogModel.exercise_id,
            ExerciseModel.name,
            WorkoutSessionModel.id,
            WorkoutSessionModel.started_at,
        )
        .subquery()
    )

    summary_result = await session.execute(
        select(
            session_maxes_subquery.c.exercise_id,
            session_maxes_subquery.c.name,
            func.max(
                case(
                    (session_maxes_subquery.c.session_rank == 1, session_maxes_subquery.c.session_max_kg),
                    else_=None,
                )
            ).label("first_max_kg"),
            func.max(session_maxes_subquery.c.session_max_kg).label("current_max_kg"),
            func.count().label("session_count"),
        )
        .group_by(session_maxes_subquery.c.exercise_id, session_maxes_subquery.c.name)
        .having(func.count() >= 2)
    )
    summaries = summary_result.all()

    gains = []
    for _, exercise_name, first_max_raw, current_max_raw, _ in summaries:
        first_max = float(first_max_raw or 0)
        current_max = float(current_max_raw or 0)

        improvement = current_max - first_max
        if improvement > 0 and first_max > 0:
            gains.append(StrengthGainResponse(
                exercise_name=exercise_name,
                first_max_kg=first_max,
                current_max_kg=current_max,
                improvement_kg=improvement,
                improvement_pct=round((improvement / first_max) * 100, 1),
            ))

    gains.sort(key=lambda g: g.improvement_pct, reverse=True)
    return gains[:10]


# ─── Leaderboard ─────────────────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(default=10, le=50),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Top usuarios por XP."""
    result = await session.execute(
        select(UserModel.id, UserModel.name, UserModel.total_xp)
        .where(UserModel.total_xp > 0)
        .order_by(desc(UserModel.total_xp))
        .limit(limit)
    )
    users = result.all()

    entries = []
    for idx, (user_id, name, xp) in enumerate(users):
        entries.append(LeaderboardEntry(
            rank=idx + 1,
            name=name or "Usuario",
            xp=xp or 0,
            is_current_user=(user_id == current_user.id),
        ))

    # If current user not in top, add them at the end
    current_in_list = any(e.is_current_user for e in entries)
    if not current_in_list:
        user_result = await session.execute(
            select(UserModel.name, UserModel.total_xp).where(UserModel.id == current_user.id)
        )
        user_data = user_result.one_or_none()
        if user_data:
            # Count users with more XP to get rank
            rank_result = await session.execute(
                select(func.count(UserModel.id)).where(
                    UserModel.total_xp > (user_data[1] or 0)
                )
            )
            rank = int(rank_result.scalar_one() or 0) + 1
            entries.append(LeaderboardEntry(
                rank=rank,
                name=user_data[0] or "Tú",
                xp=user_data[1] or 0,
                is_current_user=True,
            ))

    return entries
