from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ActivityCreate(BaseModel):
    project_id: UUID
    actor_id: UUID
    event_type: str = Field(max_length=50)
    message: str
    metadata: dict[str, Any] | None = None


class ActivityPublic(BaseModel):
    id: UUID
    project_id: UUID
    actor_id: UUID
    event_type: str
    message: str
    metadata: dict[str, Any] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
