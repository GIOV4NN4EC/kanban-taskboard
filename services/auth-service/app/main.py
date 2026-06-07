from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database.session import init_db
from app.routes import auth_routes, user_routes


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Auth Service",
    description="User authentication and profile management",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth_routes.router)
app.include_router(user_routes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "auth-service"}
