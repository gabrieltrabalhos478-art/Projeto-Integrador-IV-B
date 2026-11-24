import sqlite3


def list_by_city_id(conn: sqlite3.Connection, city_id: int) -> list[sqlite3.Row]:
    """Return all vaccination points belonging to the specified city."""
    cursor = conn.execute(
        """
        SELECT
          id,
          city_id,
          name,
          address,
          neighborhood,
          phone,
          opening_hours,
          vaccines
        FROM vaccination_points
        WHERE city_id = ?
        ORDER BY id ASC
        """,
        (city_id,),
    )
    return cursor.fetchall()
