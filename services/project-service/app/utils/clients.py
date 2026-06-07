from typing import Any
from uuid import UUID

import httpx

from app.config.settings import settings


class AuthClient:
    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{settings.auth_url}/users/by-email/{email}")
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None

    def get_user(self, user_id: UUID) -> dict[str, Any] | None:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{settings.auth_url}/users/{user_id}")
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None


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
