from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.task import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    assignee_id: UUID | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    priority: TaskPriority | None = None
    assignee_id: UUID | None = None
    due_date: date | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskAssigneeUpdate(BaseModel):
    assignee_id: UUID | None = None


class TaskPublic(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: str | None
    priority: str
    status: str
    assignee_id: UUID | None
    due_date: date | None = None
    position: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
