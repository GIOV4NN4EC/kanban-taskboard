from uuid import UUID

from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityCreate, ActivityPublic
from app.models.activity_log import ActivityLog


class ActivityService:
    def __init__(self, repo: ActivityRepository) -> None:
        self.repo = repo

    def record(self, data: ActivityCreate) -> ActivityLog:
        return self.repo.create(data)

    def list_for_project(self, project_id: UUID, limit: int = 50, offset: int = 0) -> list[ActivityPublic]:
        logs = self.repo.list_by_project(project_id, limit=limit, offset=offset)
        return [self._to_public(log) for log in logs]

    @staticmethod
    def _to_public(log: ActivityLog) -> ActivityPublic:
        return ActivityPublic(
            id=log.id,
            project_id=log.project_id,
            actor_id=log.actor_id,
            event_type=log.event_type,
            message=log.message,
            metadata=log.metadata_json,
            created_at=log.created_at,
        )
