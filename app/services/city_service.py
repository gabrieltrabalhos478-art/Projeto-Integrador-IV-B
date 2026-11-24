import sqlite3

from app.errors import CityNotFoundError
from app.repositories import city_repository
from app.schemas.city import CityDetail, CitySummary


def list_cities(conn: sqlite3.Connection) -> list[CitySummary]:
    """Retrieve all available municipalities in Alagoas."""
    rows = city_repository.list_cities(conn)
    return [
        CitySummary(id=row["id"], name=row["name"], ibge_code=row["ibge_code"])
        for row in rows
    ]


def get_city_detail(conn: sqlite3.Connection, city_id: int) -> CityDetail:
    """Retrieve municipality details or raise CityNotFoundError."""
    row = city_repository.get_city_by_id_with_count(conn, city_id)
    if row is None:
        raise CityNotFoundError(city_id)
    return CityDetail(
        id=row["id"],
        name=row["name"],
        state="AL",
        ibge_code=row["ibge_code"],
        vaccination_points_count=row["vaccination_points_count"],
    )
