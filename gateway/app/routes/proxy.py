import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.middleware.jwt_auth import TokenValidationError, decode_token

router = APIRouter()

PUBLIC_PATHS = {"/api/auth/register", "/api/auth/login", "/api/auth/reset-password"}


def _resolve_upstream(path: str) -> tuple[str, str]:
    downstream = path.removeprefix("/api")

    if path.startswith("/api/projects/") and "/activities" in path:
        return settings.notification_url, downstream

    # Tarefas vivem no task-service, mas a URL é /projects/{id}/tasks
    if path.startswith("/api/projects/") and "/tasks" in path:
        return settings.task_url, downstream

    if path.startswith("/api/auth"):
        return settings.auth_url, downstream
    if path.startswith("/api/users"):
        return settings.auth_url, downstream
    if path.startswith("/api/projects"):
        return settings.project_url, downstream
    if path.startswith("/api/tasks"):
        return settings.task_url, downstream

    raise ValueError(f"No upstream for path: {path}")


@router.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_api(full_path: str, request: Request) -> Response:
    path = f"/api/{full_path}"

    if request.method == "OPTIONS":
        return Response(status_code=204)

    try:
        base_url, downstream_path = _resolve_upstream(path)
    except ValueError:
        return JSONResponse({"detail": "Route not found"}, status_code=404)

    headers: dict[str, str] = {}
    if request.headers.get("content-type"):
        headers["content-type"] = request.headers.get("content-type")

    if path not in PUBLIC_PATHS:
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.lower().startswith("bearer "):
            return JSONResponse({"detail": "Not authenticated"}, status_code=401)
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
        except TokenValidationError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=401)
        user_id = payload.get("sub")
        if not user_id:
            return JSONResponse({"detail": "Invalid token payload"}, status_code=401)
        headers["X-User-Id"] = str(user_id)

    body = await request.body()
    url = f"{base_url}{downstream_path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            upstream = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body if body else None,
            )
        except httpx.RequestError as exc:
            return JSONResponse(
                {"detail": f"Upstream service unavailable: {exc}"},
                status_code=503,
            )

    response_headers = {}
    if upstream.headers.get("content-type"):
        response_headers["content-type"] = upstream.headers["content-type"]

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
    )
