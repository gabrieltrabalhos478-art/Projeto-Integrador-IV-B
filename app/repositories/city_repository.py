from typing import Any

from app.database import DBConnection


def list_cities(conn: DBConnection) -> list[Any]:
    """Return all cities ordered by id."""
    return conn.fetchall("SELECT id, name, ibge_code FROM cities ORDER BY id ASC")


def get_city_by_id_with_count(conn: DBConnection, city_id: int) -> Any:
    """Return a single city with its vaccination point count, or None if not found."""
    return conn.fetchone(
        """
        SELECT
          c.id,
          c.name,
          c.ibge_code,
          COUNT(vp.id) AS vaccination_points_count
        FROM cities c
        LEFT JOIN vaccination_points vp ON vp.city_id = c.id
        WHERE c.id = ?
        GROUP BY c.id
        """,
        (city_id,),
    )


def city_exists(conn: DBConnection, city_id: int) -> bool:
    """Check whether a city with the given id exists."""
    return conn.fetchone("SELECT 1 FROM cities WHERE id = ?", (city_id,)) is not None
