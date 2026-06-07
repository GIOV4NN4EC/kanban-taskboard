from uuid import UUID

from app.models.task import Task, TaskStatus
from app.repositories.task_repository import TaskRepository
from app.schemas.task import (
    TaskAssigneeUpdate,
    TaskCreate,
    TaskPublic,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.utils.clients import NotificationClient, ProjectClient


class TaskServiceError(Exception):
    pass


class NotFoundError(TaskServiceError):
    pass


class ForbiddenError(TaskServiceError):
    pass


class TaskService:
    def __init__(
        self,
        repo: TaskRepository,
        project_client: ProjectClient | None = None,
        notification_client: NotificationClient | None = None,
    ) -> None:
        self.repo = repo
        self.projects = project_client or ProjectClient()
        self.notifications = notification_client or NotificationClient()

    def _ensure_member(self, project_id: UUID, user_id: UUID) -> None:
        if not self.projects.is_member(project_id, user_id):
            raise ForbiddenError("Not a project member")

    def _validate_assignee(self, project_id: UUID, assignee_id: UUID | None) -> None:
        if assignee_id is None:
            return
        if not self.projects.is_member(project_id, assignee_id):
            raise ForbiddenError("Assignee must be a project member")

    def create(self, project_id: UUID, user_id: UUID, data: TaskCreate) -> Task:
        self._ensure_member(project_id, user_id)
        self._validate_assignee(project_id, data.assignee_id)
        task = self.repo.create(project_id, user_id, data)
        self.notifications.record_activity(
            project_id,
            user_id,
            "TASK_CREATED",
            f"Task '{task.title}' was created",
            {"task_id": str(task.id)},
        )
        return task

    def list_tasks(
        self,
        project_id: UUID,
        user_id: UUID,
        *,
        status: str | None = None,
        q: str | None = None,
        assignee_id: UUID | None = None,
        due_before=None,
        due_after=None,
        overdue: bool | None = None,
    ) -> list[TaskPublic]:
        self._ensure_member(project_id, user_id)
        tasks = self.repo.list_by_project(
            project_id,
            status=status,
            q=q,
            assignee_id=assignee_id,
            due_before=due_before,
            due_after=due_after,
            overdue=overdue,
        )
        return [TaskPublic.model_validate(t) for t in tasks]

    def get(self, task_id: UUID, user_id: UUID) -> Task:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        return task

    def update(self, task_id: UUID, user_id: UUID, data: TaskUpdate) -> Task:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        if "assignee_id" in data.model_fields_set:
            self._validate_assignee(task.project_id, data.assignee_id)
        updated = self.repo.update(task, data)
        self.notifications.record_activity(
            task.project_id,
            user_id,
            "TASK_UPDATED",
            f"Task '{updated.title}' was updated",
            {"task_id": str(task.id)},
        )
        return updated

    def delete(self, task_id: UUID, user_id: UUID) -> None:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        title = task.title
        project_id = task.project_id
        self.repo.delete(task)
        self.notifications.record_activity(
            project_id,
            user_id,
            "TASK_DELETED",
            f"Task '{title}' was deleted",
        )

    def update_status(self, task_id: UUID, user_id: UUID, data: TaskStatusUpdate) -> Task:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        old_status = task.status
        updated = self.repo.update_status(task, data.status.value)
        self.notifications.record_activity(
            task.project_id,
            user_id,
            "TASK_MOVED",
            f"Task '{updated.title}' moved from {old_status} to {updated.status}",
            {"task_id": str(task.id), "from": old_status, "to": updated.status},
        )
        return updated

    def update_assignee(self, task_id: UUID, user_id: UUID, data: TaskAssigneeUpdate) -> Task:
        task = self._get_task_or_404(task_id)
        self._ensure_member(task.project_id, user_id)
        self._validate_assignee(task.project_id, data.assignee_id)
        updated = self.repo.update_assignee(task, data.assignee_id)
        self.notifications.record_activity(
            task.project_id,
            user_id,
            "TASK_ASSIGNED",
            f"Task '{updated.title}' assignee updated",
            {"task_id": str(task.id), "assignee_id": str(data.assignee_id) if data.assignee_id else None},
        )
        return updated

    def _get_task_or_404(self, task_id: UUID) -> Task:
        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundError("Task not found")
        return task
