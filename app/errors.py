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


class PointNotFoundError(Exception):
    """Raised when a requested vaccination point does not exist in the database."""

    def __init__(self, point_id: int) -> None:
        self.point_id = point_id
        super().__init__(f"Ponto de vacinação com id {point_id} não encontrado.")


class UnauthorizedError(Exception):
    """Raised when admin authentication is missing or invalid."""

    def __init__(self, message: str = "Credenciais de administrador inválidas.") -> None:
        super().__init__(message)
        self.message = message


def build_error_payload(code: str, message: str) -> dict[str, dict[str, str]]:
    """Build the standardized JSON error envelope."""
    return {"error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    """Register domain, validation, auth, and fallback exception handlers."""

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

    @app.exception_handler(PointNotFoundError)
    async def point_not_found_handler(
        _request: Request, exc: PointNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content=build_error_payload(
                "POINT_NOT_FOUND",
                f"Ponto de vacinação com id {exc.point_id} não encontrado.",
            ),
        )

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(
        _request: Request, exc: UnauthorizedError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=401,
            content=build_error_payload("UNAUTHORIZED", exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, _exc: RequestValidationError
    ) -> JSONResponse:
        if request.url.path.startswith("/api/admin"):
            return JSONResponse(
                status_code=400,
                content=build_error_payload(
                    "VALIDATION_ERROR",
                    "Dados inválidos enviados para a operação administrativa.",
                ),
            )
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
