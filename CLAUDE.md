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
