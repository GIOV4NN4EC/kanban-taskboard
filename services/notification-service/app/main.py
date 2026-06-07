from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database.session import init_db
from app.routes.activity_routes import router as activity_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Notification Service",
    description="Activity log and notifications",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(activity_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "notification-service"}
