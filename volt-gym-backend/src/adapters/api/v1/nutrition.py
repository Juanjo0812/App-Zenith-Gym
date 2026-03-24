from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.auth import get_current_user, AuthenticatedUser
from src.infrastructure.database.base import get_session
from src.infrastructure.database.models import (
    MealLogModel,
    MealPlanModel,
    WaterLogModel,
)

router = APIRouter(prefix="/nutrition", tags=["Nutrición"])


# ─── Request / Response schemas ──────────────────────────────────────

class NutritionTargetsRequest(BaseModel):
    target_calories: int = Field(ge=0, le=10000)
    target_protein: int = Field(ge=0, le=1000)
    target_carbs: int = Field(ge=0, le=2000)
    target_fats: int = Field(ge=0, le=1000)
    water_ml: int = Field(default=2500, ge=0, le=10000)


class NutritionTargetsResponse(BaseModel):
    id: UUID | None = None
    target_calories: int
    target_protein: int
    target_carbs: int
    target_fats: int
    water_ml: int
    date: date


class LogMealRequest(BaseModel):
    food_name: str = Field(min_length=1, max_length=255)
    calories: int = Field(ge=0)
    protein: int = Field(ge=0, default=0)
    carbs: int = Field(ge=0, default=0)
    fats: int = Field(ge=0, default=0)
    meal_type: str = Field(default="otro")  # desayuno, almuerzo, cena, snack, otro
    serving_size: str | None = None
    notes: str | None = None


class MealLogResponse(BaseModel):
    id: UUID
    food_name: str
    calories: int
    protein: int
    carbs: int
    fats: int
    meal_type: str
    serving_size: str | None
    notes: str | None
    logged_at: datetime


class DailySummaryResponse(BaseModel):
    date: str
    targets: NutritionTargetsResponse | None
    consumed: dict  # calories, protein, carbs, fats
    meals: list[MealLogResponse]
    water_ml: int
    water_goal_ml: int


class LogWaterRequest(BaseModel):
    amount_ml: int = Field(ge=1, le=5000)


class WaterLogResponse(BaseModel):
    id: UUID
    amount_ml: int
    logged_at: datetime


# ─── Targets (meal plan for the day) ────────────────────────────────

