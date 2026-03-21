"""
Classes API — Gym group classes management (schedule, enrollment).

Roles:
- user:    View schedule, enroll/unenroll
- coach:   All user actions + view enrollments for their classes
- admin:   All actions + create/edit/delete classes and types
"""
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from src.infrastructure.auth import AuthenticatedUser, get_current_user
from src.infrastructure.database.base import get_session
from src.infrastructure.database.models import (
    ClassEnrollmentModel,
    ClassTypeModel,
    RoleModel,
    ScheduledClassModel,
    UserModel,
    UserRoleModel,
)

router = APIRouter(prefix="/classes", tags=["Clases grupales"])


# ── Schemas ──────────────────────────────────────────────────────────────

class ClassTypeResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    color: str
    icon: str | None = None


class ClassTypeCreateRequest(BaseModel):
    name: str
    description: str | None = None
    color: str = "#FF4500"
    icon: str | None = None


class EnrollmentUserResponse(BaseModel):
    user_id: UUID
    user_name: str | None = None
    enrolled_at: datetime
    status: str


class ScheduledClassResponse(BaseModel):
    id: UUID
    class_type: ClassTypeResponse
    instructor_name: str | None = None
    scheduled_date: str
    start_time: str
    end_time: str
    max_capacity: int
    enrolled_count: int
    location: str
    notes: str | None = None
    is_cancelled: bool
    is_enrolled: bool = False


class ScheduledClassCreateRequest(BaseModel):
    class_type_id: UUID
    instructor_id: UUID | None = None
    scheduled_date: str  # YYYY-MM-DD
    start_time: str      # HH:MM
    end_time: str         # HH:MM
    max_capacity: int = 20
    location: str = "Sala principal"
    notes: str | None = None


class ScheduledClassUpdateRequest(BaseModel):
    class_type_id: UUID | None = None
    instructor_id: UUID | None = None
    scheduled_date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    max_capacity: int | None = None
    location: str | None = None
    notes: str | None = None
    is_cancelled: bool | None = None


class EnrollResponse(BaseModel):
    status: str
    message: str


# ── Helpers ──────────────────────────────────────────────────────────────

async def _user_has_role(db: AsyncSession, user_id: UUID, role_name: str) -> bool:
    result = await db.execute(
        select(UserRoleModel)
        .join(RoleModel, RoleModel.id == UserRoleModel.role_id)
        .where(UserRoleModel.user_id == user_id, RoleModel.name == role_name)
    )
    return result.first() is not None


async def _require_role(db: AsyncSession, user_id: UUID, *roles: str) -> None:
    for role in roles:
        if await _user_has_role(db, user_id, role):
            return
    raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")


def _class_to_response(
    sc: ScheduledClassModel,
    enrolled_count: int,
    is_enrolled: bool = False,
) -> ScheduledClassResponse:
    ct = sc.class_type
    instructor_name = None
    if sc.instructor:
        instructor_name = sc.instructor.name

    return ScheduledClassResponse(
        id=sc.id,
        class_type=ClassTypeResponse(
            id=ct.id,
            name=ct.name,
            description=ct.description,
            color=ct.color,
            icon=ct.icon,
        ),
        instructor_name=instructor_name,
        scheduled_date=str(sc.scheduled_date),
        start_time=sc.start_time,
        end_time=sc.end_time,
        max_capacity=sc.max_capacity,
        enrolled_count=enrolled_count,
        location=sc.location,
        notes=sc.notes,
        is_cancelled=sc.is_cancelled,
        is_enrolled=is_enrolled,
    )


# ── Class Types ──────────────────────────────────────────────────────────

