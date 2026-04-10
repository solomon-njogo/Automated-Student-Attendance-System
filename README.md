## Automated Student Attendance System

### Overview

The **Automated Student Attendance System** is a web application that records class attendance, applies rule-based policies (percentages, tiers, validity, escalation), and surfaces cohort and per-student analytics.

The backend is **Python**, **Flask**, and **SQLite**. The UI is a **React** single-page app built with **Vite** and **TypeScript**, served from `ui_dist` by Flask in production and proxied to the API during local Vite development.

**Live deployment (Render):** [https://automated-student-attendance-system-m8mw.onrender.com/](https://automated-student-attendance-system-m8mw.onrender.com/) — the same URL is configured in this repository’s GitHub **About** section (website link).

### Objectives

- **Model attendance policies** in code using clear, rule-based logic (`attendance_logic.py`).
- **Store and manage** student and attendance data in SQLite.
- **Evaluate** whether each student meets policy thresholds (raw vs adjusted %, tier, validity, escalation).
- **Expose** data through a JSON API under `/api` and a responsive web UI (dashboard, students, sessions, attendance).

### Tech stack

| Layer | Technologies |
|--------|----------------|
| Backend | Python 3, Flask |
| Database | SQLite (`db/attendance.db`) |
| Policy engine | Rule-based logic in `attendance_logic.py` |
| Frontend | React 19, TypeScript, Vite, React Router, Recharts |
| Local server | **Windows:** Waitress (via `run.py`). **Linux / Render:** Gunicorn (`gunicorn run:app`) |

On Windows, use `py` to run Python commands in the terminal.

### Project structure (high-level)

| Path | Role |
|------|------|
| `app.py` | Flask app: static SPA + `/api/*` routes |
| `run.py` | Builds the frontend, then starts the server; exposes `app` for Gunicorn |
| `attendance_logic.py` | Attendance summaries, tiers, validity, escalation |
| `requirements.txt` | Python dependencies |
| `render.yaml` | Example Render.com web service (build + start) |
| `db/attendance.db` | SQLite database (created after init) |
| `db/schemas/schema.sql` | Schema |
| `db/init_db.py` | Create / migrate the database |
| `frontend/` | Vite + React source (`npm run dev`, `npm run build`) |
| `ui_dist/` | Production build output (consumed by Flask) |

### Setup and installation

#### 1. Prerequisites

- Python 3.x (`py` on Windows)
- **Node.js** (includes `npm`) — required to build the UI (`run.py` runs `npm run build` in `frontend/`)

#### 2. Clone the repository

```bash
git clone https://github.com/solomon-njogo/Automated-Student-Attendance-System
cd Automated-Student-Attendance-System
```

#### 3. Create and activate a virtual environment

```bash
py -m venv venv
```

Windows (cmd): `venv\Scripts\activate`  
Git Bash / Unix-like: `source venv/Scripts/activate`

#### 4. Install Python dependencies

```bash
py -m pip install -r requirements.txt
```

#### 5. Install frontend dependencies

```bash
npm ci --prefix frontend
```

(Use `npm install --prefix frontend` if you do not rely on a lockfile workflow.)

#### 6. Initialize the database

Creates `db/attendance.db` and applies `db/schemas/schema.sql`:

```bash
py db/init_db.py
```

### Running the application

#### Recommended: one command (build UI + serve)

```bash
py run.py
```

- Builds the SPA into `ui_dist`, then starts the server.
- Default URL: `http://127.0.0.1:5000/` (UI at `/`, API under `/api/`).
- **Optional env vars:** `PORT`, `HOST` (default bind `0.0.0.0`), `AUTO_RELOAD=1` (Flask debug + reloader), `UI_WATCH=1` with `AUTO_RELOAD=1` (Vite `build --watch` for `ui_dist`).

On Windows, `run.py` uses **Waitress**. On non-Windows without auto-reload, it uses Flask’s built-in server.

#### Backend only (UI must already be built)

If `ui_dist` is up to date:

```bash
py app.py
```

If `ui_dist/index.html` is missing, `/` returns a short JSON message; the API still works at `/api`.

#### Frontend dev server (hot reload) + API

Terminal 1 — API on port 5000:

```bash
py app.py
```

Terminal 2 — Vite (proxies `/api` to Flask):

```bash
npm run dev --prefix frontend
```

Open the URL Vite prints (typically `http://127.0.0.1:5173`). API calls go to `/api/...` via the proxy.

### API quick test (`curl`)

All JSON routes are under **`/api`**. Examples assume the server on `http://127.0.0.1:5000`.

```bash
# Database health
curl http://127.0.0.1:5000/api/db/health

# Dashboard aggregates
curl http://127.0.0.1:5000/api/dashboard/overview

# Create a student
curl -X POST http://127.0.0.1:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"reg_number":"ICT/123/2026","full_name":"Jane Doe"}'

# Create a session by date
curl -X POST http://127.0.0.1:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"session_date":"2026-03-18"}'

# Record attendance (session_date auto-creates session if missing)
curl -X POST http://127.0.0.1:5000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"session_date":"2026-03-18","status":"PRESENT"}'

# Per-student summary (raw + adjusted %, tier, validity, escalation)
curl http://127.0.0.1:5000/api/students/1/attendance-summary
```

Other useful endpoints: `GET /api/students`, `GET /api/sessions`, `GET /api/sessions/<id>/attendance`, `GET /api/students/<id>/attendance-records`, `POST /api/attendance/bulk`.

### Features (current)

- **Students:** list, create, per-student attendance history and policy summary.
- **Sessions:** list, create, per-session roster with statuses (missing rows treated as absent where documented in code).
- **Attendance:** single and bulk upsert (`PRESENT` / `ABSENT` / `EXCUSED`).
- **Dashboard:** cohort overview (charts / aggregates via `/api/dashboard/overview`).
- **SPA UI:** client-side routes (e.g. student detail) with Flask fallback to `index.html`.

### Attendance policies implemented (Week 1)

Implemented in `attendance_logic.py` from the Week 1 policy research.

- **Attendance % (raw)** — `(PRESENT / TOTAL) * 100` over all recorded sessions (present + absent + excused).
- **Attendance % (adjusted)** — `(PRESENT / (TOTAL - EXCUSED)) * 100`; excused sessions are excluded from the denominator. **Adjusted %** drives tier, validity, and escalation; raw % is still returned for transparency.

#### Tier thresholds (adjusted %)

- **91%–100%**: Excellent  
- **75%–90%**: Satisfactory  
- **60%–74%**: Low / At Risk  
- **50%–59%**: Critical  
- **Below 50%**: Fail / Barred  

#### Validity mapping (adjusted %)

- **≥ 75%**: Valid  
- **60%–74%**: At Risk  
- **< 60%**: Invalid / Barred  

#### Notification / escalation triggers (adjusted %)

- **< 85% and ≥ 75%**: Early Warning  
- **< 75%**: Academic Alert  
- **< 65%**: Formal Intervention  
- **< 50%**: Critical - Barred  

### Database schema (summary)

- **students** — `id`, `reg_number` (unique), `full_name`, `created_at`  
- **sessions** — `id`, `session_date` (unique), `created_at`  
- **attendance_records** — `id`, `student_id` (FK), `session_id` (FK), `status` (`PRESENT` | `ABSENT` | `EXCUSED`), `created_at`, unique (`student_id`, `session_id`)  

Full DDL: `db/schemas/schema.sql`.

### Deployment (Render)

The app is hosted on **[Render](https://render.com)**.

| | |
|--|--|
| **Live URL** | [https://automated-student-attendance-system-m8mw.onrender.com/](https://automated-student-attendance-system-m8mw.onrender.com/) |
| **GitHub** | The live link is also available from the repository **About** section (website field). |

`render.yaml` defines the **Python** web service: install Python deps, `npm ci` + `npm run build` in `frontend/`, then start with:

`gunicorn run:app --bind 0.0.0.0:$PORT`

Adjust the service name or plan in the YAML as needed.

### Course milestones (original plan)

- **Week 1:** Attendance policy research → rules in code.  
- **Week 2:** SQLite schema and initialization.  
- **Week 3:** Attendance logic and Flask API.  
- **Week 4:** Testing with mock / sample data.  
- **Week 5:** Demo, documentation, presentation.  

The codebase now includes the API, policy engine, and a React UI on top of these foundations.

### Future improvements

- Authentication for students and lecturers  
- Multiple courses and sections  
- Export reports (PDF/CSV)  
- Integration with institutional systems (LMS, portals)  

This project is part of **APT3020** coursework (**group work**), demonstrating rule-based systems applied to academic attendance policies.

### Group members

1. Solomon Njogo  
2. Ted Mbatia  
3. Shawn Njoroge  
