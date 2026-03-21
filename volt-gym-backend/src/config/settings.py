from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost/voltgym",
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

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "volt-gym-mobile/.env", "../volt-gym-mobile/.env"),
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
