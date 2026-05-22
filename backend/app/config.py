from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    firebase_project_id: str | None = None
    firebase_service_account_json: str | None = None
    firebase_service_account_file: str | None = None
    firebase_web_api_key: str | None = None
    firebase_continue_url: str = "http://localhost:5173/verify-email"
    auth_return_verification_link: bool = False
    cors_origins: str = "http://localhost:5173"
    cors_origin_regex: str | None = r"http://(localhost|127\.0\.0\.1):[0-9]+"
    data_dir: Path = Path("backend/data")
    ai_ant_mock_mode: bool = True
    ai_ant_default_model: str = "colony-mock-router-v1"
    openai_api_key: str | None = None
    openai_default_model: str = "gpt-5-mini"
    openai_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
