import sqlite3

from app.errors import CityNotFoundError
from app.repositories import city_repository, vaccination_point_repository
from app.schemas.vaccination_point import VaccinationPointOut


def parse_vaccines(raw: str | None) -> list[str]:
    """Parse semicolon-delimited vaccines string into a clean list."""
    if not raw:
        return []
    return [item.strip() for item in raw.split(";") if item.strip()]


def list_points_by_city(
    conn: sqlite3.Connection, city_id: int
) -> list[VaccinationPointOut]:
    """List vaccination points for a city, raising CityNotFoundError if city is absent."""
    if not city_repository.city_exists(conn, city_id):
        raise CityNotFoundError(city_id)

    rows = vaccination_point_repository.list_by_city_id(conn, city_id)
    return [
        VaccinationPointOut(
            id=row["id"],
            city_id=row["city_id"],
            name=row["name"],
            address=row["address"],
            neighborhood=row["neighborhood"],
            phone=row["phone"],
            opening_hours=row["opening_hours"],
            vaccines=parse_vaccines(row["vaccines"]),
        )
        for row in rows
    ]
