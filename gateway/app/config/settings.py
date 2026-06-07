from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    auth_url: str = "http://localhost:8001"
    project_url: str = "http://localhost:8002"
    task_url: str = "http://localhost:8003"
    notification_url: str = "http://localhost:8004"


settings = Settings()
