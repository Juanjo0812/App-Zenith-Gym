"""
LLM Gateway - Adapter for communicating with external LLM APIs.

Uses OpenRouter and Groq for conversational and structured AI workloads.
The current defaults preserve the existing MVP behavior:
- chat -> Groq first, OpenRouter as fallback
- generation -> OpenRouter first, Groq as fallback

The routing layer is intentionally kept generic so future use cases can
choose provider/model per task without changing the public API.
"""
import logging
from dataclasses import dataclass
from typing import Any, Literal

import httpx

from src.config.settings import AIProvider, get_settings


logger = logging.getLogger(__name__)
UseCaseName = Literal["chat", "generation"]


@dataclass(slots=True)
class LLMResponse:
    content: str
    model: str
    usage: dict[str, int]


@dataclass(slots=True, frozen=True)
class LLMRouteConfig:
    use_case: UseCaseName
    provider: AIProvider
    model: str
    fallbacks: tuple[AIProvider, ...]


class LLMProviderError(RuntimeError):
    def __init__(self, provider: str, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code


class LLMGateway:
    """Thin adapter around OpenRouter and Groq HTTP APIs."""

    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self) -> None:
        self._settings = get_settings()

    async def chat(self, messages: list[dict[str, str]], *, max_tokens: int = 1024) -> LLMResponse:
        """Conversational route with configurable provider/model selection."""
        route = self._resolve_route("chat")
        return await self._execute_route(route, messages, max_tokens=max_tokens)

    async def generate(self, messages: list[dict[str, str]], *, max_tokens: int = 2048) -> LLMResponse:
        """Structured generation route with configurable provider/model selection."""
        route = self._resolve_route("generation")
        return await self._execute_route(route, messages, max_tokens=max_tokens)

    async def _execute_route(
        self,
        route: LLMRouteConfig,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
    ) -> LLMResponse:
        last_exc: LLMProviderError | None = None
        for index, provider in enumerate((route.provider, *route.fallbacks)):
            model = route.model if index == 0 else self._resolve_model(route.use_case, provider)
            try:
                return await self._call_provider(provider, messages, max_tokens=max_tokens, model=model)
            except LLMProviderError as exc:
                last_exc = exc
                if index == 0 and route.fallbacks:
                    logger.warning(
                        "%s fallo para %s y se intentara usar el siguiente proveedor: %s",
                        self._provider_label(provider),
                        route.use_case,
                        exc,
                    )
                    continue

                if index < len(route.fallbacks):
                    logger.warning(
                        "Fallo adicional en proveedor de respaldo %s para %s: %s",
                        self._provider_label(provider),
                        route.use_case,
                        exc,
                    )

        if len(route.fallbacks) == 0 and last_exc is not None:
            raise RuntimeError(str(last_exc)) from last_exc

        raise RuntimeError(
            "No se pudo comunicar con los proveedores de IA configurados. "
            "Verifica las credenciales de API y la conectividad del backend."
        ) from last_exc

    def _resolve_route(self, use_case: UseCaseName) -> LLMRouteConfig:
        provider = self._resolve_provider(use_case)
        fallbacks: tuple[AIProvider, ...] = ()
        if self._settings.ai_fallback_enabled:
            fallbacks = tuple(
                candidate for candidate in self._available_providers(use_case) if candidate != provider
            )
        return LLMRouteConfig(
            use_case=use_case,
            provider=provider,
            model=self._resolve_model(use_case, provider),
            fallbacks=fallbacks,
        )

    def _resolve_provider(self, use_case: UseCaseName) -> AIProvider:
        configured = self._configured_provider(use_case)
        preferred_order = self._preferred_provider_order(use_case)
        available = self._available_providers(use_case)
        if not available:
            if use_case == "chat":
                raise RuntimeError(
                    "No hay claves API configuradas para el entrenador con IA. "
                    "Agrega GROQ_API_KEY o OPENROUTER_API_KEY en tu .env"
                )
            raise RuntimeError(
                "No hay claves API configuradas para generacion con IA. "
                "Agrega OPENROUTER_API_KEY o GROQ_API_KEY en tu .env"
            )

        if configured is not None and self._provider_is_available(configured):
            return configured

        for provider in preferred_order:
            if self._provider_is_available(provider):
                return provider

        return available[0]

    def _configured_provider(self, use_case: UseCaseName) -> AIProvider | None:
        if use_case == "chat":
            return self._settings.ai_chat_provider
        return self._settings.ai_generation_provider

    def _preferred_provider_order(self, use_case: UseCaseName) -> tuple[AIProvider, ...]:
        if use_case == "chat":
            return ("groq", "openrouter")
        return ("openrouter", "groq")

    def _available_providers(self, use_case: UseCaseName) -> list[AIProvider]:
        return [provider for provider in self._preferred_provider_order(use_case) if self._provider_is_available(provider)]

    def _provider_is_available(self, provider: AIProvider) -> bool:
        if provider == "openrouter":
            return bool(self._settings.openrouter_api_key)
        return bool(self._settings.groq_api_key)

    def _resolve_model(self, use_case: UseCaseName, provider: AIProvider) -> str:
        if use_case == "chat" and self._settings.ai_chat_model:
            return self._settings.ai_chat_model
        if use_case == "generation" and self._settings.ai_generation_model:
            return self._settings.ai_generation_model
        if provider == "openrouter":
            return self._settings.openrouter_model
        return self._settings.groq_model

    def _provider_label(self, provider: AIProvider) -> str:
        if provider == "openrouter":
            return "OpenRouter"
        return "Groq"

    async def _call_provider(
        self,
        provider: AIProvider,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        model: str,
    ) -> LLMResponse:
        if provider == "openrouter":
            return await self._call_openrouter(messages, max_tokens=max_tokens, model=model)
        return await self._call_groq(messages, max_tokens=max_tokens, model=model)

    def _raise_provider_error(self, provider: str, env_var: str, exc: httpx.HTTPStatusError) -> None:
        status_code = exc.response.status_code
        if status_code in (401, 403):
            message = f"Las credenciales de {provider} fueron rechazadas. Verifica {env_var}."
        elif status_code == 429:
            message = f"{provider} alcanzo el limite de solicitudes. Intenta nuevamente en unos minutos."
        elif status_code >= 500:
            message = f"{provider} no esta disponible en este momento. Intenta nuevamente mas tarde."
        else:
            message = f"{provider} devolvio un error al procesar la solicitud."
        raise LLMProviderError(provider, message, status_code=status_code) from exc

    async def _call_openrouter(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        model: str,
    ) -> LLMResponse:
        headers = {
            "Authorization": f"Bearer {self._settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://zenith-app.com",
            "X-Title": "Zenith AI Coach",
        }
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(self.OPENROUTER_URL, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPStatusError as exc:
                self._raise_provider_error("OpenRouter", "OPENROUTER_API_KEY", exc)
            except httpx.HTTPError as exc:
                raise LLMProviderError(
                    "OpenRouter",
                    "No se pudo conectar con OpenRouter. Revisa la conectividad del backend.",
                ) from exc

        choice = data["choices"][0]["message"]
        return LLMResponse(
            content=choice["content"],
            model=data.get("model", model),
            usage=data.get("usage", {}),
        )

    async def _call_groq(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        model: str,
    ) -> LLMResponse:
        headers = {
            "Authorization": f"Bearer {self._settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(self.GROQ_URL, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPStatusError as exc:
                self._raise_provider_error("Groq", "GROQ_API_KEY", exc)
            except httpx.HTTPError as exc:
                raise LLMProviderError(
                    "Groq",
                    "No se pudo conectar con Groq. Revisa la conectividad del backend.",
                ) from exc

        choice = data["choices"][0]["message"]
        return LLMResponse(
            content=choice["content"],
            model=data.get("model", model),
            usage=data.get("usage", {}),
        )
