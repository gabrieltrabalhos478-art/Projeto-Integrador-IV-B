import csv
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database import create_connection, get_database_url, get_db_path  # noqa: E402

DATA_DIR = BASE_DIR / "data"

SCHEMA_SQL_SQLITE = """
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS vaccination_points;
DROP TABLE IF EXISTS cities;
PRAGMA foreign_keys = ON;

CREATE TABLE cities (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  ibge_code  INTEGER NOT NULL UNIQUE
);

CREATE TABLE vaccination_points (
  id            INTEGER PRIMARY KEY,
  city_id       INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT,
  neighborhood  TEXT,
  phone         TEXT,
  opening_hours TEXT,
  vaccines      TEXT
);

CREATE INDEX idx_points_city ON vaccination_points(city_id);
"""

# Mantido para compatibilidade com tests/conftest.py
SCHEMA_SQL = SCHEMA_SQL_SQLITE

SCHEMA_SQL_POSTGRES = """
DROP TABLE IF EXISTS vaccination_points;
DROP TABLE IF EXISTS cities;

CREATE TABLE cities (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  ibge_code  INTEGER NOT NULL UNIQUE
);

CREATE TABLE vaccination_points (
  id            SERIAL PRIMARY KEY,
  city_id       INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT,
  neighborhood  TEXT,
  phone         TEXT,
  opening_hours TEXT,
  vaccines      TEXT
);

CREATE INDEX idx_points_city ON vaccination_points(city_id);
"""


def empty_to_none(value: str) -> str | None:
    """Convert empty CSV strings to SQL NULL."""
    cleaned = value.strip()
    return cleaned if cleaned else None


def seed_database(db_path: Path | None = None) -> None:
    """Recreate the database (SQLite or PostgreSQL/Supabase) from versioned CSV files."""
    cities_csv = DATA_DIR / "cities.csv"
    points_csv = DATA_DIR / "vaccination_points.csv"

    if not cities_csv.exists() or not points_csv.exists():
        raise FileNotFoundError(
            "Arquivos data/cities.csv e data/vaccination_points.csv são obrigatórios."
        )

    conn = create_connection(db_path)
    try:
        schema = SCHEMA_SQL_POSTGRES if conn.is_postgres else SCHEMA_SQL_SQLITE
        conn.executescript(schema)

        with cities_csv.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            cities_rows = [
                (int(row["id"]), row["name"].strip(), int(row["ibge_code"]))
                for row in reader
            ]
        conn.executemany(
            "INSERT INTO cities (id, name, ibge_code) VALUES (?, ?, ?)",
            cities_rows,
        )

        with points_csv.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            points_rows = [
                (
                    int(row["id"]),
                    int(row["city_id"]),
                    row["name"].strip(),
                    empty_to_none(row["address"]),
                    empty_to_none(row["neighborhood"]),
                    empty_to_none(row["phone"]),
                    empty_to_none(row["opening_hours"]),
                    empty_to_none(row["vaccines"]),
                )
                for row in reader
            ]
        conn.executemany(
            """
            INSERT INTO vaccination_points
              (id, city_id, name, address, neighborhood, phone, opening_hours, vaccines)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            points_rows,
        )

        if conn.is_postgres:
            conn.execute(
                "SELECT setval(pg_get_serial_sequence('cities', 'id'), COALESCE((SELECT MAX(id) FROM cities), 1))"
            )
            conn.execute(
                "SELECT setval(pg_get_serial_sequence('vaccination_points', 'id'), COALESCE((SELECT MAX(id) FROM vaccination_points), 1))"
            )

        conn.commit()

        city_count = conn.fetchone("SELECT COUNT(*) AS total FROM cities")["total"]
        point_count = conn.fetchone(
            "SELECT COUNT(*) AS total FROM vaccination_points"
        )["total"]
        top5 = conn.fetchall(
            """
            SELECT c.name, COUNT(vp.id) AS total
            FROM cities c
            LEFT JOIN vaccination_points vp ON vp.city_id = c.id
            GROUP BY c.id, c.name
            ORDER BY total DESC, c.name ASC
            LIMIT 5
            """
        )

        target_label = "PostgreSQL/Supabase" if conn.is_postgres else str(db_path or get_db_path())
        print(f"Banco recriado em: {target_label}")
        print(f"Cidades inseridas: {city_count}")
        print(f"Pontos de vacinação inseridos: {point_count}")
        print("Top 5 cidades com mais pontos:")
        for row in top5:
            print(f"  - {row['name']}: {row['total']}")
    finally:
        conn.close()


if __name__ == "__main__":
    if get_database_url():
        seed_database()
    else:
        seed_database(get_db_path())
