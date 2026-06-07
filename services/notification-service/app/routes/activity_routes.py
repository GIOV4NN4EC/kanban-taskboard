from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityCreate, ActivityPublic
from app.services.activity_service import ActivityService
from app.utils.clients import ProjectClient

router = APIRouter(tags=["activities"])


def get_current_user_id(x_user_id: str | None = Header(default=None)) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id") from exc


@router.get("/projects/{project_id}/activities", response_model=list[ActivityPublic])
def list_activities(
    project_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[ActivityPublic]:
    if not ProjectClient().is_owner(project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can view activity history",
        )
    service = ActivityService(ActivityRepository(db))
    return service.list_for_project(project_id, limit=limit, offset=offset)


@router.post("/internal/activities", response_model=ActivityPublic, status_code=201)
def create_activity_internal(data: ActivityCreate, db: Session = Depends(get_db)) -> ActivityPublic:
    service = ActivityService(ActivityRepository(db))
    log = service.record(data)
    return ActivityService._to_public(log)
