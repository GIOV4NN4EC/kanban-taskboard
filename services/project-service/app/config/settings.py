from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://project:project@localhost:5432/project_db"
    auth_url: str = "http://localhost:8001"
    notification_url: str = "http://localhost:8004"


settings = Settings()
