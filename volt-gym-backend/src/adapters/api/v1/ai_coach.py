from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/ai", tags=["Entrenador con IA"])

class GenerateWorkoutRequest(BaseModel):
    goals: str
    equipment: str
    level: str

@router.post("/workout-plans")
async def create_workout_plan(req: GenerateWorkoutRequest) -> Dict[str, Any]:
    """
    Triggers the generation of an AI tailored workout block via Use Case.
    """
    # use_case = get_generate_workout_use_case()
    # return await use_case.execute(user_id=current_user.id, **req.dict())
    
    return {
        "status": "success",
        "routine": {
            "name": f"Rutina con IA {req.level.capitalize()} {req.goals.capitalize()}",
            "exercises": [
                {"name": "Press de banca", "sets": 4, "reps": 8},
                {"name": "Sentadilla con barra", "sets": 3, "reps": 10}
            ]
        }
    }

class ChatMessage(BaseModel):
    message: str

@router.post("/chat-messages")
async def create_chat_message(chat: ChatMessage):
    """
    Conversational endpoint for the fitness coach (e.g. streaming LLM).
    """
    return {
        "reply": f"Como tu entrenador, te recomiendo enfocarte en la técnica para '{chat.message}'."
    }
