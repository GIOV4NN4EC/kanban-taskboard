from typing import Any
from uuid import UUID

import httpx

from app.config.settings import settings


class ProjectClient:
    def is_member(self, project_id: UUID, user_id: UUID) -> bool:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(
                    f"{settings.project_url}/internal/projects/{project_id}/members/{user_id}"
                )
                return response.status_code == 200
        except httpx.HTTPError:
            return False

    def is_owner(self, project_id: UUID, user_id: UUID) -> bool:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(
                    f"{settings.project_url}/internal/projects/{project_id}/owner/{user_id}"
                )
                if response.status_code != 200:
                    return False
                return bool(response.json().get("is_owner"))
        except httpx.HTTPError:
            return False


class NotificationClient:
    def record_activity(
        self,
        project_id: UUID,
        actor_id: UUID,
        event_type: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        payload = {
            "project_id": str(project_id),
            "actor_id": str(actor_id),
            "event_type": event_type,
            "message": message,
            "metadata": metadata,
        }
        try:
            with httpx.Client(timeout=5.0) as client:
                client.post(f"{settings.notification_url}/internal/activities", json=payload)
        except httpx.HTTPError:
            pass
