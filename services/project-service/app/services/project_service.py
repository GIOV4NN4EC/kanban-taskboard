from uuid import UUID

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import MemberAdd, ProjectCreate, ProjectPublic, ProjectUpdate
from app.utils.clients import AuthClient, NotificationClient


class ProjectServiceError(Exception):
    pass


class NotFoundError(ProjectServiceError):
    pass


class ForbiddenError(ProjectServiceError):
    pass


class ConflictError(ProjectServiceError):
    pass


class ProjectService:
    def __init__(
        self,
        repo: ProjectRepository,
        auth_client: AuthClient | None = None,
        notification_client: NotificationClient | None = None,
    ) -> None:
        self.repo = repo
        self.auth = auth_client or AuthClient()
        self.notifications = notification_client or NotificationClient()

    def create(self, user_id: UUID, data: ProjectCreate) -> Project:
        project = self.repo.create(data, owner_id=user_id)
        self.notifications.record_activity(
            project.id,
            user_id,
            "PROJECT_CREATED",
            f"Project '{project.name}' was created",
        )
        return project

    def list_for_user(self, user_id: UUID) -> list[ProjectPublic]:
        projects = self.repo.list_for_user(user_id)
        return [ProjectPublic.model_validate(p) for p in projects]

    def get(self, project_id: UUID, user_id: UUID) -> Project:
        project = self._get_project_or_404(project_id)
        self._ensure_member(project_id, user_id)
        return project

    def update(self, project_id: UUID, user_id: UUID, data: ProjectUpdate) -> Project:
        project = self._get_project_or_404(project_id)
        self._ensure_owner(project, user_id)
        updated = self.repo.update(project, data)
        self.notifications.record_activity(
            project_id,
            user_id,
            "PROJECT_UPDATED",
            f"Project '{updated.name}' was updated",
        )
        return updated

    def delete(self, project_id: UUID, user_id: UUID) -> None:
        project = self._get_project_or_404(project_id)
        self._ensure_owner(project, user_id)
        name = project.name
        self.repo.delete(project)
        self.notifications.record_activity(
            project_id,
            user_id,
            "PROJECT_DELETED",
            f"Project '{name}' was deleted",
        )

    def list_members(self, project_id: UUID, user_id: UUID) -> list[ProjectMember]:
        self._ensure_member(project_id, user_id)
        return self.repo.list_members(project_id)

    def add_member(self, project_id: UUID, user_id: UUID, data: MemberAdd) -> ProjectMember:
        project = self._get_project_or_404(project_id)
        self._ensure_owner(project, user_id)

        target_user_id = data.user_id
        if data.email and not target_user_id:
            user_data = self.auth.get_user_by_email(data.email)
            if not user_data:
                raise NotFoundError("User with this email not found")
            target_user_id = UUID(user_data["id"])
        if not target_user_id:
            raise ProjectServiceError("user_id or email is required")

        if self.repo.is_member(project_id, target_user_id):
            raise ConflictError("User is already a member")

        member = self.repo.add_member(project_id, target_user_id)
        self.notifications.record_activity(
            project_id,
            user_id,
            "MEMBER_ADDED",
            f"Member {target_user_id} was added to the project",
            {"member_id": str(target_user_id)},
        )
        return member

    def remove_member(self, project_id: UUID, user_id: UUID, member_user_id: UUID) -> None:
        project = self._get_project_or_404(project_id)
        self._ensure_owner(project, user_id)
        if member_user_id == project.owner_id:
            raise ForbiddenError("Cannot remove project owner")
        member = self.repo.get_member_by_user(project_id, member_user_id)
        if not member:
            raise NotFoundError("Member not found")
        self.repo.remove_member(member)
        self.notifications.record_activity(
            project_id,
            user_id,
            "MEMBER_REMOVED",
            f"Member {member_user_id} was removed",
        )

    def check_membership(self, project_id: UUID, user_id: UUID) -> bool:
        return self.repo.is_member(project_id, user_id) is not None

    def _get_project_or_404(self, project_id: UUID) -> Project:
        project = self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project not found")
        return project

    def _ensure_member(self, project_id: UUID, user_id: UUID) -> None:
        if not self.repo.is_member(project_id, user_id):
            raise ForbiddenError("Not a project member")

    @staticmethod
    def _ensure_owner(project: Project, user_id: UUID) -> None:
        if project.owner_id != user_id:
            raise ForbiddenError("Only the project owner can perform this action")
