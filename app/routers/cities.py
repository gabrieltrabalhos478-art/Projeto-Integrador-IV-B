from fastapi import APIRouter, Depends, Path

from app.database import DBConnection, get_db
from app.schemas.city import CityDetail, CitySummary
from app.services import city_service

router = APIRouter(prefix="/cities", tags=["Cities"])


@router.get(
    "",
    response_model=list[CitySummary],
    summary="Listar cidades de Alagoas",
)
def get_cities(conn: DBConnection = Depends(get_db)) -> list[CitySummary]:
    """Return all municipalities in Alagoas."""
    return city_service.list_cities(conn)


@router.get(
    "/{id}",
    response_model=CityDetail,
    summary="Detalhar uma cidade por ID",
)
def get_city_by_id(
    id: int = Path(..., gt=0, description="ID numérico positivo da cidade"),
    conn: DBConnection = Depends(get_db),
) -> CityDetail:
    """Return details and vaccination point count for a single municipality."""
    return city_service.get_city_detail(conn, id)
