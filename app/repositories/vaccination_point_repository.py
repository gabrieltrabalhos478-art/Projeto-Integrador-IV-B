from typing import Any

from app.database import DBConnection


def list_by_city_id(conn: DBConnection, city_id: int) -> list[Any]:
    """Return all vaccination points belonging to the specified city."""
    return conn.fetchall(
        """
        SELECT
          id,
          city_id,
          name,
          address,
          neighborhood,
          phone,
          opening_hours,
          vaccines,
          latitude,
          longitude
        FROM vaccination_points
        WHERE city_id = ?
        ORDER BY id ASC
        """,
        (city_id,),
    )


def get_by_id(conn: DBConnection, point_id: int) -> Any:
    """Return a single vaccination point by id or None."""
    return conn.fetchone(
        """
        SELECT
          id,
          city_id,
          name,
          address,
          neighborhood,
          phone,
          opening_hours,
          vaccines,
          latitude,
          longitude
        FROM vaccination_points
        WHERE id = ?
        """,
        (point_id,),
    )


def create_point(
    conn: DBConnection,
    *,
    city_id: int,
    name: str,
    address: str | None,
    neighborhood: str | None,
    phone: str | None,
    opening_hours: str | None,
    vaccines: str | None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> int:
    """Insert a new vaccination point and return its generated id."""
    new_id = conn.insert_returning_id(
        """
        INSERT INTO vaccination_points
          (city_id, name, address, neighborhood, phone, opening_hours, vaccines, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            city_id,
            name,
            address,
            neighborhood,
            phone,
            opening_hours,
            vaccines,
            latitude,
            longitude,
        ),
    )
    conn.commit()
    return new_id


def update_point(
    conn: DBConnection,
    point_id: int,
    *,
    city_id: int,
    name: str,
    address: str | None,
    neighborhood: str | None,
    phone: str | None,
    opening_hours: str | None,
    vaccines: str | None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> bool:
    """Update an existing vaccination point. Returns True if a row was updated."""
    updated = conn.execute(
        """
        UPDATE vaccination_points
        SET city_id = ?,
            name = ?,
            address = ?,
            neighborhood = ?,
            phone = ?,
            opening_hours = ?,
            vaccines = ?,
            latitude = ?,
            longitude = ?
        WHERE id = ?
        """,
        (
            city_id,
            name,
            address,
            neighborhood,
            phone,
            opening_hours,
            vaccines,
            latitude,
            longitude,
            point_id,
        ),
    )
    conn.commit()
    return updated > 0


def delete_point(conn: DBConnection, point_id: int) -> bool:
    """Delete a vaccination point by id. Returns True if a row was deleted."""
    deleted = conn.execute("DELETE FROM vaccination_points WHERE id = ?", (point_id,))
    conn.commit()
    return deleted > 0
