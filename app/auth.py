import base64
import hashlib
import hmac
import os
import time

from fastapi import Header

from app.errors import UnauthorizedError

TOKEN_TTL_SECONDS = 12 * 60 * 60


def get_admin_password() -> str:
    """Return configured admin password (defaults to 'admin123' for local dev)."""
    return os.getenv("ADMIN_PASSWORD", "admin123")


def _get_signing_key() -> bytes:
    secret = os.getenv("SECRET_KEY") or f"pi-iv-b::{get_admin_password()}"
    return hashlib.sha256(secret.encode("utf-8")).digest()


def verify_admin_password(password: str) -> bool:
    """Constant-time comparison against ADMIN_PASSWORD."""
    return hmac.compare_digest(password, get_admin_password())


def create_admin_token() -> str:
    """Create a signed stateless token valid for TOKEN_TTL_SECONDS."""
    expires_at = str(int(time.time()) + TOKEN_TTL_SECONDS).encode("utf-8")
    payload = base64.urlsafe_b64encode(expires_at).decode("ascii")
    sig = hmac.new(_get_signing_key(), payload.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def verify_admin_token(token: str) -> bool:
    """Verify token signature and expiration."""
    try:
        payload, sig = token.split(".", 1)
        expected = hmac.new(
            _get_signing_key(), payload.encode("ascii"), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return False
        expires_at = int(base64.urlsafe_b64decode(payload.encode("ascii")).decode("utf-8"))
        return time.time() < expires_at
    except Exception:
        return False


def require_admin(authorization: str | None = Header(default=None)) -> None:
    """FastAPI dependency enforcing Bearer token authentication for admin routes."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Token de autenticação ausente.")
    token = authorization.removeprefix("Bearer ").strip()
    if not verify_admin_token(token):
        raise UnauthorizedError("Sessão expirada ou token inválido.")
