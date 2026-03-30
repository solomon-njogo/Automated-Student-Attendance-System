from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory

from attendance_logic import AttendanceStatus, compute_attendance_summary

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "db" / "attendance.db"


@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Automated Student Attendance System API is running."})


@app.route("/ui/", methods=["GET"])
def ui():
    return send_from_directory(BASE_DIR, "index.html")


@app.errorhandler(FileNotFoundError)
def handle_file_not_found(err: FileNotFoundError):
    return _json_error(str(err), status_code=500)


@app.errorhandler(sqlite3.OperationalError)
def handle_sqlite_operational_error(err: sqlite3.OperationalError):
    # Common cases: missing table, missing column, malformed query.
    msg = str(err)
    if "no such table" in msg.lower():
        return _json_error(
            f"Database schema mismatch: {msg}. Ensure db/attendance.db was initialized with db/schemas/schema.sql.",
            status_code=500,
        )
    return _json_error(f"Database error: {msg}", status_code=500)


def _db_connect() -> sqlite3.Connection:
    if not DB_PATH.is_file():
        raise FileNotFoundError(
            f"SQLite database not found at {DB_PATH}. Initialize it with: py db\\init_db.py"
        )
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def _json_error(message: str, *, status_code: int = 400):
    return jsonify({"error": message}), status_code


def _require_json() -> dict[str, Any] | tuple[Any, int]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return _json_error("Expected JSON object body.", status_code=400)
    return data


@app.route("/db/health", methods=["GET"])
def db_health():
    required_tables = ["students", "sessions", "attendance_records"]
    with _db_connect() as conn:
        table_rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
        ).fetchall()
        existing = {r["name"] for r in table_rows}
        missing = [t for t in required_tables if t not in existing]

        counts: dict[str, int] = {}
        for t in required_tables:
            if t in existing:
                counts[t] = int(conn.execute(f"SELECT COUNT(*) AS c FROM {t}").fetchone()["c"])

    return jsonify(
        {
            "db_path": str(DB_PATH),
            "ok": len(missing) == 0,
            "required_tables": required_tables,
            "missing_tables": missing,
            "counts": counts,
        }
    )


@app.route("/students", methods=["GET"])
def list_students():
    with _db_connect() as conn:
        rows = conn.execute(
            "SELECT id, reg_number, full_name, created_at FROM students ORDER BY id DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/students", methods=["POST"])
def create_student():
    data = _require_json()
    if isinstance(data, tuple):
        return data

    reg_number = str(data.get("reg_number", "")).strip()
    full_name = str(data.get("full_name", "")).strip()
    if not reg_number or not full_name:
        return _json_error("Both 'reg_number' and 'full_name' are required.", status_code=400)

    try:
        with _db_connect() as conn:
            cur = conn.execute(
                "INSERT INTO students (reg_number, full_name) VALUES (?, ?)",
                (reg_number, full_name),
            )
            student_id = cur.lastrowid
    except sqlite3.IntegrityError as exc:
        return _json_error(f"Student already exists or invalid data: {exc}", status_code=409)

    return jsonify({"id": student_id, "reg_number": reg_number, "full_name": full_name}), 201


