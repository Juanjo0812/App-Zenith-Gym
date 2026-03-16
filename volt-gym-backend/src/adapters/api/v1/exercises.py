"""
GET /api/v1/exercises — Exercise Library endpoint.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

from src.config.dependencies import get_exercise_repo

router = APIRouter(prefix="/exercises", tags=["Exercises"])


class ExerciseResponse(BaseModel):
    id: UUID
    name: str
    primary_muscle: str
    secondary_muscles: List[str]
    equipment: Optional[str] = None
    difficulty: Optional[str] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = None


@router.get("", response_model=List[ExerciseResponse])
async def list_exercises(
    muscle: Optional[str] = Query(None, description="Filter by primary muscle group"),
    equipment: Optional[str] = Query(None, description="Filter by equipment type"),
    repo=Depends(get_exercise_repo),
):
    """Returns the exercise library, optionally filtered by muscle or equipment."""
    exercises = await repo.list_all(muscle=muscle, equipment=equipment)
    return [ExerciseResponse(**e.model_dump()) for e in exercises]
