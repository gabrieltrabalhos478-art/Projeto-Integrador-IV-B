from fastapi import APIRouter, Depends, Path, Response, status
from pydantic import BaseModel

from app.auth import create_admin_token, require_admin, verify_admin_password
from app.database import DBConnection, get_db
from app.errors import UnauthorizedError
from app.schemas.vaccination_point import VaccinationPointOut, VaccinationPointPayload
from app.services import vaccination_point_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post("/login", response_model=LoginResponse, summary="Autenticar administrador")
def admin_login(payload: LoginRequest) -> LoginResponse:
    """Validate admin password and issue a signed Bearer token."""
    if not verify_admin_password(payload.password):
        raise UnauthorizedError("Senha de administrador incorreta.")
    return LoginResponse(token=create_admin_token())


@router.post(
    "/vaccination-points",
    response_model=VaccinationPointOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
    summary="Cadastrar ponto de vacinação",
)
def create_vaccination_point(
    payload: VaccinationPointPayload,
    conn: DBConnection = Depends(get_db),
) -> VaccinationPointOut:
    """Create a new vaccination point."""
    return vaccination_point_service.create_point(conn, payload)


@router.put(
    "/vaccination-points/{point_id}",
    response_model=VaccinationPointOut,
    dependencies=[Depends(require_admin)],
    summary="Atualizar ponto de vacinação",
)
def update_vaccination_point(
    payload: VaccinationPointPayload,
    point_id: int = Path(..., gt=0),
    conn: DBConnection = Depends(get_db),
) -> VaccinationPointOut:
    """Update an existing vaccination point."""
    return vaccination_point_service.update_point(conn, point_id, payload)


@router.delete(
    "/vaccination-points/{point_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
    summary="Remover ponto de vacinação",
)
def delete_vaccination_point(
    point_id: int = Path(..., gt=0),
    conn: DBConnection = Depends(get_db),
) -> Response:
    """Delete an existing vaccination point."""
    vaccination_point_service.delete_point(conn, point_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
