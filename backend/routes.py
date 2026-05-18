from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from database import get_db
from schemas import TaskCreate, TaskResponse, TaskTransition, TaskUpdate
from services import (
    InvalidTransitionError,
    TaskNotFoundError,
    create_task,
    delete_task,
    get_all_tasks,
    get_task,
    transition_task,
    update_task,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


def _serialize(task) -> dict:
    return TaskResponse.model_validate(task).model_dump(mode="json")


@tasks_bp.get("/")
def list_tasks():
    with get_db() as db:
        return jsonify([_serialize(t) for t in get_all_tasks(db)])


@tasks_bp.get("/<int:task_id>")
def get_one(task_id: int):
    with get_db() as db:
        try:
            return jsonify(_serialize(get_task(db, task_id)))
        except TaskNotFoundError as e:
            return jsonify({"error": "Not Found", "detail": str(e)}), 404


@tasks_bp.post("/")
def create():
    with get_db() as db:
        try:
            payload = TaskCreate.model_validate(request.get_json(force=True) or {})
        except ValidationError as e:
            return jsonify({"error": "Validation Error", "detail": e.errors()}), 422
        return jsonify(_serialize(create_task(db, payload))), 201


@tasks_bp.patch("/<int:task_id>")
def update(task_id: int):
    with get_db() as db:
        try:
            payload = TaskUpdate.model_validate(request.get_json(force=True) or {})
            return jsonify(_serialize(update_task(db, task_id, payload)))
        except ValidationError as e:
            return jsonify({"error": "Validation Error", "detail": e.errors()}), 422
        except TaskNotFoundError as e:
            return jsonify({"error": "Not Found", "detail": str(e)}), 404


@tasks_bp.patch("/<int:task_id>/transition")
def transition(task_id: int):
    with get_db() as db:
        try:
            payload = TaskTransition.model_validate(request.get_json(force=True) or {})
            return jsonify(_serialize(transition_task(db, task_id, payload.status)))
        except ValidationError as e:
            return jsonify({"error": "Validation Error", "detail": e.errors()}), 422
        except TaskNotFoundError as e:
            return jsonify({"error": "Not Found", "detail": str(e)}), 404
        except InvalidTransitionError as e:
            return jsonify({"error": "Invalid Transition", "detail": str(e)}), 409


@tasks_bp.delete("/<int:task_id>")
def delete(task_id: int):
    with get_db() as db:
        try:
            delete_task(db, task_id)
            return "", 204
        except TaskNotFoundError as e:
            return jsonify({"error": "Not Found", "detail": str(e)}), 404
