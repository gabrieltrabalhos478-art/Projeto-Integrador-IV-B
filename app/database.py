import os
import sqlite3
from collections.abc import Generator
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def get_db_path() -> Path:
    """Resolve the SQLite database file path from DB_PATH or default to project root."""
    env_path = os.getenv("DB_PATH")
    if env_path:
        return Path(env_path)
    return BASE_DIR / "vaccination.db"


def create_connection(db_path: Path | None = None) -> sqlite3.Connection:
    """Open a configured SQLite connection with Row factory and foreign keys enabled."""
    target = db_path or get_db_path()
    conn = sqlite3.connect(str(target), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency that yields a per-request SQLite connection and closes it."""
    conn = create_connection()
    try:
        yield conn
    finally:
        conn.close()
