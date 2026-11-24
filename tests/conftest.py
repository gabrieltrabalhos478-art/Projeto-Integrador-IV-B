import sqlite3
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.database import create_connection, get_db
from app.main import app
from scripts.seed import SCHEMA_SQL


@pytest.fixture()
def test_db_path(tmp_path: Path) -> Path:
    """Create a temporary SQLite database populated with deterministic test data."""
    db_file = tmp_path / "test_vaccination.db"
    conn = sqlite3.connect(str(db_file))
    try:
        conn.executescript(SCHEMA_SQL)
        conn.executemany(
            "INSERT INTO cities (id, name, ibge_code) VALUES (?, ?, ?)",
            [
                (1, "Maceió", 2704302),
                (2, "Arapiraca", 2700300),
            ],
        )
        conn.executemany(
            """
            INSERT INTO vaccination_points
              (id, city_id, name, address, neighborhood, phone, opening_hours, vaccines)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    10,
                    1,
                    "UBS Jacintinho",
                    "Rua Exemplo, 123",
                    "Jacintinho",
                    "(82) 3333-0000",
                    "08:00 - 17:00",
                    "BCG;Hepatite B",
                ),
                (
                    11,
                    1,
                    "UBS Benedito Bentes",
                    "Av. Principal, S/N",
                    "Benedito Bentes",
                    None,
                    None,
                    None,
                ),
            ],
        )
        conn.commit()
    finally:
        conn.close()
    return db_file


@pytest.fixture()
def client(test_db_path: Path) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient wired to the temporary SQLite database."""

    def override_get_db() -> Generator[sqlite3.Connection, None, None]:
        conn = create_connection(test_db_path)
        try:
            yield conn
        finally:
            conn.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
