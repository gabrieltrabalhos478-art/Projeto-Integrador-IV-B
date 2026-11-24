from fastapi import APIRouter, Depends

from app.database import DBConnection, get_db
from app.repositories import vaccination_point_repository
from app.schemas.vaccination_point import VaccinationPointOut
from app.services.vaccination_point_service import parse_vaccines

router = APIRouter(prefix="/api/portal", tags=["Portal"], include_in_schema=False)


class PortalVaccinationPointOut(VaccinationPointOut):
    """Vaccination point enriched with city_name for statewide portal view."""

    city_name: str


@router.get("/vaccination-points", response_model=list[PortalVaccinationPointOut])
def list_all_portal_points(
    conn: DBConnection = Depends(get_db),
) -> list[PortalVaccinationPointOut]:
    """Return all vaccination points across Alagoas in a single query."""
    rows = vaccination_point_repository.list_all_with_city(conn)
    return [
        PortalVaccinationPointOut(
            id=row["id"],
            city_id=row["city_id"],
            city_name=row["city_name"],
            name=row["name"],
            address=row["address"],
            neighborhood=row["neighborhood"],
            phone=row["phone"],
            opening_hours=row["opening_hours"],
            vaccines=parse_vaccines(row["vaccines"]),
            latitude=row["latitude"],
            longitude=row["longitude"],
        )
        for row in rows
    ]
