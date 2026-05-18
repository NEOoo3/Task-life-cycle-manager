import pytest

from models import Priority, TaskStatus
from schemas import TaskCreate, TaskUpdate
from services import (
    InvalidTransitionError,
    TaskNotFoundError,
    create_task,
    delete_task,
    get_task,
    transition_task,
    update_task,
)


def _make_task(db, title="Test Task", priority=Priority.MEDIUM, description=None):
    return create_task(db, TaskCreate(title=title, priority=priority, description=description))


class TestTaskCreation:
    def test_new_task_defaults_to_open_and_medium(self, db_session):
        task = _make_task(db_session)
        assert task.status == TaskStatus.OPEN
        assert task.priority == Priority.MEDIUM

    def test_explicit_priority_is_persisted(self, db_session):
        task = _make_task(db_session, priority=Priority.HIGH)
        assert task.priority == Priority.HIGH

    def test_description_is_optional(self, db_session):
        task = _make_task(db_session)
        assert task.description is None


class TestStateTransitions:
    def test_open_advances_to_in_progress(self, db_session):
        task = _make_task(db_session)
        updated = transition_task(db_session, task.id, TaskStatus.IN_PROGRESS)
        assert updated.status == TaskStatus.IN_PROGRESS

    def test_open_cannot_skip_directly_to_done(self, db_session):
        task = _make_task(db_session)
        with pytest.raises(InvalidTransitionError) as exc_info:
            transition_task(db_session, task.id, TaskStatus.DONE)
        assert exc_info.value.from_status == TaskStatus.OPEN
        assert exc_info.value.to_status == TaskStatus.DONE

    def test_done_is_a_terminal_state(self, db_session):
        task = _make_task(db_session)
        transition_task(db_session, task.id, TaskStatus.IN_PROGRESS)
        transition_task(db_session, task.id, TaskStatus.DONE)
        with pytest.raises(InvalidTransitionError):
            transition_task(db_session, task.id, TaskStatus.OPEN)

    def test_in_progress_can_revert_to_open(self, db_session):
        task = _make_task(db_session)
        transition_task(db_session, task.id, TaskStatus.IN_PROGRESS)
        reverted = transition_task(db_session, task.id, TaskStatus.OPEN)
        assert reverted.status == TaskStatus.OPEN

    def test_full_lifecycle_happy_path(self, db_session):
        task = _make_task(db_session)
        task = transition_task(db_session, task.id, TaskStatus.IN_PROGRESS)
        task = transition_task(db_session, task.id, TaskStatus.DONE)
        assert task.status == TaskStatus.DONE


class TestTaskMutations:
    def test_partial_update_leaves_other_fields_intact(self, db_session):
        task = _make_task(db_session, title="Original", priority=Priority.HIGH)
        updated = update_task(db_session, task.id, TaskUpdate(title="Renamed"))
        assert updated.title == "Renamed"
        assert updated.priority == Priority.HIGH

    def test_update_only_description(self, db_session):
        task = _make_task(db_session, title="Keep this")
        updated = update_task(db_session, task.id, TaskUpdate(description="New desc"))
        assert updated.title == "Keep this"
        assert updated.description == "New desc"

    def test_get_nonexistent_task_raises(self, db_session):
        with pytest.raises(TaskNotFoundError):
            get_task(db_session, 99999)

    def test_delete_makes_task_unreachable(self, db_session):
        task = _make_task(db_session)
        delete_task(db_session, task.id)
        with pytest.raises(TaskNotFoundError):
            get_task(db_session, task.id)

    def test_transition_nonexistent_task_raises(self, db_session):
        with pytest.raises(TaskNotFoundError):
            transition_task(db_session, 99999, TaskStatus.IN_PROGRESS)
