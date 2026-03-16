"""
Workout API routes — wired to real database via repositories.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from src.infrastructure.database.base import get_session
from src.infrastructure.database.models import WorkoutSessionModel, SetLogModel
from src.config.dependencies import get_log_session_use_case

router = APIRouter(prefix="/workouts", tags=["Workouts"])


# ── Request / Response schemas ──────────────────────────────────────

class StartSessionRequest(BaseModel):
    routine_id: Optional[UUID] = None


class StartSessionResponse(BaseModel):
    session_id: UUID
    status: str


class LogSetRequest(BaseModel):
    exercise_id: UUID
    reps: int
    weight_kg: float
    rest_seconds: int = 0


class LogSetResponse(BaseModel):
    set_id: UUID
    status: str


class SessionUpdateRequest(BaseModel):
    status: str


class CompleteSessionResponse(BaseModel):
    session_id: UUID
    xp_earned: int
    new_total_xp: int
    new_level: int
    leveled_up: bool


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/sessions", status_code=201, response_model=StartSessionResponse)
async def start_session(
    req: StartSessionRequest = StartSessionRequest(),
    db: AsyncSession = Depends(get_session),
):
    """Creates a new workout session in the database."""
    new_session = WorkoutSessionModel(
        id=uuid4(),
        # TODO: replace with real authenticated user_id
        user_id=UUID("00000000-0000-0000-0000-000000000001"),
        routine_id=req.routine_id,
        started_at=datetime.utcnow(),
    )
    db.add(new_session)
    await db.commit()

    return StartSessionResponse(session_id=new_session.id, status="started")


@router.post("/sessions/{session_id}/sets", status_code=201, response_model=LogSetResponse)
async def log_set(
    session_id: UUID,
    req: LogSetRequest,
    db: AsyncSession = Depends(get_session),
):
    """Logs a single set to the database, linked to the given session."""
    # Verify session exists
    result = await db.execute(
        select(WorkoutSessionModel).where(WorkoutSessionModel.id == session_id)
    )
    session_row = result.scalars().first()
    if not session_row:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_row.ended_at is not None:
        raise HTTPException(status_code=400, detail="Session is already completed")

    new_set = SetLogModel(
        id=uuid4(),
        session_id=session_id,
        exercise_id=req.exercise_id,
        reps=req.reps,
        weight_kg=req.weight_kg,
        rest_seconds=req.rest_seconds,
        is_pr=False,
    )
    db.add(new_set)
    await db.commit()

    return LogSetResponse(set_id=new_set.id, status="set_logged")


@router.patch("/sessions/{session_id}", response_model=CompleteSessionResponse)
async def update_session(
    session_id: UUID,
    req: SessionUpdateRequest,
    use_case=Depends(get_log_session_use_case),
):
    """
    Marks a session as completed and triggers gamification XP calculation.
    """
    if req.status != "completed":
        raise HTTPException(status_code=400, detail="Only 'completed' status is currently supported")

    try:
        # TODO: replace with real authenticated user_id
        result = await use_case.execute(
            session_id=session_id,
            user_id=UUID("00000000-0000-0000-0000-000000000001"),
        )
        return CompleteSessionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