@app.route("/sessions", methods=["GET"])
def list_sessions():
    with _db_connect() as conn:
        rows = conn.execute(
            "SELECT id, session_date, created_at FROM sessions ORDER BY session_date DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


def _get_or_create_session_id(conn: sqlite3.Connection, session_date: str) -> int:
    row = conn.execute(
        "SELECT id FROM sessions WHERE session_date = ?",
        (session_date,),
    ).fetchone()
    if row:
        return int(row["id"])

    cur = conn.execute(
        "INSERT INTO sessions (session_date) VALUES (?)",
        (session_date,),
    )
    return int(cur.lastrowid)


@app.route("/sessions", methods=["POST"])
def create_session():
    data = _require_json()
    if isinstance(data, tuple):
        return data

    session_date = str(data.get("session_date", "")).strip()
    if not session_date:
        return _json_error("'session_date' is required (YYYY-MM-DD).", status_code=400)

    try:
        with _db_connect() as conn:
            session_id = _get_or_create_session_id(conn, session_date)
    except sqlite3.IntegrityError as exc:
        return _json_error(f"Could not create session: {exc}", status_code=409)

    return jsonify({"id": session_id, "session_date": session_date}), 201


@app.route("/attendance", methods=["POST"])
def upsert_attendance():
    """
    Record attendance for a student + session.

    Accepts either:
    - student_id + session_id + status
    OR
    - student_id + session_date + status  (auto-creates session if missing)
    """

    data = _require_json()
    if isinstance(data, tuple):
        return data

    try:
        student_id = int(data.get("student_id"))
    except (TypeError, ValueError):
        return _json_error("'student_id' must be an integer.", status_code=400)

    status_raw = str(data.get("status", "")).strip().upper()
    try:
        status = AttendanceStatus(status_raw)
    except ValueError:
        return _json_error(
            f"Invalid 'status'. Expected one of: {', '.join(s.value for s in AttendanceStatus)}",
            status_code=400,
        )

    session_id_val = data.get("session_id")
    session_date_val = data.get("session_date")
    if session_id_val is None and session_date_val is None:
        return _json_error("Provide either 'session_id' or 'session_date'.", status_code=400)

    try:
        with _db_connect() as conn:
            # Validate student exists
            srow = conn.execute("SELECT id FROM students WHERE id = ?", (student_id,)).fetchone()
            if not srow:
                return _json_error(f"Student {student_id} not found.", status_code=404)

            if session_id_val is not None:
                try:
                    session_id = int(session_id_val)
                except (TypeError, ValueError):
                    return _json_error("'session_id' must be an integer.", status_code=400)

                ses = conn.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)).fetchone()
                if not ses:
                    return _json_error(f"Session {session_id} not found.", status_code=404)
            else:
                session_date = str(session_date_val).strip()
                if not session_date:
                    return _json_error("'session_date' cannot be empty.", status_code=400)
                session_id = _get_or_create_session_id(conn, session_date)

            conn.execute(
                """
                INSERT INTO attendance_records (student_id, session_id, status)
                VALUES (?, ?, ?)
                ON CONFLICT(student_id, session_id) DO UPDATE SET status = excluded.status
                """,
                (student_id, session_id, status.value),
            )
    except sqlite3.IntegrityError as exc:
        return _json_error(f"Could not record attendance: {exc}", status_code=409)

    return jsonify({"student_id": student_id, "session_id": session_id, "status": status.value}), 200


@app.route("/students/<int:student_id>/attendance-records", methods=["GET"])
def student_attendance_records(student_id: int):
    with _db_connect() as conn:
        # Treat missing records as ABSENT by default.
        rows = conn.execute(
            """
            SELECT
              s.id AS session_id,
              s.session_date AS session_date,
              COALESCE(ar.status, 'ABSENT') AS status
            FROM sessions s
            LEFT JOIN attendance_records ar
              ON ar.session_id = s.id AND ar.student_id = ?
            ORDER BY s.session_date ASC
            """,
            (student_id,),
        ).fetchall()

    if not rows:
        # Either no sessions exist, or student doesn't exist. Prefer explicit student check.
        with _db_connect() as conn:
            exists = conn.execute("SELECT 1 FROM students WHERE id = ?", (student_id,)).fetchone()
        if not exists:
            return _json_error(f"Student {student_id} not found.", status_code=404)

    return jsonify([dict(r) for r in rows])


@app.route("/students/<int:student_id>/attendance-summary", methods=["GET"])
def student_attendance_summary(student_id: int):
    with _db_connect() as conn:
        # Validate student exists (so empty sessions doesn't look like a missing student).
        student = conn.execute(
            "SELECT id, reg_number, full_name FROM students WHERE id = ?", (student_id,)
        ).fetchone()
        if not student:
            return _json_error(f"Student {student_id} not found.", status_code=404)

        rows = conn.execute(
            """
            SELECT
              s.id AS session_id,
              s.session_date AS session_date,
              COALESCE(ar.status, 'ABSENT') AS status
            FROM sessions s
            LEFT JOIN attendance_records ar
              ON ar.session_id = s.id AND ar.student_id = ?
            ORDER BY s.session_date ASC
            """,
            (student_id,),
        ).fetchall()

    statuses = [r["status"] for r in rows]
    summary = compute_attendance_summary(statuses).as_dict
    return jsonify({"student": dict(student), "summary": summary, "sessions_counted": len(statuses)})


if __name__ == "__main__":
    app.run(debug=True)

