import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class CityNotFoundError(Exception):
    """Raised when a requested municipality does not exist in the database."""

    def __init__(self, city_id: int) -> None:
        self.city_id = city_id
        super().__init__(f"Cidade com id {city_id} não encontrada.")


def build_error_payload(code: str, message: str) -> dict[str, dict[str, str]]:
    """Build the standardized JSON error envelope."""
    return {"error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    """Register domain, validation, and fallback exception handlers."""

    @app.exception_handler(CityNotFoundError)
    async def city_not_found_handler(
        _request: Request, exc: CityNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content=build_error_payload(
                "CITY_NOT_FOUND",
                f"Cidade com id {exc.city_id} não encontrada.",
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, _exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content=build_error_payload(
                "INVALID_ID",
                "O identificador informado deve ser um número inteiro positivo.",
            ),
        )

    @app.exception_handler(Exception)
    async def internal_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Erro interno não tratado: %s", exc)
        return JSONResponse(
            status_code=500,
            content=build_error_payload(
                "INTERNAL_ERROR",
                "Erro interno inesperado no servidor.",
            ),
        )
