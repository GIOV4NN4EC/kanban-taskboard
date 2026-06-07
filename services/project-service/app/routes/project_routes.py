from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import (
    MemberAdd,
    MemberPublic,
    ProjectCreate,
    ProjectPublic,
    ProjectUpdate,
)
from app.services.project_service import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ProjectService,
    ProjectServiceError,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def get_current_user_id(x_user_id: str | None = Header(default=None)) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id") from exc


def _handle_service_errors(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, ForbiddenError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, ConflictError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("", response_model=ProjectPublic, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    service = ProjectService(ProjectRepository(db))
    try:
        project = service.create(user_id, data)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc
    return ProjectPublic.model_validate(project)


@router.get("", response_model=list[ProjectPublic])
def list_projects(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[ProjectPublic]:
    service = ProjectService(ProjectRepository(db))
    return service.list_for_user(user_id)


@router.get("/{project_id}", response_model=ProjectPublic)
def get_project(
    project_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    service = ProjectService(ProjectRepository(db))
    try:
        project = service.get(project_id, user_id)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc
    return ProjectPublic.model_validate(project)


@router.put("/{project_id}", response_model=ProjectPublic)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    service = ProjectService(ProjectRepository(db))
    try:
        project = service.update(project_id, user_id, data)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc
    return ProjectPublic.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service = ProjectService(ProjectRepository(db))
    try:
        service.delete(project_id, user_id)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc


@router.get("/{project_id}/members", response_model=list[MemberPublic])
def list_members(
    project_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[MemberPublic]:
    service = ProjectService(ProjectRepository(db))
    try:
        members = service.list_members(project_id, user_id)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc
    return [MemberPublic.model_validate(m) for m in members]


@router.post("/{project_id}/members", response_model=MemberPublic, status_code=status.HTTP_201_CREATED)
def add_member(
    project_id: UUID,
    data: MemberAdd,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> MemberPublic:
    service = ProjectService(ProjectRepository(db))
    try:
        member = service.add_member(project_id, user_id, data)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc
    return MemberPublic.model_validate(member)


@router.delete("/{project_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: UUID,
    member_user_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    service = ProjectService(ProjectRepository(db))
    try:
        service.remove_member(project_id, user_id, member_user_id)
    except ProjectServiceError as exc:
        raise _handle_service_errors(exc) from exc
