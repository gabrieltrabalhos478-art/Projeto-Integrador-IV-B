import sqlite3


def list_cities(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    """Return all cities ordered by id."""
    cursor = conn.execute(
        "SELECT id, name, ibge_code FROM cities ORDER BY id ASC"
    )
    return cursor.fetchall()


def get_city_by_id_with_count(
    conn: sqlite3.Connection, city_id: int
) -> sqlite3.Row | None:
    """Return a single city with its vaccination point count, or None if not found."""
    cursor = conn.execute(
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
    return cursor.fetchone()


def city_exists(conn: sqlite3.Connection, city_id: int) -> bool:
    """Check whether a city with the given id exists."""
    cursor = conn.execute("SELECT 1 FROM cities WHERE id = ?", (city_id,))
    return cursor.fetchone() is not None
