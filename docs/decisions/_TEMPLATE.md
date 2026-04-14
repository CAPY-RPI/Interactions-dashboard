# [NNN] Title of Feature or Decision

**Date:** YYYY-MM-DD
**Status:** `proposed` | `accepted` | `deprecated` | `superseded by [NNN]`
**Author:** Your Name

---

## Context

> What is the problem or opportunity? What constraints exist (time, tech stack, existing architecture)?
> Write this as if explaining to someone who wasn't in the room.
>
> Relevant background: this is a FastAPI + PostgreSQL backend with a React/Vite frontend.
> The backend serves 8 endpoints under `/api/v1`; the frontend polls every 2s from `Dashboard.jsx`.
> Mock mode (`USE_MOCK=true`) bypasses Postgres entirely via `mock_data.py`.

...

---

## Decision

> What did we decide to do? Be direct — one or two sentences stating the choice, then elaborate.

...

---

## Alternatives Considered

> For each alternative you evaluated, explain what it is and why you didn't choose it.
> If you only considered one approach, that's a flag — think harder.

### Option A: [Name]
- **What it is:** ...
- **Why rejected:** ...

### Option B: [Name]
- **What it is:** ...
- **Why rejected:** ...

---

## Tradeoffs

> What are you giving up with this decision? Every real decision has a cost.
> Be honest — this section is the most valuable one to your future self.

| What we gain | What we give up |
|---|---|
| ... | ... |

---

## Files Changed

> List the files introduced or meaningfully modified by this feature.

| File | Change |
|---|---|
| `backend/dashboard/routers/telemetry.py` | ... |
| `backend/dashboard/database.py` | ... |
| `backend/dashboard/mock_data.py` | ... |
| `backend/dashboard/models.py` | ... |
| `frontend/src/api/telemetry.js` | ... |
| `frontend/src/components/...` | ... |
| `frontend/src/pages/Dashboard.jsx` | ... |

---

## Implementation Notes

> Anything a future reader needs to know to understand the code.
> Edge cases, gotchas, non-obvious design choices.
>
> Reminders:
> - New backend endpoints need a matching mock implementation in `mock_data.py`
> - New response shapes need a Pydantic model in `models.py`
> - The frontend `range` param maps to days via `_RANGE_MAP = {"24h": 1, "7d": 7, "30d": 30}`

...

---

## Follow-up / Open Questions

> Tech debt you're knowingly taking on. Things you'd do differently with more time.
> Open questions that weren't resolved.

- [ ] ...

---

## References

> Links to relevant PRs, issues, or prior DDocs this builds on.

- ...
