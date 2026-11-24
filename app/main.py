import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.errors import register_exception_handlers
from app.routers import cities, vaccination_points

app = FastAPI(
    title="API de Pontos de Vacinação - Alagoas",
    description="API REST somente leitura para consulta de municípios e pontos de vacinação em Alagoas.",
    version="1.0.0",
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
