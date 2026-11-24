from fastapi import APIRouter, Depends, Path

from app.database import DBConnection, get_db
from app.schemas.vaccination_point import VaccinationPointOut
from app.services import vaccination_point_service

router = APIRouter(prefix="/vaccination-points", tags=["Vaccination Points"])


@router.get(
    "/{cityId}",
    response_model=list[VaccinationPointOut],
    summary="Listar pontos de vacinação de uma cidade",
)
def get_vaccination_points_by_city(
    cityId: int = Path(..., gt=0, description="ID numérico positivo da cidade"),
    conn: DBConnection = Depends(get_db),
) -> list[VaccinationPointOut]:
    """Return vaccination points for a given municipality (empty list if none)."""
    return vaccination_point_service.list_points_by_city(conn, cityId)
