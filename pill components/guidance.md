Guide

## 1. The State Machine is the single source of truth

`VALID_TRANSITIONS` in `services.py` is a plain `dict[TaskStatus, frozenset[TaskStatus]]`.
Every status-change request passes through `transition_task()`, which raises
`InvalidTransitionError` before touching the database.

The frontend mirrors this dict for UX only — to avoid showing useless buttons — but
it never trusts itself. If a user somehow calls the API with an invalid transition,
the backend rejects it with a structured `409 Conflict` response.

Adding a new state (e.g. `BLOCKED`) means editing **one dict** and **one Enum**.
No route logic, no schema logic, no frontend logic changes are required.

---

## 2. Layers have hard contracts

| Layer | Allowed to do | Not allowed to do |
|---|---|---|
| Routes (`routes.py`) | Parse HTTP, call a service, map exceptions to HTTP status codes | Contain any `if task.status == ...` logic |
| Services (`services.py`) | Enforce state machine, run DB queries, raise domain errors | Know about HTTP, Flask, JSON, or response shapes |
| Models (`models.py`) | Define schema + column types | Contain methods with business rules |
| Schemas (`schemas.py`) | Validate and serialize input/output | Touch the DB or call services |

This was enforced by asking: *"if I copy this function into a CLI script with no Flask import, does it still work?"* For services, the answer must be yes.

---

## 3. Every error is observable

All API errors return `{ "error": "<category>", "detail": "<human-readable>" }`.
Categories are: `Not Found` (404), `Validation Error` (422), `Invalid Transition` (409),
`Method Not Allowed` (405), `Internal Server Error` (500).

The frontend's Axios interceptor surfaces `detail` when it's a string, which covers
the common case. When `detail` is a Pydantic error list (422), the interceptor uses
the `error` category string — detailed field errors are available in the raw response
for developer tooling.

---

## 4. Schemas use `exclude_unset=True` for PATCH

`TaskUpdate.model_dump(exclude_unset=True)` means only fields the caller explicitly
sent are written. A `PATCH /tasks/1` with `{ "title": "New" }` does not touch
`priority`, `description`, or `status`. This is what makes PATCH semantically
different from PUT, and why no "update" route was split into separate endpoints.

---

## 5. `native_enum=False` prevents schema migration lock-in

SQLAlchemy's `native_enum=True` creates a DB-level `ENUM` type (on PostgreSQL) that
requires `ALTER TYPE` to add values. By setting `native_enum=False`, the column stores
plain `VARCHAR`. Adding `BLOCKED` to `TaskStatus` is a Python-only change. The
trade-off is no DB-level constraint on the column, which is acceptable because the
service layer already guards every write.

---

## 6. Tests target the service layer, not the HTTP layer

Flask routes are deliberately thin. Unit tests operate on `services.py` functions
directly with an in-memory SQLite session. This means:

- Tests run without starting a server.
- Tests exercise real SQLAlchemy queries (not mocks).
- Tests are fast: the in-memory DB is created and destroyed per test function.
- If a route changes its URL but the service logic stays correct, tests still pass — which is the right behaviour.

---

## 7. No Redux, no global state managers

All task state lives in `useTasks()`. The hook exposes functions that perform
optimistic local updates (`setTasks(prev => ...)`) immediately after a successful
API call, without waiting for a re-fetch. This keeps the UI snappy while keeping
state logic in one place.

If the app grows to need cross-component state (e.g. a notification system), the
right move is React Context with `useReducer` — still no external library.

---

## 8. Comments were written only for "why", not "what"

Code was reviewed for any comment that simply restated the adjacent line in English.
Those were deleted. Comments that survived explain:

- Why `frozenset` was chosen over `set` (mutation safety across a request cycle).
- Why `exclude_unset=True` is required for correct PATCH semantics.
- Why `native_enum=False` exists (migration safety).
- Why the frontend's `NEXT_ACTIONS` constant is a UX mirror, not the authority.

---

## 9. Resilience rule: new features extend, not rewrite

The `Priority` enum was added as a demonstration. It required:

1. A new `Priority` enum in `models.py`.
2. One new column in `Task`.
3. One field in `TaskCreate`, `TaskUpdate`, and `TaskResponse` schemas.
4. Zero changes to route logic, state machine logic, or test structure.

Any future feature (due dates, assignees, labels) follows the same pattern.
