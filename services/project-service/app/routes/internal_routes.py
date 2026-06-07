from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.project_repository import ProjectRepository
from app.services.project_service import ProjectService

router = APIRouter(prefix="/internal/projects", tags=["internal"])


@router.get("/{project_id}/members/{user_id}")
def check_membership(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = ProjectService(ProjectRepository(db))
    is_member = service.check_membership(project_id, user_id)
    if not is_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not a member")
    return {"is_member": True}


@router.get("/{project_id}/owner/{user_id}")
def check_owner(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    repo = ProjectRepository(db)
    project = repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return {"is_owner": project.owner_id == user_id}
