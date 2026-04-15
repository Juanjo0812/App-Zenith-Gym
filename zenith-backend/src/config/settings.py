from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


AIProvider = Literal["groq", "openrouter"]


class Settings(BaseSettings):
    db_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost/zenith",
        validation_alias=AliasChoices("DB_URL", "DATABASE_URL"),
    )
    db_echo: bool = Field(default=False, validation_alias=AliasChoices("DB_ECHO"))
    supabase_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL"),
    )
    supabase_jwt_audience: str = Field(
        default="authenticated",
        validation_alias=AliasChoices("SUPABASE_JWT_AUDIENCE"),
    )
    supabase_jwt_issuer: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_JWT_ISSUER"),
    )
    supabase_jwt_secret: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_JWT_SECRET"),
    )

    # --- AI / LLM providers ---
    openrouter_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENROUTER_API_KEY"),
    )
    openrouter_model: str = Field(
        default="meta-llama/llama-4-maverick",
        validation_alias=AliasChoices("OPENROUTER_MODEL"),
    )
    groq_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("GROQ_API_KEY"),
    )
    groq_model: str = Field(
        default="llama-3.3-70b-versatile",
        validation_alias=AliasChoices("GROQ_MODEL"),
    )
    ai_chat_provider: AIProvider | None = Field(
        default=None,
        validation_alias=AliasChoices("AI_CHAT_PROVIDER"),
    )
    ai_chat_model: str | None = Field(
        default=None,
        validation_alias=AliasChoices("AI_CHAT_MODEL"),
    )
    ai_generation_provider: AIProvider | None = Field(
        default=None,
        validation_alias=AliasChoices("AI_GENERATION_PROVIDER"),
    )
    ai_generation_model: str | None = Field(
        default=None,
        validation_alias=AliasChoices("AI_GENERATION_MODEL"),
    )
    ai_fallback_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("AI_FALLBACK_ENABLED"),
    )
    ai_agentic_actions_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("AI_AGENTIC_ACTIONS_ENABLED"),
    )
    ai_context_profile_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("AI_CONTEXT_PROFILE_ENABLED"),
    )
    ai_context_workout_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("AI_CONTEXT_WORKOUT_ENABLED"),
    )
    ai_context_classes_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("AI_CONTEXT_CLASSES_ENABLED"),
    )

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "zenith-mobile/.env", "../zenith-mobile/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def resolved_supabase_jwt_issuer(self) -> str | None:
        if self.supabase_jwt_issuer:
            return self.supabase_jwt_issuer.rstrip("/")
        if self.supabase_url:
            return f"{self.supabase_url.rstrip('/')}/auth/v1"
        return None

    @property
    def supabase_jwks_url(self) -> str | None:
        if not self.supabase_url:
            return None
        return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
