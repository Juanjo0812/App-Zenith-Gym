from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.adapters.api.v1 import ai_coach
from src.adapters.api.v1.ai_coach import ChatMessage, create_chat_message


class FailingRuntimeLLM:
    async def chat(self, messages, *, max_tokens):
        raise RuntimeError("Las credenciales de Groq fueron rechazadas. Verifica GROQ_API_KEY.")


class FailingUnexpectedLLM:
    async def chat(self, messages, *, max_tokens):
        raise Exception("Client error '401 Unauthorized'")


@pytest.mark.asyncio
async def test_chat_devuelve_503_con_mensaje_en_espanol_si_el_gateway_falla():
    with pytest.raises(HTTPException) as exc_info:
        await create_chat_message(
            ChatMessage(message="hola"),
            current_user=SimpleNamespace(id="usuario-prueba"),
            llm=FailingRuntimeLLM(),
        )

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Las credenciales de Groq fueron rechazadas. Verifica GROQ_API_KEY."


@pytest.mark.asyncio
async def test_chat_oculta_el_error_crudo_del_proveedor():
    with pytest.raises(HTTPException) as exc_info:
        await create_chat_message(
            ChatMessage(message="hola"),
            current_user=SimpleNamespace(id="usuario-prueba"),
            llm=FailingUnexpectedLLM(),
        )

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "No se pudo comunicar con el servicio de IA."


def test_prompt_del_coach_no_incluye_acciones_agenticas_por_defecto(monkeypatch):
    monkeypatch.setattr(
        ai_coach,
        "settings",
        SimpleNamespace(
            ai_context_profile_enabled=False,
            ai_context_workout_enabled=False,
            ai_context_classes_enabled=False,
            ai_agentic_actions_enabled=False,
        ),
    )

    messages = ai_coach._build_chat_messages(
        ChatMessage(message="hola"),
        SimpleNamespace(id="usuario-prueba"),
    )

    assert messages[0]["role"] == "system"
    assert "VOLT Coach" in messages[0]["content"]
    assert "Acciones potenciales de la plataforma" not in messages[0]["content"]


def test_prompt_del_coach_muestra_acciones_futuras_si_se_habilitan(monkeypatch):
    monkeypatch.setattr(
        ai_coach,
        "settings",
        SimpleNamespace(
            ai_context_profile_enabled=False,
            ai_context_workout_enabled=False,
            ai_context_classes_enabled=False,
            ai_agentic_actions_enabled=True,
        ),
    )

    messages = ai_coach._build_chat_messages(
        ChatMessage(message="hola"),
        SimpleNamespace(id="usuario-prueba"),
    )

    assert "Acciones potenciales de la plataforma" in messages[0]["content"]
    assert "crear_rutina_personalizada" in messages[0]["content"]
