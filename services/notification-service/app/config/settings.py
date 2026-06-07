from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://notif:notif@localhost:5432/notification_db"
    project_url: str = "http://localhost:8002"


settings = Settings()
