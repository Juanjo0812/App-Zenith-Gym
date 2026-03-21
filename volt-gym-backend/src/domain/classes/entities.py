from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time, datetime
from uuid import UUID, uuid4


class ClassTypeEntity(BaseModel):
    """Tipo de clase grupal (funcional, step, cardio box, etc.)."""
    id: UUID = Field(default_factory=uuid4)
    name: str
    description: Optional[str] = None
    color: str = "#FF4500"
    icon: Optional[str] = None


class ScheduledClassEntity(BaseModel):
    """Una clase concreta programada en el calendario."""
    id: UUID = Field(default_factory=uuid4)
    class_type_id: UUID
    instructor_id: Optional[UUID] = None
    scheduled_date: date
    start_time: time
    end_time: time
    max_capacity: int = 20
    location: str = "Sala principal"
    notes: Optional[str] = None
    is_cancelled: bool = False
    created_by: Optional[UUID] = None

    @property
    def is_in_past(self) -> bool:
        now = datetime.utcnow()
        class_dt = datetime.combine(self.scheduled_date, self.end_time)
        return class_dt < now


class ClassEnrollmentEntity(BaseModel):
    """Inscripción de un usuario a una clase programada."""
    id: UUID = Field(default_factory=uuid4)
    scheduled_class_id: UUID
    user_id: UUID
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "enrolled"  # 'enrolled', 'cancelled', 'attended'
