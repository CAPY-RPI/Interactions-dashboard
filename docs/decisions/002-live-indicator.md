# [002] Live Indicator in Dashboard Header

**Date:** 2026-04-17
**Status:** `proposed`
**Author:** Jonathan Green

---

## Context

The dashboard polls every 2 seconds for fresh data (`Dashboard.jsx` — `setInterval` in a `useEffect`). Nothing in the UI currently communicates this to the viewer. A user looking at the dashboard has no way to know whether:

- The data is live and refreshing correctly
- The backend is unreachable and they're looking at stale data
- The last refresh happened 2 seconds ago or 2 minutes ago

This is a trust and usability gap — especially for anyone monitoring the dashboard during an active bot session. A small live indicator in the header resolves this without adding complexity to the data model or API.

---

## Decision

Add a live indicator to the `Header` component consisting of:

1. **A pulse dot** — green when refreshes are succeeding, amber when the last refresh failed (the dashboard already silently preserves stale data on error)
2. **A "last updated" timestamp** — e.g. `updated 2s ago`, incrementing in real time via a 1s `setInterval` in `Header`

`Dashboard.jsx` tracks a `lastUpdated` timestamp (set on every successful fetch) and a `fetchError` boolean (set on failure, cleared on recovery). Both are passed as props to `Header`.

---

## Alternatives Considered

### Option A: Toast / banner on fetch failure only
- **What it is:** Show nothing during normal operation; flash a banner when a fetch fails.
- **Why rejected:** Doesn't give the viewer confidence that the dashboard is actively refreshing during normal operation. A passive indicator that's always visible is more useful for a monitoring tool.

### Option B: Animate the existing refresh interval (spinner)
- **What it is:** Show a small spinner in the header that spins every 2 seconds to indicate a poll is in progress.
- **Why rejected:** Spinners communicate "loading" rather than "healthy." A pulse dot + timestamp is a more standard observability UI pattern and conveys both liveness and last-known-good time.

### Option C: WebSocket instead of polling
- **What it is:** Replace the 2s poll with a WebSocket connection; the indicator shows connection state.
- **Why rejected:** Over-engineered for this project's scale. Polling every 2s is fine, and introducing WebSockets adds significant backend complexity for minimal gain.

---

## Tradeoffs

| What we gain | What we give up |
|---|---|
| Viewer can immediately tell if the dashboard is live | Minor additional prop threading (`lastUpdated`, `fetchError`) through Dashboard → Header |
| Amber indicator surfaces backend connectivity issues passively | One more `setInterval` in the frontend (low cost, but worth noting) |
| Standard observability UI pattern — familiar to anyone who's used Grafana/Datadog | None significant |

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/Dashboard.jsx` | Track `lastUpdated` (Date) and `fetchError` (bool) state; set on each fetch cycle; pass to `Header` |
| `frontend/src/components/Header.jsx` | Accept `lastUpdated` and `fetchError` props; render pulse dot + "updated Xs ago" label |

No backend changes. No new API endpoints. No model changes. No mock data changes.

---

## Implementation Notes

- `lastUpdated` is a `Date` object set to `new Date()` after every successful parallel fetch resolves in `Dashboard.jsx`. It starts as `null` (no fetch has completed yet) — `Header` renders "connecting..." in this state.
- `fetchError` is set to `true` if any fetch in the refresh cycle throws. It is cleared back to `false` on the next successful cycle. Silent failure on refresh is existing behavior (stale data is preserved) — the indicator just makes it visible.
- The "Xs ago" label is computed inside `Header` using its own 1s `setInterval` against `lastUpdated`. This avoids re-rendering the entire dashboard every second just to update a label.
- Pulse animation is a standard Tailwind `animate-pulse` on a small `rounded-full` div. Green = `bg-[#10b981]`, amber = `bg-[#f59e0b]`, grey = `bg-[#64748b]` (connecting).
- If `lastUpdated` is more than 10 seconds old (e.g. the tab was backgrounded and the poll fell behind), the dot goes amber even if the last fetch technically succeeded.

---

## Follow-up / Open Questions

- [ ] Should the indicator go red (not just amber) if multiple consecutive fetches fail? Could add a failure count, but may be overkill.
- [ ] Consider adding `lastUpdated` to the page `<title>` for users who keep the tab in the background — e.g. `CAPY Dashboard • updated 3s ago`.

---

## References

- `frontend/src/pages/Dashboard.jsx` — existing fetch cycle and silent-failure pattern
- `frontend/src/components/Header.jsx` — where the indicator will live
- [001] Command Interaction Type Breakdown Dropdown — prior doc, same template
