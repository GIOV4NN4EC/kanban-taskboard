from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.schemas.activity import ActivityCreate


class ActivityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: ActivityCreate) -> ActivityLog:
        log = ActivityLog(
            project_id=data.project_id,
            actor_id=data.actor_id,
            event_type=data.event_type,
            message=data.message,
            metadata_json=data.metadata,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_by_project(self, project_id: UUID, limit: int = 50, offset: int = 0) -> list[ActivityLog]:
        stmt = (
            select(ActivityLog)
            .where(ActivityLog.project_id == project_id)
            .order_by(desc(ActivityLog.created_at))
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.scalars(stmt).all())
