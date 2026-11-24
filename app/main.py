import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import create_connection, get_database_url, get_db_path
from app.errors import register_exception_handlers
from app.routers import admin, cities, vaccination_points
from scripts.seed import backfill_coordinates, seed_database

STATIC_DIR = Path(__file__).resolve().parent / "static"


def ensure_database_seeded() -> None:
    """Seed database on startup if missing/empty and ensure geo columns exist."""
    db_path = None if get_database_url() else get_db_path()
    if db_path is not None and not db_path.exists():
        seed_database(db_path)
        return

    conn = create_connection(db_path)
    try:
        if conn.is_postgres:
            exists = conn.fetchone(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cities'"
            )
        else:
            exists = conn.fetchone(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='cities'"
            )
        if exists is not None:
            count_row = conn.fetchone("SELECT COUNT(*) AS total FROM cities")
            if count_row and count_row["total"] > 0:
                backfill_coordinates(conn)
                return
    finally:
        conn.close()

    seed_database(db_path)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Initialize database on startup if missing or empty."""
    ensure_database_seeded()
    yield


app = FastAPI(
    title="API de Pontos de Vacinação - Alagoas",
    description="API REST e Portal de Consulta/Administração de Pontos de Vacinação em Alagoas.",
    version="1.1.0",
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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(cities.router)
app.include_router(vaccination_points.router)
app.include_router(admin.router)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
def serve_portal() -> FileResponse:
    """Serve the public vaccination portal."""
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/admin", include_in_schema=False)
def serve_admin() -> FileResponse:
    """Serve the admin management panel."""
    return FileResponse(STATIC_DIR / "admin.html")


@app.get("/health", tags=["Health"], summary="Verificar saúde da API")
def health_check() -> dict[str, str]:
    """Return service health status for monitoring and keep-alive pings."""
    return {"status": "ok"}
