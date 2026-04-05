from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "lobster-claw-api"
    debug: bool = True
    database_url: str = "sqlite:///./lobster_claw.db"
    base_dir: Path = Path(__file__).resolve().parents[2]
    runtime_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "runtime")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
settings.runtime_dir.mkdir(parents=True, exist_ok=True)
(settings.runtime_dir / "backups").mkdir(parents=True, exist_ok=True)
