from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class CommentUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class CommentPublic(BaseModel):
    id: UUID
    task_id: UUID
    author_id: UUID
    body: str
    mentioned_user_ids: list[UUID]
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
