from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database.session import init_db
from app.routes import internal_routes, project_routes


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Project Service",
    description="Project and membership management",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(project_routes.router)
app.include_router(internal_routes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "project-service"}
