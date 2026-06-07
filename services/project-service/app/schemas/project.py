from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    due_date: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    due_date: date | None = None


class ProjectPublic(BaseModel):
    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    due_date: date | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberAdd(BaseModel):
    user_id: UUID | None = None
    email: str | None = None


class MemberPublic(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str

    model_config = {"from_attributes": True}
