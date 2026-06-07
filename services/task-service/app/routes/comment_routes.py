from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.comment_repository import CommentRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.comment import CommentCreate, CommentPublic, CommentUpdate
from app.services.comment_service import (
    CommentService,
    CommentServiceError,
    ForbiddenError,
    NotFoundError,
)

router = APIRouter(tags=["comments"])


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


@router.get("/tasks/{task_id}/comments", response_model=list[CommentPublic])
def list_comments(
    task_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[CommentPublic]:
    service = CommentService(CommentRepository(db), TaskRepository(db))
    try:
        return service.list_for_task(task_id, user_id)
    except CommentServiceError as exc:
        raise _handle_errors(exc) from exc


@router.post("/tasks/{task_id}/comments", response_model=CommentPublic, status_code=status.HTTP_201_CREATED)
def create_comment(
    task_id: UUID,
    data: CommentCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommentPublic:
    service = CommentService(CommentRepository(db), TaskRepository(db))
    try:
        return service.create(task_id, user_id, data)
    except CommentServiceError as exc:
        raise _handle_errors(exc) from exc


@router.put("/tasks/{task_id}/comments/{comment_id}", response_model=CommentPublic)
def update_comment(
    task_id: UUID,
    comment_id: UUID,
    data: CommentUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CommentPublic:
    _ = task_id
    service = CommentService(CommentRepository(db), TaskRepository(db))
    try:
        return service.update(comment_id, user_id, data)
    except CommentServiceError as exc:
        raise _handle_errors(exc) from exc


@router.delete("/tasks/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    task_id: UUID,
    comment_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    _ = task_id
    service = CommentService(CommentRepository(db), TaskRepository(db))
    try:
        service.delete(comment_id, user_id)
    except CommentServiceError as exc:
        raise _handle_errors(exc) from exc
