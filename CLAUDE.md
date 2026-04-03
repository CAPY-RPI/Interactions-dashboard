# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CAPY Interactions Dashboard — a full-stack telemetry/observability dashboard for the CAPY Discord bot. The Discord bot sends interaction events to the backend, which stores them in PostgreSQL and serves aggregated metrics to a React frontend.

## Commands

### Full Stack (Docker)
```bash
docker compose up --build   # Start all services (PostgreSQL, backend, frontend)
docker compose down         # Stop all services
```

### Backend (FastAPI)
```bash
cd backend
uv sync                     # Install dependencies
uv run task start           # Run dev server on :8000 (--reload)
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                 # Dev server on :5173 (proxies /api → localhost:8000)
npm run build               # Production build
```

## Architecture

**Data flow:** Discord bot → `POST /api/v1/telemetry/batch` → PostgreSQL → 7 GET endpoints → React dashboard (polls every 2s)

### Backend (`backend/dashboard/`)
- `main.py` — FastAPI app, CORS, mounts `telemetry` router at `/api/v1`, health check at `/health`
- `routers/telemetry.py` — All 8 endpoints: batch ingest (202), plus read endpoints for metrics, commands, timeseries, errors, interaction types, heatmap, recent events
- `database.py` — psycopg2 queries against `telemetry_interactions` and `telemetry_completions` tables; masks user IDs to last 4 digits
- `config.py` — Pydantic settings; `use_mock` env var toggles between real DB and mock data
- `mock_data.py` — Static fallback data used when `USE_MOCK=true`
- `models.py` — All Pydantic request/response models

### Frontend (`frontend/src/`)
- `pages/Dashboard.jsx` — Orchestrates all data fetching (7 parallel API calls), holds all state, manages the 2s auto-refresh interval; silent failure on refresh preserves stale data
- `api/telemetry.js` — Axios instance (baseURL `/api/v1`, 10s timeout); exports `fetchMetrics`, `fetchCommands`, `fetchTimeseries`, `fetchErrors`, `fetchInteractionTypes`, `fetchRecent`, `fetchHeatmap`
- `components/` — One component per chart/widget: `MetricCard`, `TimeSeriesChart`, `CommandTable`, `ErrorBreakdown`, `InteractionTypeChart`, `UsageHeatmap`, `ActivityFeed`, `Header`

### Infrastructure
- `docker-compose.yml` — Three services on `capy-net`: postgres (:5432), backend (:8000), frontend (:80 via Nginx)
- `init/02-grants.sql` — DB grants applied at container init
- `frontend/vite.config.js` — `/api` proxy to `http://localhost:8000` for local dev
- `frontend/tailwind.config.js` — Custom dark theme palette (primary `#0f1117`, card `#161b27`) and fonts (Inter, JetBrains Mono)

### Time Range Filtering
All read endpoints accept a `range` query param (`24h`, `7d`, `30d`). `Dashboard.jsx` holds a single `range` state that is passed to every fetch call and triggers a re-fetch on change.

### Mock Mode
Set `USE_MOCK=true` in `backend/.env` to bypass PostgreSQL entirely — the backend serves data from `mock_data.py`. Useful for frontend development without a running database.

## Design Docs (DDocs)

Design docs are short decision records that capture *why* a change was made, not just what changed.

### When to write one

Write a DDoc before coding if the change:
- Introduces a new abstraction or component
- Changes how existing components interact (e.g. new endpoint contract, new data model)
- Involves a real tradeoff between approaches
- Touches more than ~3 files meaningfully

For small bug fixes or trivial tweaks, a DDoc can be written retroactively (or skipped entirely if there's no meaningful decision to record).

### Where to store them

`docs/decisions/NNN-short-kebab-case-title.md` — increment `NNN` from the highest number that already exists in that directory. The first DDoc is `001`.

### How to write one

Use `docs/decisions/_TEMPLATE.md` as the base. Fill every section — don't omit any. The **Tradeoffs** and **Alternatives Considered** sections are the most valuable; if you only considered one approach, think harder before writing.

Set `Status: proposed` when drafting, `accepted` once the work is merged.

### Commit message convention

Reference the DDoc in the commit body:

```
feat: add caching layer

See docs/decisions/003-caching-layer.md for rationale.
```