@router.get("/targets", response_model=NutritionTargetsResponse)
async def get_daily_targets(
    target_date: date = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Obtener las metas de macros del día."""
    d = target_date or date.today()

    result = await session.execute(
        select(MealPlanModel).where(
            MealPlanModel.user_id == current_user.id,
            MealPlanModel.date == d,
        )
    )
    plan = result.scalar_one_or_none()

    if plan:
        return NutritionTargetsResponse(
            id=plan.id,
            target_calories=plan.target_calories or 0,
            target_protein=plan.target_protein or 0,
            target_carbs=plan.target_carbs or 0,
            target_fats=plan.target_fats or 0,
            water_ml=plan.water_ml or 2500,
            date=plan.date,
        )

    # Return defaults if no plan exists
    return NutritionTargetsResponse(
        target_calories=2500,
        target_protein=150,
        target_carbs=300,
        target_fats=80,
        water_ml=2500,
        date=d,
    )


@router.put("/targets", response_model=NutritionTargetsResponse)
async def set_daily_targets(
    payload: NutritionTargetsRequest,
    target_date: date = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Establecer o actualizar las metas de macros del día."""
    d = target_date or date.today()

    result = await session.execute(
        select(MealPlanModel).where(
            MealPlanModel.user_id == current_user.id,
            MealPlanModel.date == d,
        )
    )
    plan = result.scalar_one_or_none()

    if plan:
        plan.target_calories = payload.target_calories
        plan.target_protein = payload.target_protein
        plan.target_carbs = payload.target_carbs
        plan.target_fats = payload.target_fats
        plan.water_ml = payload.water_ml
    else:
        plan = MealPlanModel(
            user_id=current_user.id,
            target_calories=payload.target_calories,
            target_protein=payload.target_protein,
            target_carbs=payload.target_carbs,
            target_fats=payload.target_fats,
            water_ml=payload.water_ml,
            date=d,
        )
        session.add(plan)

    await session.commit()
    await session.refresh(plan)

    return NutritionTargetsResponse(
        id=plan.id,
        target_calories=plan.target_calories,
        target_protein=plan.target_protein,
        target_carbs=plan.target_carbs,
        target_fats=plan.target_fats,
        water_ml=plan.water_ml or 2500,
        date=plan.date,
    )


# ─── Meal Logging ───────────────────────────────────────────────────

@router.post("/meals", response_model=MealLogResponse, status_code=201)
async def log_meal(
    payload: LogMealRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Registrar una comida."""
    meal = MealLogModel(
        user_id=current_user.id,
        food_name=payload.food_name,
        calories=payload.calories,
        protein=payload.protein,
        carbs=payload.carbs,
        fats=payload.fats,
        meal_type=payload.meal_type,
        serving_size=payload.serving_size,
        notes=payload.notes,
    )
    session.add(meal)
    await session.commit()
    await session.refresh(meal)

    return MealLogResponse(
        id=meal.id,
        food_name=meal.food_name,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fats=meal.fats,
        meal_type=meal.meal_type or "otro",
        serving_size=meal.serving_size,
        notes=meal.notes,
        logged_at=meal.logged_at,
    )


@router.get("/meals", response_model=list[MealLogResponse])
async def get_meals(
    target_date: date = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Obtener todas las comidas de un día."""
    d = target_date or date.today()
    start = datetime.combine(d, datetime.min.time())
    end = datetime.combine(d, datetime.max.time())

    result = await session.execute(
        select(MealLogModel)
        .where(
            MealLogModel.user_id == current_user.id,
            MealLogModel.logged_at >= start,
            MealLogModel.logged_at <= end,
        )
        .order_by(MealLogModel.logged_at.asc())
    )
    meals = result.scalars().all()

    return [
        MealLogResponse(
            id=m.id,
            food_name=m.food_name,
            calories=m.calories or 0,
            protein=m.protein or 0,
            carbs=m.carbs or 0,
            fats=m.fats or 0,
            meal_type=m.meal_type or "otro",
            serving_size=m.serving_size,
            notes=m.notes,
            logged_at=m.logged_at,
        )
        for m in meals
    ]


@router.delete("/meals/{meal_id}", status_code=204)
async def delete_meal(
    meal_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Eliminar una comida registrada."""
    result = await session.execute(
        select(MealLogModel).where(
            MealLogModel.id == meal_id,
            MealLogModel.user_id == current_user.id,
        )
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Comida no encontrada")

    await session.delete(meal)
    await session.commit()


# ─── Water Tracking ─────────────────────────────────────────────────

@router.post("/water", response_model=WaterLogResponse, status_code=201)
async def log_water(
    payload: LogWaterRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Registrar consumo de agua."""
    log = WaterLogModel(
        user_id=current_user.id,
        amount_ml=payload.amount_ml,
    )
    session.add(log)
    await session.commit()
    await session.refresh(log)

    return WaterLogResponse(id=log.id, amount_ml=log.amount_ml, logged_at=log.logged_at)


@router.get("/water", response_model=list[WaterLogResponse])
async def get_water_logs(
    target_date: date = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Obtener registros de agua del día."""
    d = target_date or date.today()
    start = datetime.combine(d, datetime.min.time())
    end = datetime.combine(d, datetime.max.time())

    result = await session.execute(
        select(WaterLogModel)
        .where(
            WaterLogModel.user_id == current_user.id,
            WaterLogModel.logged_at >= start,
            WaterLogModel.logged_at <= end,
        )
        .order_by(WaterLogModel.logged_at.asc())
    )
    logs = result.scalars().all()
    return [
        WaterLogResponse(id=l.id, amount_ml=l.amount_ml, logged_at=l.logged_at)
        for l in logs
    ]


# ─── Daily Summary (aggregated view) ────────────────────────────────

@router.get("/summary", response_model=DailySummaryResponse)
async def get_daily_summary(
    target_date: date = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Resumen completo del día: metas, consumido, comidas y agua."""
    d = target_date or date.today()
    start = datetime.combine(d, datetime.min.time())
    end = datetime.combine(d, datetime.max.time())

    # Targets
    plan_result = await session.execute(
        select(MealPlanModel).where(
            MealPlanModel.user_id == current_user.id,
            MealPlanModel.date == d,
        )
    )
    plan = plan_result.scalar_one_or_none()

    targets = None
    water_goal = 2500  # default ml
    if plan:
        targets = NutritionTargetsResponse(
            id=plan.id,
            target_calories=plan.target_calories or 0,
            target_protein=plan.target_protein or 0,
            target_carbs=plan.target_carbs or 0,
            target_fats=plan.target_fats or 0,
            water_ml=plan.water_ml or 2500,
            date=plan.date,
        )
        water_goal = plan.water_ml or 2500

    # Meals
    meals_result = await session.execute(
        select(MealLogModel)
        .where(
            MealLogModel.user_id == current_user.id,
            MealLogModel.logged_at >= start,
            MealLogModel.logged_at <= end,
        )
        .order_by(MealLogModel.logged_at.asc())
    )
    meals = meals_result.scalars().all()

    consumed = {
        "calories": sum(m.calories or 0 for m in meals),
        "protein": sum(m.protein or 0 for m in meals),
        "carbs": sum(m.carbs or 0 for m in meals),
        "fats": sum(m.fats or 0 for m in meals),
    }

    # Water
    water_result = await session.execute(
        select(func.coalesce(func.sum(WaterLogModel.amount_ml), 0)).where(
            WaterLogModel.user_id == current_user.id,
            WaterLogModel.logged_at >= start,
            WaterLogModel.logged_at <= end,
        )
    )
    water_total = int(water_result.scalar_one() or 0)

    meals_response = [
        MealLogResponse(
            id=m.id,
            food_name=m.food_name,
            calories=m.calories or 0,
            protein=m.protein or 0,
            carbs=m.carbs or 0,
            fats=m.fats or 0,
            meal_type=m.meal_type or "otro",
            serving_size=m.serving_size,
            notes=m.notes,
            logged_at=m.logged_at,
        )
        for m in meals
    ]

    return DailySummaryResponse(
        date=d.isoformat(),
        targets=targets,
        consumed=consumed,
        meals=meals_response,
        water_ml=water_total,
        water_goal_ml=water_goal,
    )


# ─── Weekly Summary ─────────────────────────────────────────────────

class WeekDaySummary(BaseModel):
    date: str
    calories_consumed: int
    calories_target: int
    protein: int
    carbs: int
    fats: int
    meal_count: int


@router.get("/weekly", response_model=list[WeekDaySummary])
async def get_weekly_summary(
    session: AsyncSession = Depends(get_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Resumen de los últimos 7 días para gráficas de tendencia."""
    today = date.today()
    days: list[WeekDaySummary] = []

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        start = datetime.combine(d, datetime.min.time())
        end = datetime.combine(d, datetime.max.time())

        meals_result = await session.execute(
            select(
                func.coalesce(func.sum(MealLogModel.calories), 0),
                func.coalesce(func.sum(MealLogModel.protein), 0),
                func.coalesce(func.sum(MealLogModel.carbs), 0),
                func.coalesce(func.sum(MealLogModel.fats), 0),
                func.count(MealLogModel.id),
            ).where(
                MealLogModel.user_id == current_user.id,
                MealLogModel.logged_at >= start,
                MealLogModel.logged_at <= end,
            )
        )
        row = meals_result.one()
        cal, prot, carb, fat, count = int(row[0]), int(row[1]), int(row[2]), int(row[3]), int(row[4])

        plan_result = await session.execute(
            select(MealPlanModel.target_calories).where(
                MealPlanModel.user_id == current_user.id,
                MealPlanModel.date == d,
            )
        )
        target = int(plan_result.scalar_one_or_none() or 0)

        days.append(WeekDaySummary(
            date=d.isoformat(),
            calories_consumed=cal,
            calories_target=target,
            protein=prot,
            carbs=carb,
            fats=fat,
            meal_count=count,
        ))

    return days
