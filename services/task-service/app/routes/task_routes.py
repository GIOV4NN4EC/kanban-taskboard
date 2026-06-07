from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.task import TaskStatus
from app.repositories.task_repository import TaskRepository
from app.schemas.task import (
    TaskAssigneeUpdate,
    TaskCreate,
    TaskPublic,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services.task_service import ForbiddenError, NotFoundError, TaskService, TaskServiceError

router = APIRouter(tags=["tasks"])


def get_current_user_id(x_user_id: str | None = Header(default=None)) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id") from exc


def _handle_errors(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, ForbiddenError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/projects/{project_id}/tasks", response_model=list[TaskPublic])
def list_tasks(
    project_id: UUID,
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=200),
    assignee_id: UUID | None = Query(default=None),
    due_before: date | None = Query(default=None),
    due_after: date | None = Query(default=None),
    overdue: bool | None = Query(default=None),
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[TaskPublic]:
    service = TaskService(TaskRepository(db))
    try:
        return service.list_tasks(
            project_id,
            user_id,
            status=status_filter.value if status_filter else None,
            q=q,
            assignee_id=assignee_id,
            due_before=due_before,
            due_after=due_after,
            overdue=overdue,
        )
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc


@router.post("/projects/{project_id}/tasks", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: UUID,
    data: TaskCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> TaskPublic:
    service = TaskService(TaskRepository(db))
    try:
        task = service.create(project_id, user_id, data)
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc
    return TaskPublic.model_validate(task)


@router.get("/tasks/{task_id}", response_model=TaskPublic)
def get_task(
    task_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> TaskPublic:
    service = TaskService(TaskRepository(db))
    try:
        task = service.get(task_id, user_id)
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc
    return TaskPublic.model_validate(task)


@router.put("/tasks/{task_id}", response_model=TaskPublic)
def update_task(
    task_id: UUID,
    data: TaskUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> TaskPublic:
    service = TaskService(TaskRepository(db))
    try:
        task = service.update(task_id, user_id, data)
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc
    return TaskPublic.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service = TaskService(TaskRepository(db))
    try:
        service.delete(task_id, user_id)
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc


@router.patch("/tasks/{task_id}/status", response_model=TaskPublic)
def patch_status(
    task_id: UUID,
    data: TaskStatusUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> TaskPublic:
    service = TaskService(TaskRepository(db))
    try:
        task = service.update_status(task_id, user_id, data)
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc
    return TaskPublic.model_validate(task)


@router.patch("/tasks/{task_id}/assignee", response_model=TaskPublic)
def patch_assignee(
    task_id: UUID,
    data: TaskAssigneeUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> TaskPublic:
    service = TaskService(TaskRepository(db))
    try:
        task = service.update_assignee(task_id, user_id, data)
    except TaskServiceError as exc:
        raise _handle_errors(exc) from exc
    return TaskPublic.model_validate(task)
