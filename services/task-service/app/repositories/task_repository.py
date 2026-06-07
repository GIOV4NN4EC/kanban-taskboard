from datetime import date
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, project_id: UUID, created_by: UUID, data: TaskCreate) -> Task:
        count = len(self.list_by_project(project_id, status=data.status.value))
        task = Task(
            project_id=project_id,
            title=data.title,
            description=data.description,
            priority=data.priority.value,
            status=data.status.value,
            assignee_id=data.assignee_id,
            due_date=data.due_date,
            position=count,
            created_by=created_by,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_by_id(self, task_id: UUID) -> Task | None:
        return self.db.get(Task, task_id)

    def list_by_project(
        self,
        project_id: UUID,
        *,
        status: str | None = None,
        q: str | None = None,
        assignee_id: UUID | None = None,
        due_before: date | None = None,
        due_after: date | None = None,
        overdue: bool | None = None,
    ) -> list[Task]:
        stmt = select(Task).where(Task.project_id == project_id)
        if status:
            stmt = stmt.where(Task.status == status)
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(Task.title.ilike(pattern), Task.description.ilike(pattern))
            )
        if assignee_id:
            stmt = stmt.where(Task.assignee_id == assignee_id)
        if due_before:
            stmt = stmt.where(Task.due_date.is_not(None), Task.due_date <= due_before)
        if due_after:
            stmt = stmt.where(Task.due_date.is_not(None), Task.due_date >= due_after)
        if overdue:
            today = date.today()
            stmt = stmt.where(
                Task.due_date.is_not(None),
                Task.due_date < today,
                Task.status != TaskStatus.DONE.value,
            )
        stmt = stmt.order_by(Task.position, Task.created_at)
        return list(self.db.scalars(stmt).all())

    def update(self, task: Task, data: TaskUpdate) -> Task:
        fields = data.model_fields_set
        if "title" in fields and data.title is not None:
            task.title = data.title
        if "description" in fields:
            task.description = data.description
        if "priority" in fields and data.priority is not None:
            task.priority = data.priority.value
        if "assignee_id" in fields:
            task.assignee_id = data.assignee_id
        if "due_date" in fields:
            task.due_date = data.due_date
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_status(self, task: Task, status: str) -> Task:
        task.status = status
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_assignee(self, task: Task, assignee_id: UUID | None) -> Task:
        task.assignee_id = assignee_id
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        self.db.delete(task)
        self.db.commit()
