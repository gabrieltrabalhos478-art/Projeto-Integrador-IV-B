import csv
import sqlite3
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database import get_db_path  # noqa: E402

DATA_DIR = BASE_DIR / "data"

SCHEMA_SQL = """
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
  city_id       INTEGER NOT NULL REFERENCES cities(id),
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
    """Recreate the SQLite database from versioned CSV files in data/."""
    target_db = db_path or get_db_path()
    cities_csv = DATA_DIR / "cities.csv"
    points_csv = DATA_DIR / "vaccination_points.csv"

    if not cities_csv.exists() or not points_csv.exists():
        raise FileNotFoundError(
            "Arquivos data/cities.csv e data/vaccination_points.csv são obrigatórios."
        )

    conn = sqlite3.connect(str(target_db))
    try:
        conn.executescript(SCHEMA_SQL)

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
        conn.commit()

        city_count = conn.execute("SELECT COUNT(*) FROM cities").fetchone()[0]
        point_count = conn.execute(
            "SELECT COUNT(*) FROM vaccination_points"
        ).fetchone()[0]
        top5 = conn.execute(
            """
            SELECT c.name, COUNT(vp.id) AS total
            FROM cities c
            LEFT JOIN vaccination_points vp ON vp.city_id = c.id
            GROUP BY c.id
            ORDER BY total DESC, c.name ASC
            LIMIT 5
            """
        ).fetchall()

        print(f"Banco recriado em: {target_db}")
        print(f"Cidades inseridas: {city_count}")
        print(f"Pontos de vacinação inseridos: {point_count}")
        print("Top 5 cidades com mais pontos:")
        for name, total in top5:
            print(f"  - {name}: {total}")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()
