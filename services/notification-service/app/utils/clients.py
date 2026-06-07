from uuid import UUID

import httpx

from app.config.settings import settings


class ProjectClient:
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
