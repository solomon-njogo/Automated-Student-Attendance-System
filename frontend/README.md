# Attendance system — frontend

React + TypeScript UI for the **Automated Student Attendance System**. It talks to the Flask API at `/api/*`.

## Stack

- React 19, React Router 7, Vite 8
- Recharts (dashboard charts)
- ESLint 9 + TypeScript ESLint

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (HMR). Proxies `/api` to `http://127.0.0.1:5000` — run the Flask app from the repo root first. |
| `npm run build` | Typecheck + production build into **`../ui_dist`** (Flask serves this folder). |
| `npm run preview` | Local preview of the production build. |
| `npm run lint` | ESLint. |

## Local development

1. From the **repository root**: create the DB if needed (`py db/init_db.py`), install Python deps, then start the API, e.g. `py app.py` (port **5000**).
2. From **this folder**: `npm ci` (or `npm install`), then `npm run dev`.
3. Open the URL Vite prints (usually `http://127.0.0.1:5173`). Browser requests to `/api/...` are forwarded to Flask.

Production-style runs use `py run.py` at the repo root (builds this app, then serves with Flask).

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/students` | Student list |
| `/students/new` | Create student |
| `/students/:studentId` | Student detail + attendance summary |
| `/sessions` | Session list |
| `/sessions/new` | Create session |
| `/sessions/:sessionId` | Session roster / attendance for that day |
| `/attendance` | Record attendance (bulk-friendly flow) |

## Source layout

- `src/App.tsx` — route table
- `src/main.tsx` — entry, `BrowserRouter`
- `src/components/` — layout (`LayoutShell`), cards, form fields, empty states
- `src/pages/` — feature screens
- `src/api/client.ts` — `fetch` wrappers for `/api`
- `src/api/types.ts` — shared API response types

## Build output

`vite.config.ts` sets `build.outDir` to `../ui_dist` and `emptyOutDir: true` so Flask can serve a single SPA bundle from the monorepo root.
