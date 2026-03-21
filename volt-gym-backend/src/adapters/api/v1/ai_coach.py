"""
AI Coach API - Conversational fitness coach and AI routine generation.

Uses the LLMGateway adapter for real LLM calls via OpenRouter/Groq.
The message-building helpers are structured so future versions can inject
app context and agentic capabilities without breaking the current flow.
"""
import json
import logging
from dataclasses import dataclass
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.adapters.gateways.llm_gateway import LLMGateway
from src.config.settings import get_settings
from src.infrastructure.auth import AuthenticatedUser, get_current_user


logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/ai", tags=["Entrenador con IA"])

SYSTEM_PROMPT_COACH = """Eres el entrenador personal con IA de Volt-Gym. Tu nombre es VOLT Coach.
Responde siempre en espanol. Se motivador, profesional y directo.

Tus capacidades:
- Responder preguntas sobre entrenamiento, tecnica de ejercicios y nutricion.
- Dar consejos personalizados basados en el contexto del usuario.
- Explicar mecanicas de ejercicios de forma clara.
- Motivar al usuario a seguir entrenando.

Reglas:
- Siempre responde en espanol.
- Se conciso pero completo.
- Si no tienes certeza sobre algo medico, recomienda consultar un profesional.
- Usa emojis moderadamente para ser amigable.
- Los nombres de ejercicios van en minusculas salvo nombres propios."""

SYSTEM_PROMPT_GENERATE = """Eres un generador de rutinas de entrenamiento de Volt-Gym.
Responde siempre en espanol con un JSON valido.

Genera una rutina personalizada basada en los parametros del usuario.
El formato de respuesta debe ser EXCLUSIVAMENTE un JSON con esta estructura:
{
  "name": "Nombre de la rutina",
  "exercises": [
    {
      "name": "Nombre del ejercicio",
      "sets": 4,
      "reps": 10,
      "rest_seconds": 90,
      "notes": "Nota breve sobre tecnica"
    }
  ]
}

Reglas:
- Nombres de ejercicios en espanol y en minusculas salvo nombres propios.
- Incluye entre 5 y 8 ejercicios por rutina.
- Ajusta series, repeticiones y descanso al nivel y objetivo.
- No incluyas texto fuera del JSON."""


@dataclass(slots=True, frozen=True)
class CoachFeatureFlags:
    profile_context_enabled: bool
    workout_context_enabled: bool
    classes_context_enabled: bool
    agentic_actions_enabled: bool


@dataclass(slots=True)
class CoachRuntimeContext:
    user_id: str
    flags: CoachFeatureFlags
    profile_summary: str | None = None
    workout_summary: str | None = None
    classes_summary: str | None = None
    available_actions: tuple[str, ...] = ()


def get_llm_gateway() -> LLMGateway:
    return LLMGateway()


class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    reply: str
    model: str


class GenerateWorkoutRequest(BaseModel):
    goals: str
    equipment: str
    level: str
    days_per_week: Optional[int] = 4
    duration_minutes: Optional[int] = 60


class GenerateWorkoutResponse(BaseModel):
    status: str
    routine: dict
    model: str


def _build_coach_feature_flags() -> CoachFeatureFlags:
    return CoachFeatureFlags(
        profile_context_enabled=settings.ai_context_profile_enabled,
        workout_context_enabled=settings.ai_context_workout_enabled,
        classes_context_enabled=settings.ai_context_classes_enabled,
        agentic_actions_enabled=settings.ai_agentic_actions_enabled,
    )


def _build_runtime_context(current_user: AuthenticatedUser) -> CoachRuntimeContext:
    flags = _build_coach_feature_flags()
    available_actions: tuple[str, ...] = ()
    if flags.agentic_actions_enabled:
        available_actions = (
            "crear_rutina_personalizada",
            "inscribir_en_clase",
            "registrar_entrenamiento",
            "actualizar_objetivo",
        )
    return CoachRuntimeContext(
        user_id=str(current_user.id),
        flags=flags,
        available_actions=available_actions,
    )


def _build_context_sections(context: CoachRuntimeContext) -> list[str]:
    sections: list[str] = []

    if context.profile_summary:
        sections.append("Resumen de perfil del usuario:\n" + context.profile_summary)
    if context.workout_summary:
        sections.append("Resumen reciente de entrenamiento:\n" + context.workout_summary)
    if context.classes_summary:
        sections.append("Resumen de clases del usuario:\n" + context.classes_summary)
    if context.available_actions:
        actions = "\n".join(f"- {action}" for action in context.available_actions)
        sections.append(
            "Acciones potenciales de la plataforma para futuras versiones agenticas:\n"
            + actions
            + "\n- Solo propon acciones si el backend las habilita explicitamente."
        )

    return sections


def _build_coach_system_prompt(context: CoachRuntimeContext) -> str:
    sections = [SYSTEM_PROMPT_COACH, *_build_context_sections(context)]
    return "\n\n".join(section for section in sections if section)


def _build_chat_messages(chat: ChatMessage, current_user: AuthenticatedUser) -> list[dict[str, str]]:
    runtime_context = _build_runtime_context(current_user)
    messages = [{"role": "system", "content": _build_coach_system_prompt(runtime_context)}]

    if chat.history:
        for msg in chat.history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": chat.message})
    return messages


@router.post("/chat-messages", response_model=ChatResponse)
async def create_chat_message(
    chat: ChatMessage,
    current_user: AuthenticatedUser = Depends(get_current_user),
    llm: LLMGateway = Depends(get_llm_gateway),
):
    """Endpoint conversacional del entrenador con IA."""
    messages = _build_chat_messages(chat, current_user)

    try:
        response = await llm.chat(messages, max_tokens=1024)
        return ChatResponse(reply=response.content, model=response.model)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error inesperado al comunicarse con el entrenador con IA")
        raise HTTPException(
            status_code=500,
            detail="No se pudo comunicar con el servicio de IA.",
        ) from exc


@router.post("/workout-plans", response_model=GenerateWorkoutResponse)
async def create_workout_plan(
    req: GenerateWorkoutRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    llm: LLMGateway = Depends(get_llm_gateway),
):
    """Genera una rutina de entrenamiento personalizada con IA."""
    user_prompt = (
        f"Genera una rutina de entrenamiento con estos parametros:\n"
        f"- Objetivo: {req.goals}\n"
        f"- Equipo disponible: {req.equipment}\n"
        f"- Nivel de experiencia: {req.level}\n"
        f"- Dias por semana: {req.days_per_week}\n"
        f"- Duracion por sesion: {req.duration_minutes} minutos\n"
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_GENERATE},
        {"role": "user", "content": user_prompt},
    ]

    try:
        response = await llm.generate(messages, max_tokens=2048)

        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content
            content = content.rsplit("```", 1)[0]
            content = content.strip()

        try:
            routine_data = json.loads(content)
        except json.JSONDecodeError:
            routine_data = {
                "name": f"Rutina {req.goals}",
                "exercises": [],
                "raw_response": response.content,
            }

        return GenerateWorkoutResponse(
            status="success",
            routine=routine_data,
            model=response.model,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error inesperado al generar una rutina con IA")
        raise HTTPException(
            status_code=500,
            detail="No se pudo generar la rutina con el servicio de IA.",
        ) from exc
