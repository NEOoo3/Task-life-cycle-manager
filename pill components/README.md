# Task Lifecycle Manager

A full-stack task board with a strictly enforced state machine. Backend: Flask + SQLAlchemy. Frontend: React + Vite + Tailwind. Database: SQLite.

---

## Quick start

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to Flask on `:5000`.

### Running tests

```bash
cd backend
pytest -v
```

---

## Architecture

```
Request → Flask Route → Pydantic schema → Service function → SQLAlchemy → SQLite
                                              ↓
                                     State machine check
                                     (InvalidTransitionError → 409)
```

**Routes** (`routes.py`) are intentionally thin. They parse HTTP, delegate to a service, and translate domain exceptions to HTTP status codes. No business logic lives here.

**Services** (`services.py`) own all business rules. They accept a plain SQLAlchemy `Session` and raise typed exceptions (`InvalidTransitionError`, `TaskNotFoundError`). They can be called from a CLI, a background job, or a test without importing Flask.

**Models** (`models.py`) are pure data definitions. No methods, no logic — just column types and enums.

**Schemas** (`schemas.py`) are the API contract. Pydantic v2 validates inbound payloads and serializes outbound responses. The `from_attributes = True` config on `TaskResponse` means it reads directly from SQLAlchemy ORM objects without a manual mapping step.

---

## State machine

```
OPEN ──────────► IN_PROGRESS ──────────► DONE
                     │
                     └──────────────────► OPEN  (revert)
```

Implemented as a single dict in `services.py`:

```python
VALID_TRANSITIONS = {
    TaskStatus.OPEN:        frozenset({TaskStatus.IN_PROGRESS}),
    TaskStatus.IN_PROGRESS: frozenset({TaskStatus.DONE, TaskStatus.OPEN}),
    TaskStatus.DONE:        frozenset(),
}
```

`DONE` is a terminal state. Every status-change request is checked against this map before the DB write. Invalid transitions return `409 Conflict` with a structured error explaining what transitions are actually allowed.

---

## Technical decisions and trade-offs

### SQLite over PostgreSQL

SQLite is suitable here because the workload is single-user and the setup friction of a separate DB process adds no value for a 48-hour assessment. The switch to PostgreSQL requires only a connection string change — `native_enum=False` was set explicitly so no `ALTER TYPE` migration would be needed when adding enum values.

### Pydantic v2 over Marshmallow

Pydantic v2 is ~5–10x faster than Marshmallow at validation, has first-class `from_attributes` ORM support, and generates JSON Schema automatically. The trade-off is that Pydantic v2 has different import paths from v1 — `model_validate`, `model_dump` — which can catch engineers used to the older API.

### `PATCH` with `exclude_unset=True` over separate endpoints

A single `PATCH /tasks/:id` that only updates provided fields is more REST-idiomatic and less fragile than separate `PUT /tasks/:id/title`, etc. The `exclude_unset=True` on `model_dump` is what makes this correct: unset fields in the JSON body are never written to the DB row.

### No Redux / no Zustand

All state lives in `useTasks()`. React's built-in `useState` is sufficient for a single-resource board. Adding a second resource (e.g. projects) would mean a second hook, not a global store refactor. If cross-cutting concerns (notifications, user session) appeared, `useContext` + `useReducer` would be the next step.

### Axios interceptor for error normalization

Every API error, regardless of status code, is normalized to a plain `Error` with a human-readable `.message`. Components receive a string they can render directly, without needing to know the shape of the backend's error body. The raw Axios response is still available in the error object for developer tooling.

---

## Extending the system

**Adding a new state (e.g. `BLOCKED`)**

1. Add `BLOCKED = "BLOCKED"` to `TaskStatus` in `models.py`.
2. Add entries to `VALID_TRANSITIONS` in `services.py`, e.g. `BLOCKED` reachable from `IN_PROGRESS`, with `OPEN` as the exit.
3. Add a `BLOCKED` entry to `NEXT_ACTIONS` and `COLUMNS` on the frontend.

Zero changes to routes, schemas, or tests.

**Adding a due date**

1. Add `due_at: Mapped[datetime | None]` to `Task`.
2. Add `due_at: Optional[datetime] = None` to `TaskCreate`, `TaskUpdate`, and `TaskResponse`.
3. Run a DB migration (or `drop_all` / `create_all` in dev).

Zero changes to state machine or route logic.

**Switching to PostgreSQL**

```python
# app.py
create_app(database_url="postgresql://user:pass@localhost/tasks")
```

That's it. `native_enum=False` and timezone-aware `DateTime` columns were chosen specifically to make this a one-line change.

---

## API reference

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/api/tasks/` | — | `200 [{TaskResponse}]` |
| `POST` | `/api/tasks/` | `TaskCreate` | `201 {TaskResponse}` |
| `GET` | `/api/tasks/:id` | — | `200 {TaskResponse}` |
| `PATCH` | `/api/tasks/:id` | `TaskUpdate` (partial) | `200 {TaskResponse}` |
| `PATCH` | `/api/tasks/:id/transition` | `{ "status": "IN_PROGRESS" }` | `200 {TaskResponse}` |
| `DELETE` | `/api/tasks/:id` | — | `204 No Content` |

All errors return `{ "error": "<category>", "detail": "<message>" }`.

---

## Project structure

```
task-lifecycle-manager/
├── backend/
│   ├── app.py              # App factory, error handlers, entry point
│   ├── database.py         # Engine init, session context manager
│   ├── models.py           # SQLAlchemy Task model, TaskStatus, Priority enums
│   ├── schemas.py          # Pydantic request/response contracts
│   ├── services.py         # State machine + all business logic
│   ├── routes.py           # Thin Flask Blueprint
│   ├── requirements.txt
│   ├── pytest.ini
│   └── tests/
│       ├── conftest.py     # In-memory SQLite session fixture
│       └── test_services.py
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── services/
│       │   └── api.js      # Axios instance + error normalization
│       ├── hooks/
│       │   └── useTasks.js # All task state, optimistic updates
│       └── components/
│           ├── Board.jsx       # Three-column Kanban layout
│           ├── TaskCard.jsx    # Card with inline transition actions
│           ├── TaskForm.jsx    # Create modal with priority selector
│           └── StatusBadge.jsx # Status and Priority pill components
├── ai-guidance.md
└── README.md
```
