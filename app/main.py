import os
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import get_db_path
from app.errors import register_exception_handlers
from app.routers import cities, vaccination_points
from scripts.seed import seed_database


def ensure_database_seeded() -> None:
    """Ensure SQLite database exists and is populated (handles ephemeral disks)."""
    db_path = get_db_path()
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        try:
            row = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='cities'"
            ).fetchone()
            if row is not None:
                return
        finally:
            conn.close()
    seed_database(db_path)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Initialize database on startup if missing."""
    ensure_database_seeded()
    yield


app = FastAPI(
    title="API de Pontos de Vacinação - Alagoas",
    description="API REST somente leitura para consulta de municípios e pontos de vacinação em Alagoas.",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(cities.router)
app.include_router(vaccination_points.router)


@app.get("/health", tags=["Health"], summary="Verificar saúde da API")
def health_check() -> dict[str, str]:
    """Return service health status for monitoring and keep-alive pings."""
    return {"status": "ok"}
