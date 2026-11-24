import os
import sqlite3
from collections.abc import Generator
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row

BASE_DIR = Path(__file__).resolve().parent.parent


def get_database_url() -> str | None:
    """Return normalized PostgreSQL/Supabase URL if configured."""
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    url = url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    return url


def get_db_path() -> Path:
    """Resolve the SQLite database file path from DB_PATH or default to project root."""
    env_path = os.getenv("DB_PATH")
    if env_path:
        return Path(env_path)
    return BASE_DIR / "vaccination.db"


class DBConnection:
    """Unified database connection wrapper supporting SQLite and PostgreSQL (Supabase)."""

    def __init__(self, conn: Any, is_postgres: bool) -> None:
        self._conn = conn
        self.is_postgres = is_postgres

    def _adapt_sql(self, sql: str) -> str:
        if self.is_postgres:
            return sql.replace("?", "%s")
        return sql

    def fetchone(self, sql: str, params: tuple[Any, ...] = ()) -> Any:
        adapted = self._adapt_sql(sql)
        if self.is_postgres:
            with self._conn.cursor() as cur:
                cur.execute(adapted, params)
                return cur.fetchone()
        return self._conn.execute(adapted, params).fetchone()

    def fetchall(self, sql: str, params: tuple[Any, ...] = ()) -> list[Any]:
        adapted = self._adapt_sql(sql)
        if self.is_postgres:
            with self._conn.cursor() as cur:
                cur.execute(adapted, params)
                return cur.fetchall()
        return self._conn.execute(adapted, params).fetchall()

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> int:
        adapted = self._adapt_sql(sql)
        if self.is_postgres:
            with self._conn.cursor() as cur:
                cur.execute(adapted, params)
                return cur.rowcount
        cur = self._conn.execute(adapted, params)
        return cur.rowcount

    def insert_returning_id(self, sql: str, params: tuple[Any, ...] = ()) -> int:
        adapted = self._adapt_sql(sql)
        if self.is_postgres:
            with self._conn.cursor() as cur:
                cur.execute(f"{adapted} RETURNING id", params)
                row = cur.fetchone()
                return int(row["id"])
        cur = self._conn.execute(adapted, params)
        return int(cur.lastrowid)

    def executemany(self, sql: str, seq_of_params: list[tuple[Any, ...]]) -> None:
        adapted = self._adapt_sql(sql)
        if self.is_postgres:
            with self._conn.cursor() as cur:
                cur.executemany(adapted, seq_of_params)
            return
        self._conn.executemany(adapted, seq_of_params)

    def executescript(self, sql: str) -> None:
        if self.is_postgres:
            with self._conn.cursor() as cur:
                cur.execute(sql)
            return
        self._conn.executescript(sql)

    def commit(self) -> None:
        self._conn.commit()

    def close(self) -> None:
        self._conn.close()


def create_connection(db_path: Path | None = None) -> DBConnection:
    """Open a configured PostgreSQL (if DATABASE_URL is set) or SQLite connection."""
    database_url = get_database_url()
    if database_url and db_path is None:
        pg_conn = psycopg.connect(database_url, row_factory=dict_row)
        return DBConnection(pg_conn, is_postgres=True)

    target = db_path or get_db_path()
    sq_conn = sqlite3.connect(str(target), check_same_thread=False)
    sq_conn.row_factory = sqlite3.Row
    sq_conn.execute("PRAGMA foreign_keys = ON;")
    return DBConnection(sq_conn, is_postgres=False)


def get_db() -> Generator[DBConnection, None, None]:
    """FastAPI dependency that yields a per-request DB connection and closes it."""
    conn = create_connection()
    try:
        yield conn
    finally:
        conn.close()
