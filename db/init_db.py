import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "attendance.db"
SCHEMA_PATH = BASE_DIR / "schemas" / "schema.sql"


def init_db() -> None:
    """Initialize the SQLite database using the schema.sql file."""
    if not SCHEMA_PATH.is_file():
        raise FileNotFoundError(f"Schema file not found at {SCHEMA_PATH}")

    connection = sqlite3.connect(DB_PATH)
    try:
        # Ensure foreign key support is enabled for this connection.
        connection.execute("PRAGMA foreign_keys = ON;")
        with SCHEMA_PATH.open("r", encoding="utf-8") as schema_file:
            schema_sql = schema_file.read()
            connection.executescript(schema_sql)
        connection.commit()
        print(f"Database initialized at {DB_PATH}")
    finally:
        connection.close()


if __name__ == "__main__":
    init_db()

