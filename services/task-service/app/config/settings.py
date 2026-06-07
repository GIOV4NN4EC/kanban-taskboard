from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://task:task@localhost:5432/task_db"
    project_url: str = "http://localhost:8002"
    notification_url: str = "http://localhost:8004"


settings = Settings()
