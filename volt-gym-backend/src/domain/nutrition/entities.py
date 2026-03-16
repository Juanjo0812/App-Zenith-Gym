from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID, uuid4

class MealPlanEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    date: date
    target_calories: int
    target_protein: int
    target_carbs: int
    target_fats: int

class MealLog(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    food_name: str
    calories: int
    protein: int
    carbs: int
    fats: int
    logged_at: datetime = Field(default_factory=datetime.utcnow)
