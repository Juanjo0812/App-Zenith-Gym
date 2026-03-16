from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional

# In a real app, these would be injected via Dependencies
# from config.dependencies import get_log_session_use_case
# from use_cases.log_session_apply_xp import LogSessionUseCase

router = APIRouter(prefix="/workouts", tags=["Workouts"])

class LogSetRequest(BaseModel):
    exercise_id: UUID
    reps: int
    weight_kg: float
    rest_seconds: int = 0

class CompleteSessionResponse(BaseModel):
    session_id: UUID
    xp_earned: int
    new_total_xp: int
    new_level: int
    leveled_up: bool

@router.post("/sessions", status_code=201)
async def start_session(routine_id: Optional[UUID] = None):
    """Starts a new workout session."""
    # Dummy implementation for MVP scaffolding
    return {"session_id": "dummy-uuid", "status": "started"}

@router.post("/sessions/{session_id}/sets", status_code=201)
async def log_set(session_id: UUID, req: LogSetRequest):
    """Logs a single set in real-time."""
    return {"status": "set_logged", "set_data": req.model_dump()}

class SessionUpdateRequest(BaseModel):
    status: str

@router.patch("/sessions/{session_id}", response_model=CompleteSessionResponse)
async def update_session(session_id: UUID, req: SessionUpdateRequest):
    """
    Updates the session status. Trigger Gamification XP if marked completed.
    """
    if req.status != "completed":
        raise HTTPException(status_code=400, detail="Only 'completed' status is currently supported")
        
    # use_case = get_log_session_use_case()
    # return await use_case.execute(session_id=session_id, user_id=current_user.id)
    
    # Dummy return for scaffolding
    return CompleteSessionResponse(
        session_id=session_id,
        xp_earned=120,
        new_total_xp=450,
        new_level=4,
        leveled_up=False
    )