@router.get("/types", response_model=List[ClassTypeResponse])
async def list_class_types(
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Lista todos los tipos de clase disponibles."""
    result = await db.execute(select(ClassTypeModel).order_by(ClassTypeModel.name))
    types = result.scalars().all()
    return [
        ClassTypeResponse(id=t.id, name=t.name, description=t.description, color=t.color, icon=t.icon)
        for t in types
    ]


@router.post("/types", status_code=201, response_model=ClassTypeResponse)
async def create_class_type(
    req: ClassTypeCreateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Crea un nuevo tipo de clase (solo admin)."""
    await _require_role(db, current_user.id, "admin")

    new_type = ClassTypeModel(
        id=uuid4(),
        name=req.name,
        description=req.description,
        color=req.color,
        icon=req.icon,
    )
    db.add(new_type)
    await db.commit()

    return ClassTypeResponse(
        id=new_type.id,
        name=new_type.name,
        description=new_type.description,
        color=new_type.color,
        icon=new_type.icon,
    )


# ── Schedule ─────────────────────────────────────────────────────────────

@router.get("/schedule", response_model=List[ScheduledClassResponse])
async def list_schedule(
    from_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Ver la programación de clases. Sin filtros muestra la semana actual."""
    today = date.today()

    if from_date:
        start = date.fromisoformat(from_date)
    else:
        start = today - timedelta(days=today.weekday())  # Monday

    if to_date:
        end = date.fromisoformat(to_date)
    else:
        end = start + timedelta(days=6)  # Sunday

    query = (
        select(ScheduledClassModel)
        .where(
            ScheduledClassModel.scheduled_date >= start,
            ScheduledClassModel.scheduled_date <= end,
        )
        .options(
            selectinload(ScheduledClassModel.class_type),
            selectinload(ScheduledClassModel.instructor),
            selectinload(ScheduledClassModel.enrollments),
        )
        .order_by(ScheduledClassModel.scheduled_date, ScheduledClassModel.start_time)
    )

    result = await db.execute(query)
    classes = result.scalars().all()

    response = []
    for sc in classes:
        active_enrollments = [e for e in sc.enrollments if e.status == "enrolled"]
        is_enrolled = any(e.user_id == current_user.id for e in active_enrollments)
        response.append(_class_to_response(sc, len(active_enrollments), is_enrolled))

    return response


@router.post("/schedule", status_code=201, response_model=ScheduledClassResponse)
async def create_scheduled_class(
    req: ScheduledClassCreateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Crear una clase programada (admin o entrenador)."""
    await _require_role(db, current_user.id, "admin", "coach")

    new_class = ScheduledClassModel(
        id=uuid4(),
        class_type_id=req.class_type_id,
        instructor_id=req.instructor_id,
        scheduled_date=date.fromisoformat(req.scheduled_date),
        start_time=req.start_time,
        end_time=req.end_time,
        max_capacity=req.max_capacity,
        location=req.location,
        notes=req.notes,
        created_by=current_user.id,
    )
    db.add(new_class)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(ScheduledClassModel)
        .where(ScheduledClassModel.id == new_class.id)
        .options(
            selectinload(ScheduledClassModel.class_type),
            selectinload(ScheduledClassModel.instructor),
            selectinload(ScheduledClassModel.enrollments),
        )
    )
    created = result.scalars().first()
    return _class_to_response(created, 0)


@router.put("/schedule/{class_id}", response_model=ScheduledClassResponse)
async def update_scheduled_class(
    class_id: UUID,
    req: ScheduledClassUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Editar una clase programada (admin o entrenador)."""
    await _require_role(db, current_user.id, "admin", "coach")

    result = await db.execute(
        select(ScheduledClassModel)
        .where(ScheduledClassModel.id == class_id)
        .options(
            selectinload(ScheduledClassModel.class_type),
            selectinload(ScheduledClassModel.instructor),
            selectinload(ScheduledClassModel.enrollments),
        )
    )
    sc = result.scalars().first()
    if not sc:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    if req.class_type_id is not None:
        sc.class_type_id = req.class_type_id
    if req.instructor_id is not None:
        sc.instructor_id = req.instructor_id
    if req.scheduled_date is not None:
        sc.scheduled_date = date.fromisoformat(req.scheduled_date)
    if req.start_time is not None:
        sc.start_time = req.start_time
    if req.end_time is not None:
        sc.end_time = req.end_time
    if req.max_capacity is not None:
        sc.max_capacity = req.max_capacity
    if req.location is not None:
        sc.location = req.location
    if req.notes is not None:
        sc.notes = req.notes
    if req.is_cancelled is not None:
        sc.is_cancelled = req.is_cancelled

    await db.commit()
    await db.refresh(sc)

    # Reload relationships
    result = await db.execute(
        select(ScheduledClassModel)
        .where(ScheduledClassModel.id == class_id)
        .options(
            selectinload(ScheduledClassModel.class_type),
            selectinload(ScheduledClassModel.instructor),
            selectinload(ScheduledClassModel.enrollments),
        )
    )
    updated = result.scalars().first()
    active = [e for e in updated.enrollments if e.status == "enrolled"]
    return _class_to_response(updated, len(active))


@router.delete("/schedule/{class_id}", status_code=204)
async def delete_scheduled_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Eliminar una clase programada (solo admin)."""
    await _require_role(db, current_user.id, "admin")

    result = await db.execute(
        select(ScheduledClassModel).where(ScheduledClassModel.id == class_id)
    )
    sc = result.scalars().first()
    if not sc:
        raise HTTPException(status_code=404, detail="Clase no encontrada")

    await db.delete(sc)
    await db.commit()
    return None


# ── Enrollments ──────────────────────────────────────────────────────────

@router.post("/{class_id}/enroll", response_model=EnrollResponse)
async def enroll_in_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Inscribirse en una clase."""
    result = await db.execute(
        select(ScheduledClassModel)
        .where(ScheduledClassModel.id == class_id)
        .options(selectinload(ScheduledClassModel.enrollments))
    )
    sc = result.scalars().first()
    if not sc:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    if sc.is_cancelled:
        raise HTTPException(status_code=400, detail="Esta clase fue cancelada")

    # Check if already enrolled
    existing = next(
        (e for e in sc.enrollments if e.user_id == current_user.id and e.status == "enrolled"),
        None,
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya estás inscrito en esta clase")

    # Check capacity
    active_count = sum(1 for e in sc.enrollments if e.status == "enrolled")
    if active_count >= sc.max_capacity:
        raise HTTPException(status_code=400, detail="La clase está llena")

    enrollment = ClassEnrollmentModel(
        id=uuid4(),
        scheduled_class_id=class_id,
        user_id=current_user.id,
    )
    db.add(enrollment)
    await db.commit()

    return EnrollResponse(status="enrolled", message="Te inscribiste exitosamente")


@router.delete("/{class_id}/enroll", response_model=EnrollResponse)
async def unenroll_from_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Desinscribirse de una clase."""
    result = await db.execute(
        select(ClassEnrollmentModel).where(
            ClassEnrollmentModel.scheduled_class_id == class_id,
            ClassEnrollmentModel.user_id == current_user.id,
            ClassEnrollmentModel.status == "enrolled",
        )
    )
    enrollment = result.scalars().first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="No estás inscrito en esta clase")

    enrollment.status = "cancelled"
    await db.commit()

    return EnrollResponse(status="cancelled", message="Te desinscribiste de la clase")


@router.get("/{class_id}/enrollments", response_model=List[EnrollmentUserResponse])
async def list_enrollments(
    class_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Ver lista de inscritos (entrenador o admin)."""
    await _require_role(db, current_user.id, "admin", "coach")

    result = await db.execute(
        select(ClassEnrollmentModel)
        .where(
            ClassEnrollmentModel.scheduled_class_id == class_id,
            ClassEnrollmentModel.status == "enrolled",
        )
        .options(selectinload(ClassEnrollmentModel.user))
    )
    enrollments = result.scalars().all()

    return [
        EnrollmentUserResponse(
            user_id=e.user_id,
            user_name=e.user.name if e.user else None,
            enrolled_at=e.enrolled_at,
            status=e.status,
        )
        for e in enrollments
    ]
