"""
Workout API routes wired to the database and protected with Supabase JWTs.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from src.config.dependencies import get_log_session_use_case
from src.infrastructure.auth import AuthenticatedUser, get_current_user
from src.infrastructure.database.base import get_session
from src.infrastructure.database.models import (
    ExerciseModel,
    RoutineExerciseModel,
    SetLogModel,
    WorkoutRoutineModel,
    WorkoutSessionModel,
)

router = APIRouter(prefix="/workouts", tags=["Workouts"])


class RoutineExerciseBase(BaseModel):
    exercise_id: UUID
    order_index: int
    target_sets: int = 3
    target_reps: int = 10
    target_weight_kg: float = 0.0


class RoutineExerciseResponse(RoutineExerciseBase):
    id: UUID
    routine_id: UUID
    exercise_name: str | None = None
    exercise_muscle: str | None = None


class RoutineCreateRequest(BaseModel):
    name: str
    exercises: List[RoutineExerciseBase]


class RoutineResponse(BaseModel):
    id: UUID
    name: str
    is_ai_generated: bool
    exercises: List[RoutineExerciseResponse]


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


async def _load_user_routine(
    db: AsyncSession,
    *,
    routine_id: UUID,
    user_id: UUID,
) -> WorkoutRoutineModel | None:
    result = await db.execute(
        select(WorkoutRoutineModel)
        .where(
            WorkoutRoutineModel.id == routine_id,
            WorkoutRoutineModel.user_id == user_id,
        )
        .options(
            selectinload(WorkoutRoutineModel.routine_exercises).selectinload(
                RoutineExerciseModel.exercise
            )
        )
    )
    return result.scalars().first()


def _routine_to_response(routine: WorkoutRoutineModel) -> RoutineResponse:
    return RoutineResponse(
        id=routine.id,
        name=routine.name,
        is_ai_generated=routine.is_ai_generated,
        exercises=[
            RoutineExerciseResponse(
                id=exercise.id,
                routine_id=exercise.routine_id,
                exercise_id=exercise.exercise_id,
                order_index=exercise.order_index,
                target_sets=exercise.target_sets,
                target_reps=exercise.target_reps,
                target_weight_kg=float(exercise.target_weight_kg),
                exercise_name=exercise.exercise.name if exercise.exercise else None,
                exercise_muscle=exercise.exercise.primary_muscle if exercise.exercise else None,
            )
            for exercise in sorted(routine.routine_exercises, key=lambda item: item.order_index)
        ],
    )


@router.get("/routines", response_model=List[RoutineResponse])
async def get_routines(
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    query = (
        select(WorkoutRoutineModel)
        .where(WorkoutRoutineModel.user_id == current_user.id)
        .order_by(WorkoutRoutineModel.created_at.desc())
        .options(
            selectinload(WorkoutRoutineModel.routine_exercises).selectinload(
                RoutineExerciseModel.exercise
            )
        )
    )
    result = await db.execute(query)
    routines = result.scalars().all()
    return [_routine_to_response(routine) for routine in routines]


@router.post("/routines", status_code=201, response_model=RoutineResponse)
async def create_routine(
    req: RoutineCreateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    routine_id = uuid4()
    new_routine = WorkoutRoutineModel(
        id=routine_id,
        user_id=current_user.id,
        name=req.name,
        is_ai_generated=False,
        created_at=datetime.utcnow(),
    )

    db.add(new_routine)

    for exercise in req.exercises:
        routine_exercise = RoutineExerciseModel(
            id=uuid4(),
            routine_id=routine_id,
            exercise_id=exercise.exercise_id,
            order_index=exercise.order_index,
            target_sets=exercise.target_sets,
            target_reps=exercise.target_reps,
            target_weight_kg=exercise.target_weight_kg,
        )
        db.add(routine_exercise)

    await db.commit()

    created_routine = await _load_user_routine(
        db,
        routine_id=routine_id,
        user_id=current_user.id,
    )
    if not created_routine:
        raise HTTPException(status_code=500, detail="No se pudo cargar la rutina creada")

    return _routine_to_response(created_routine)


@router.put("/routines/{routine_id}", response_model=RoutineResponse)
async def update_routine(
    routine_id: UUID,
    req: RoutineCreateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    routine = await _load_user_routine(
        db,
        routine_id=routine_id,
        user_id=current_user.id,
    )

    if not routine:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    routine.name = req.name

    for old_exercise in routine.routine_exercises:
        await db.delete(old_exercise)

    routine.routine_exercises = []
    for exercise in req.exercises:
        routine_exercise = RoutineExerciseModel(
            id=uuid4(),
            routine_id=routine_id,
            exercise_id=exercise.exercise_id,
            order_index=exercise.order_index,
            target_sets=exercise.target_sets,
            target_reps=exercise.target_reps,
            target_weight_kg=exercise.target_weight_kg,
        )
        db.add(routine_exercise)
        routine.routine_exercises.append(routine_exercise)

    await db.commit()

    updated_routine = await _load_user_routine(
        db,
        routine_id=routine_id,
        user_id=current_user.id,
    )
    if not updated_routine:
        raise HTTPException(status_code=500, detail="No se pudo cargar la rutina actualizada")

    return _routine_to_response(updated_routine)


@router.delete("/routines/{routine_id}", status_code=204)
async def delete_routine(
    routine_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    result = await db.execute(
        select(WorkoutRoutineModel).where(
            WorkoutRoutineModel.id == routine_id,
            WorkoutRoutineModel.user_id == current_user.id,
        )
    )
    routine = result.scalars().first()

    if not routine:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    await db.delete(routine)
    await db.commit()
    return None


@router.post("/sessions", status_code=201, response_model=StartSessionResponse)
async def start_session(
    req: Optional[StartSessionRequest] = None,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    payload = req or StartSessionRequest()
    new_session = WorkoutSessionModel(
        id=uuid4(),
        user_id=current_user.id,
        routine_id=payload.routine_id,
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
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    result = await db.execute(
        select(WorkoutSessionModel).where(WorkoutSessionModel.id == session_id)
    )
    session_row = result.scalars().first()
    if not session_row:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    if session_row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes modificar esta sesión")
    if session_row.ended_at is not None:
        raise HTTPException(status_code=400, detail="La sesión ya fue completada")

    exercise_result = await db.execute(
        select(ExerciseModel.id).where(ExerciseModel.id == req.exercise_id)
    )
    if not exercise_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

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
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if req.status != "completed":
        raise HTTPException(status_code=400, detail="Solo se admite el estado 'completed'")

    try:
        result = await use_case.execute(
            session_id=session_id,
            user_id=current_user.id,
        )
        return CompleteSessionResponse(**result)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
