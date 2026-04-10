# [001] Command Interaction Type Breakdown Dropdown

**Date:** 2026-04-02
**Status:** `accepted`
**Author:** Jonathan Green

---

## Context

The CommandTable shows each slash command as a flat row with aggregate stats (invocations, latency, success rate). When a slash command triggers a button or modal interaction — for example, `/event` opening a modal form — those follow-on interactions get stored under the same `command_name` in `telemetry_interactions` but appear only in the global InteractionTypeChart as undifferentiated "button" and "modal" counts.

This means there's no way to tell from the dashboard which commands are driving button/modal activity, or whether a command's invocation count is dominated by its initial slash call vs. its follow-on UI interactions. The per-command row is blind to its own interaction composition.

---

## Decision

Group sub-interactions (button, modal) under their parent slash command in the Recent Activity feed. Slash command rows that have associated sub-interactions become expandable: clicking them reveals the related button/modal events inline. The grouping is done in the backend when building the `/recent` response — button/modal events with a matching `command_name` are attached as `sub_interactions` on the slash command row and removed from the top-level list. The `RecentEvent` model gains an optional `sub_interactions` field.

---

## Alternatives Considered

### Option A: Expandable rows in the CommandTable (implemented then reverted)
- **What it is:** Each command row in the aggregate CommandTable gets a chevron; expanding it fetches and shows the interaction type breakdown (slash/button/modal counts) for that command via a new `/commands/{name}/breakdown` endpoint.
- **Why rejected:** The CommandTable shows aggregate stats across the entire time range — it already answers "how many times was `/event` used overall." What was missing was seeing the *event-level* grouping: which specific invocations triggered follow-on buttons/modals. The activity feed is the right place for that because it surfaces individual events in chronological order.

### Option B: Client-side grouping in ActivityFeed
- **What it is:** Frontend receives the flat 50-event list and groups button/modal events under their nearest slash command with the same `command_name`.
- **Why rejected:** The flat list is ordered newest-first, so a button event (index 2) precedes the slash command that triggered it (index 8). Client-side grouping would require a reverse-scan with time-proximity heuristics. Doing this in the backend is simpler and keeps the frontend dumb.

### Option C: Separate endpoint for grouped recent events
- **What it is:** Add a new `GET /recent/grouped` endpoint instead of modifying `/recent`.
- **Why rejected:** No existing consumer of `/recent` needs the flat list for a specific purpose — the only use is the ActivityFeed. Changing the existing endpoint avoids a parallel route and keeps the API surface minimal.

---

## Tradeoffs

| What we gain | What we give up |
|---|---|
| Activity feed reads as a command session log, not a raw event stream | `/recent` response shape changes (additive, but a breaking change for any external consumer) |
| No extra network requests — grouping happens at fetch time | Button/modal events without a matching slash command in the current 50-row window appear ungrouped |
| Slash commands with no sub-interactions remain flat rows (no chevron) | Grouping is by command_name only — can't distinguish two concurrent users running the same command |

---

## Files Changed

| File | Change |
|---|---|
| `backend/dashboard/models.py` | Added `sub_interactions: list[RecentEvent]` optional field to `RecentEvent` |
| `backend/dashboard/database.py` | Updated `get_recent()` to group button/modal events under their parent slash command |
| `backend/dashboard/mock_data.py` | Updated `get_recent()` to apply the same grouping logic |
| `frontend/src/components/ActivityFeed.jsx` | Expandable rows for slash command events that have sub_interactions |
| `backend/dashboard/routers/telemetry.py` | Retains the `/commands/{command_name}/breakdown` endpoint added during the first attempt (no harm keeping it) |
| `backend/dashboard/database.py` | Retains `get_command_breakdown()` added during the first attempt |
| `backend/dashboard/mock_data.py` | Retains `get_command_breakdown()` added during the first attempt |
| `frontend/src/api/telemetry.js` | Retains `fetchCommandBreakdown()` added during the first attempt |
| `frontend/src/components/CommandTable.jsx` | Reverted to original flat-row design |
| `frontend/src/pages/Dashboard.jsx` | Reverted `range` prop on CommandTable (no longer needed there) |

---

## Implementation Notes

- `RecentEvent.sub_interactions` defaults to `[]`, so the field is additive and won't break the response schema for events that have no sub-interactions.
- The bot sends `command_name: null` on all button and modal interaction events (`discord-bot/capy_discord/exts/core/telemetry.py` — `_get_command_name()` returns `None` for non-slash interactions). Grouping by `command_name` is therefore not possible with real data.
- Grouping uses **time proximity**: a button/modal event that occurs within 10 minutes after a slash command is treated as a sub-interaction of that slash command. This matches the real Discord UX where follow-on interactions happen seconds to minutes after the triggering slash command.
- All grouping happens client-side in `groupEvents()` inside `ActivityFeed.jsx`. The backend returns a plain flat list — no model changes needed.
- Slash command rows with no sub-interactions render as flat rows (no chevron). Chevron only appears when `subs.length > 0`.
- Sub-rows are indented, darkened, and prefixed with `└` to visually convey hierarchy.

---

## Follow-up / Open Questions

- [x] **Percentages vs raw counts** — Use raw counts, consistent with the rest of the dashboard.
- [x] **Zero button/modal sub-interactions** — No chevron rendered. Commands with only slash_command interactions execute on their own and have nothing to expand.
- [x] **Cache invalidation on range change** — Clear `breakdownCache` whenever `range` changes in `Dashboard.jsx` so re-expanding a row fetches fresh data for the new time window.

---

## References

- `backend/dashboard/mock_data.py:64` — how command names are assigned to non-slash interactions in mock data
- `backend/dashboard/database.py:150` — existing `get_commands` query pattern this builds on
- `frontend/src/components/InteractionTypeChart.jsx` — color palette for type labels (purple, blue, teal) to keep visual consistency
