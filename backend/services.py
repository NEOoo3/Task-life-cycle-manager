import sqlalchemy.orm

from models import Priority, Task, TaskStatus
from schemas import TaskCreate, TaskUpdate

# frozenset rather than set: these rules must not mutate during a request cycle.
# Extending the machine (e.g. adding BLOCKED) means editing only this dict.
VALID_TRANSITIONS: dict[TaskStatus, frozenset[TaskStatus]] = {
    TaskStatus.OPEN: frozenset({TaskStatus.IN_PROGRESS}),
    TaskStatus.IN_PROGRESS: frozenset({TaskStatus.DONE, TaskStatus.OPEN}),
    TaskStatus.DONE: frozenset(),
}


class InvalidTransitionError(ValueError):
    def __init__(self, from_status: TaskStatus, to_status: TaskStatus) -> None:
        self.from_status = from_status
        self.to_status = to_status
        allowed = [s.value for s in VALID_TRANSITIONS[from_status]]
        super().__init__(
            f"Cannot transition '{from_status.value}' → '{to_status.value}'. "
            f"Allowed next states: {allowed or ['none — this state is terminal']}"
        )


class TaskNotFoundError(LookupError):
    pass


def get_all_tasks(db: sqlalchemy.orm.Session) -> list[Task]:
    return db.query(Task).order_by(Task.created_at.desc()).all()


def get_task(db: sqlalchemy.orm.Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise TaskNotFoundError(f"Task {task_id} not found.")
    return task


def create_task(db: sqlalchemy.orm.Session, payload: TaskCreate) -> Task:
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: sqlalchemy.orm.Session, task_id: int, payload: TaskUpdate) -> Task:
    task = get_task(db, task_id)
    # exclude_unset=True prevents overwriting fields the caller didn't include,
    # which is what makes PATCH semantics correct vs PUT.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def transition_task(db: sqlalchemy.orm.Session, task_id: int, to_status: TaskStatus) -> Task:
    task = get_task(db, task_id)
    if to_status not in VALID_TRANSITIONS[task.status]:
        raise InvalidTransitionError(task.status, to_status)
    task.status = to_status
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: sqlalchemy.orm.Session, task_id: int) -> None:
    task = get_task(db, task_id)
    db.delete(task)
    db.commit()
