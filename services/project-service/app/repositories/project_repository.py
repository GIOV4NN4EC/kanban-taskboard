from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: ProjectCreate, owner_id: UUID) -> Project:
        project = Project(
            name=data.name,
            description=data.description,
            due_date=data.due_date,
            owner_id=owner_id,
        )
        self.db.add(project)
        self.db.flush()
        member = ProjectMember(project_id=project.id, user_id=owner_id, role="OWNER")
        self.db.add(member)
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_by_id(self, project_id: UUID) -> Project | None:
        stmt = (
            select(Project)
            .options(joinedload(Project.members))
            .where(Project.id == project_id)
        )
        return self.db.scalar(stmt)

    def list_for_user(self, user_id: UUID) -> list[Project]:
        stmt = (
            select(Project)
            .join(ProjectMember)
            .where(ProjectMember.user_id == user_id)
            .order_by(Project.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def update(self, project: Project, data: ProjectUpdate) -> Project:
        fields = data.model_fields_set
        if "name" in fields and data.name is not None:
            project.name = data.name
        if "description" in fields:
            project.description = data.description
        if "due_date" in fields:
            project.due_date = data.due_date
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self.db.delete(project)
        self.db.commit()

    def is_member(self, project_id: UUID, user_id: UUID) -> ProjectMember | None:
        stmt = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        return self.db.scalar(stmt)

    def add_member(self, project_id: UUID, user_id: UUID, role: str = "MEMBER") -> ProjectMember:
        member = ProjectMember(project_id=project_id, user_id=user_id, role=role)
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def remove_member(self, member: ProjectMember) -> None:
        self.db.delete(member)
        self.db.commit()

    def list_members(self, project_id: UUID) -> list[ProjectMember]:
        stmt = select(ProjectMember).where(ProjectMember.project_id == project_id)
        return list(self.db.scalars(stmt).all())

    def get_member_by_user(self, project_id: UUID, user_id: UUID) -> ProjectMember | None:
        return self.is_member(project_id, user_id)
