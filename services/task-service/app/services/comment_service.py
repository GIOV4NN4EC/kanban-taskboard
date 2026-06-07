from uuid import UUID

from app.repositories.comment_repository import CommentRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.comment import CommentCreate, CommentPublic, CommentUpdate
from app.utils.clients import NotificationClient, ProjectClient
from app.utils.mentions import extract_mentioned_user_ids


class CommentServiceError(Exception):
    pass


class NotFoundError(CommentServiceError):
    pass


class ForbiddenError(CommentServiceError):
    pass


class CommentService:
    def __init__(
        self,
        comment_repo: CommentRepository,
        task_repo: TaskRepository,
        project_client: ProjectClient | None = None,
        notification_client: NotificationClient | None = None,
    ) -> None:
        self.comment_repo = comment_repo
        self.task_repo = task_repo
        self.projects = project_client or ProjectClient()
        self.notifications = notification_client or NotificationClient()

    def list_for_task(self, task_id: UUID, user_id: UUID) -> list[CommentPublic]:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        comments = self.comment_repo.list_by_task(task_id)
        return [self._to_public(c) for c in comments]

    def create(self, task_id: UUID, user_id: UUID, data: CommentCreate) -> CommentPublic:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        mentioned = self._validate_mentions(task.project_id, extract_mentioned_user_ids(data.body))
        comment = self.comment_repo.create(task_id, user_id, data, mentioned)
        self.notifications.record_activity(
            task.project_id,
            user_id,
            "COMMENT_ADDED",
            f"New comment on task '{task.title}'",
            {
                "task_id": str(task.id),
                "comment_id": str(comment.id),
                "mentioned_user_ids": [str(uid) for uid in mentioned],
            },
        )
        return self._to_public(comment)

    def update(self, comment_id: UUID, user_id: UUID, data: CommentUpdate) -> CommentPublic:
        comment = self._get_comment_or_404(comment_id)
        task = self._get_task_or_404(comment.task_id)
        self._ensure_member(task.project_id, user_id)
        if comment.author_id != user_id:
            raise ForbiddenError("Only the comment author can edit this comment")
        mentioned = self._validate_mentions(task.project_id, extract_mentioned_user_ids(data.body))
        updated = self.comment_repo.update(comment, data, mentioned)
        return self._to_public(updated)

    def delete(self, comment_id: UUID, user_id: UUID) -> None:
        comment = self._get_comment_or_404(comment_id)
        task = self._get_task_or_404(comment.task_id)
        self._ensure_member(task.project_id, user_id)
        is_owner = self.projects.is_owner(task.project_id, user_id)
        if comment.author_id != user_id and not is_owner:
            raise ForbiddenError("Only the comment author or project owner can delete this comment")
        self.comment_repo.delete(comment)

    def _validate_mentions(self, project_id: UUID, user_ids: list[UUID]) -> list[UUID]:
        for uid in user_ids:
            if not self.projects.is_member(project_id, uid):
                raise ForbiddenError("Mentioned users must be project members")
        return user_ids

    def _ensure_member(self, project_id: UUID, user_id: UUID) -> None:
        if not self.projects.is_member(project_id, user_id):
            raise ForbiddenError("Not a project member")

    def _get_task_or_404(self, task_id: UUID):
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundError("Task not found")
        return task

    def _get_comment_or_404(self, comment_id: UUID):
        comment = self.comment_repo.get_by_id(comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
        return comment

    @staticmethod
    def _to_public(comment) -> CommentPublic:
        mentioned = [UUID(uid) for uid in (comment.mentioned_user_ids or [])]
        return CommentPublic(
            id=comment.id,
            task_id=comment.task_id,
            author_id=comment.author_id,
            body=comment.body,
            mentioned_user_ids=mentioned,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
