from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4

class ExerciseEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    primary_muscle: str
    secondary_muscles: List[str] = Field(default_factory=list)
    equipment: Optional[str] = None
    difficulty: Optional[str] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = None

class SetLog(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    exercise_id: UUID
    reps: int
    weight_kg: float
    rest_seconds: Optional[int] = None
    is_pr: bool = False

class WorkoutSessionEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    routine_id: Optional[UUID] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    sets: List[SetLog] = Field(default_factory=list)

    def log_set(self, exercise_id: UUID, reps: int, weight_kg: float, rest_seconds: int = None) -> SetLog:
        """Business logic for adding a set to the session."""
        new_set = SetLog(
            exercise_id=exercise_id,
            reps=reps,
            weight_kg=weight_kg,
            rest_seconds=rest_seconds
        )
        self.sets.append(new_set)
        return new_set

    def complete_session(self):
        """Mark session as complete."""
        self.ended_at = datetime.utcnow()

    @property
    def total_volume(self) -> float:
        return sum(s.reps * s.weight_kg for s in self.sets)
