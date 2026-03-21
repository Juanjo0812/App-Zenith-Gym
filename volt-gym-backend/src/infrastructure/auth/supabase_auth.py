from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.repositories.sqlalchemy_user_repository import SQLAlchemyUserRepository
from src.config.settings import Settings, get_settings
from src.infrastructure.database.base import get_session

security = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class AuthenticatedUser:
    id: UUID
    email: str | None = None
    user_metadata: dict[str, Any] = field(default_factory=dict)
    app_metadata: dict[str, Any] = field(default_factory=dict)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _resolve_name(metadata: dict[str, Any]) -> str | None:
    for key in ("name", "full_name", "display_name", "username"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


@lru_cache
def _get_jwk_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url)


def _decode_token(token: str, settings: Settings) -> dict[str, Any]:
    try:
        header = jwt.get_unverified_header(token)
    except InvalidTokenError as exc:
        raise _unauthorized("El token de autenticación no es válido.") from exc

    algorithm = str(header.get("alg", "")).upper()
    issuer = settings.resolved_supabase_jwt_issuer
    audience = settings.supabase_jwt_audience
    decode_kwargs: dict[str, Any] = {
        "algorithms": [algorithm] if algorithm else ["RS256"],
        "options": {"verify_aud": bool(audience)},
    }

    if audience:
        decode_kwargs["audience"] = audience
    if issuer:
        decode_kwargs["issuer"] = issuer

    try:
        if algorithm.startswith("HS"):
            if not settings.supabase_jwt_secret:
                raise _unauthorized(
                    "Falta configurar SUPABASE_JWT_SECRET para validar tokens simétricos."
                )
            return jwt.decode(token, settings.supabase_jwt_secret, **decode_kwargs)

        if not settings.supabase_jwks_url:
            raise _unauthorized(
                "Falta configurar SUPABASE_URL para validar el token del usuario."
            )

        signing_key = _get_jwk_client(settings.supabase_jwks_url).get_signing_key_from_jwt(token)
        return jwt.decode(token, signing_key.key, **decode_kwargs)
    except jwt.ExpiredSignatureError as exc:
        raise _unauthorized("La sesión expiró. Inicia sesión de nuevo.") from exc
    except (InvalidTokenError, PyJWKClientError) as exc:
        raise _unauthorized("No se pudo validar el token del usuario.") from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> AuthenticatedUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Debes iniciar sesión para continuar.")

    payload = _decode_token(credentials.credentials, get_settings())
    subject = payload.get("sub")

    try:
        user_id = UUID(str(subject))
    except (TypeError, ValueError) as exc:
        raise _unauthorized("El token no contiene un usuario válido.") from exc

    user_metadata = payload.get("user_metadata") or {}
    app_metadata = payload.get("app_metadata") or {}
    current_user = AuthenticatedUser(
        id=user_id,
        email=payload.get("email"),
        user_metadata=user_metadata if isinstance(user_metadata, dict) else {},
        app_metadata=app_metadata if isinstance(app_metadata, dict) else {},
    )

    user_repo = SQLAlchemyUserRepository(session)
    await user_repo.ensure_exists(
        user_id=current_user.id,
        name=_resolve_name(current_user.user_metadata),
    )

    return current_user
