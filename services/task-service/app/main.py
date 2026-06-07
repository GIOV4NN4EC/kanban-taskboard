from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database.session import init_db
from app.routes.comment_routes import router as comment_router
from app.routes.task_routes import router as task_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Task Service",
    description="Task management for Kanban boards",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(task_router)
app.include_router(comment_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "task-service"}
