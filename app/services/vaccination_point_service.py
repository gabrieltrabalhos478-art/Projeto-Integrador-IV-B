from typing import Any

from app.database import DBConnection
from app.errors import CityNotFoundError, PointNotFoundError
from app.repositories import city_repository, vaccination_point_repository
from app.schemas.vaccination_point import VaccinationPointOut, VaccinationPointPayload


def parse_vaccines(raw: str | None) -> list[str]:
    """Parse semicolon-delimited vaccines string into a clean list."""
    if not raw:
        return []
    return [item.strip() for item in raw.split(";") if item.strip()]


def format_vaccines(items: list[str]) -> str | None:
    """Serialize vaccine list to semicolon-delimited string for storage."""
    cleaned = [item.strip() for item in items if item.strip()]
    return ";".join(cleaned) if cleaned else None


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped if stripped else None


def _row_to_out(row: Any) -> VaccinationPointOut:
    return VaccinationPointOut(
        id=row["id"],
        city_id=row["city_id"],
        name=row["name"],
        address=row["address"],
        neighborhood=row["neighborhood"],
        phone=row["phone"],
        opening_hours=row["opening_hours"],
        vaccines=parse_vaccines(row["vaccines"]),
    )


def list_points_by_city(
    conn: DBConnection, city_id: int
) -> list[VaccinationPointOut]:
    """List vaccination points for a city, raising CityNotFoundError if city is absent."""
    if not city_repository.city_exists(conn, city_id):
        raise CityNotFoundError(city_id)

    rows = vaccination_point_repository.list_by_city_id(conn, city_id)
    return [_row_to_out(row) for row in rows]


def create_point(
    conn: DBConnection, payload: VaccinationPointPayload
) -> VaccinationPointOut:
    """Create a new vaccination point after verifying the target city exists."""
    if not city_repository.city_exists(conn, payload.city_id):
        raise CityNotFoundError(payload.city_id)

    new_id = vaccination_point_repository.create_point(
        conn,
        city_id=payload.city_id,
        name=payload.name.strip(),
        address=_clean_optional(payload.address),
        neighborhood=_clean_optional(payload.neighborhood),
        phone=_clean_optional(payload.phone),
        opening_hours=_clean_optional(payload.opening_hours),
        vaccines=format_vaccines(payload.vaccines),
    )
    row = vaccination_point_repository.get_by_id(conn, new_id)
    return _row_to_out(row)


def update_point(
    conn: DBConnection, point_id: int, payload: VaccinationPointPayload
) -> VaccinationPointOut:
    """Update an existing vaccination point after validating city and point existence."""
    if not city_repository.city_exists(conn, payload.city_id):
        raise CityNotFoundError(payload.city_id)

    updated = vaccination_point_repository.update_point(
        conn,
        point_id,
        city_id=payload.city_id,
        name=payload.name.strip(),
        address=_clean_optional(payload.address),
        neighborhood=_clean_optional(payload.neighborhood),
        phone=_clean_optional(payload.phone),
        opening_hours=_clean_optional(payload.opening_hours),
        vaccines=format_vaccines(payload.vaccines),
    )
    if not updated:
        raise PointNotFoundError(point_id)

    row = vaccination_point_repository.get_by_id(conn, point_id)
    return _row_to_out(row)


def delete_point(conn: DBConnection, point_id: int) -> None:
    """Delete a vaccination point or raise PointNotFoundError."""
    if not vaccination_point_repository.delete_point(conn, point_id):
        raise PointNotFoundError(point_id)
