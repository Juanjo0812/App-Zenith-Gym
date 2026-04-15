from types import SimpleNamespace

import pytest

from src.adapters.gateways.llm_gateway import LLMGateway, LLMProviderError, LLMResponse


@pytest.mark.asyncio
async def test_chat_usa_openrouter_si_groq_rechaza_credenciales(monkeypatch):
    gateway = LLMGateway()
    gateway._settings = SimpleNamespace(
        groq_api_key="groq-invalida",
        openrouter_api_key="openrouter-valida",
        groq_model="groq-modelo",
        openrouter_model="openrouter-modelo",
        ai_chat_provider=None,
        ai_chat_model=None,
        ai_generation_provider=None,
        ai_generation_model=None,
        ai_fallback_enabled=True,
    )

    async def fake_groq(messages, *, max_tokens, model):
        raise LLMProviderError(
            "Groq",
            "Las credenciales de Groq fueron rechazadas. Verifica GROQ_API_KEY.",
            status_code=401,
        )

    async def fake_openrouter(messages, *, max_tokens, model):
        return LLMResponse(
            content="respuesta de respaldo",
            model="openrouter-modelo",
            usage={"total_tokens": 12},
        )

    monkeypatch.setattr(gateway, "_call_groq", fake_groq)
    monkeypatch.setattr(gateway, "_call_openrouter", fake_openrouter)

    response = await gateway.chat([{"role": "user", "content": "hola"}])

    assert response.content == "respuesta de respaldo"
    assert response.model == "openrouter-modelo"


@pytest.mark.asyncio
async def test_chat_informa_error_en_espanol_si_fallan_ambos_proveedores(monkeypatch):
    gateway = LLMGateway()
    gateway._settings = SimpleNamespace(
        groq_api_key="groq-invalida",
        openrouter_api_key="openrouter-invalida",
        groq_model="groq-modelo",
        openrouter_model="openrouter-modelo",
        ai_chat_provider=None,
        ai_chat_model=None,
        ai_generation_provider=None,
        ai_generation_model=None,
        ai_fallback_enabled=True,
    )

    async def fake_groq(messages, *, max_tokens, model):
        raise LLMProviderError(
            "Groq",
            "Las credenciales de Groq fueron rechazadas. Verifica GROQ_API_KEY.",
            status_code=401,
        )

    async def fake_openrouter(messages, *, max_tokens, model):
        raise LLMProviderError(
            "OpenRouter",
            "Las credenciales de OpenRouter fueron rechazadas. Verifica OPENROUTER_API_KEY.",
            status_code=401,
        )

    monkeypatch.setattr(gateway, "_call_groq", fake_groq)
    monkeypatch.setattr(gateway, "_call_openrouter", fake_openrouter)

    with pytest.raises(RuntimeError, match="No se pudo comunicar con los proveedores de IA configurados"):
        await gateway.chat([{"role": "user", "content": "hola"}])


@pytest.mark.asyncio
async def test_chat_respeta_el_proveedor_y_modelo_configurados_para_el_caso_de_uso(monkeypatch):
    gateway = LLMGateway()
    gateway._settings = SimpleNamespace(
        groq_api_key="groq-valida",
        openrouter_api_key="openrouter-valida",
        groq_model="groq-modelo-default",
        openrouter_model="openrouter-modelo-default",
        ai_chat_provider="openrouter",
        ai_chat_model="openrouter/free",
        ai_generation_provider=None,
        ai_generation_model=None,
        ai_fallback_enabled=True,
    )

    captured: dict[str, str] = {}

    async def fake_openrouter(messages, *, max_tokens, model):
        captured["model"] = model
        return LLMResponse(
            content="respuesta principal",
            model=model,
            usage={"total_tokens": 10},
        )

    async def fake_groq(messages, *, max_tokens, model):
        raise AssertionError("No deberia usar Groq cuando AI_CHAT_PROVIDER=openrouter")

    monkeypatch.setattr(gateway, "_call_openrouter", fake_openrouter)
    monkeypatch.setattr(gateway, "_call_groq", fake_groq)

    response = await gateway.chat([{"role": "user", "content": "hola"}])

    assert captured["model"] == "openrouter/free"
    assert response.model == "openrouter/free"
