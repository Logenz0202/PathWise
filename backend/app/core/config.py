from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # Database: localhost for running the API directly; docker-compose overrides it with the `db` service
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/pathwise"

    # OpenRouter API
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it"

    # Display currency: prices are calculated in EUR and converted only for text shown to the user.
    # Fixed rate for the MVP; keep in sync with EUR_TO_PLN in frontend/src/utils/currency.jsx
    EUR_TO_PLN_RATE: float = 4.25

    # Frontend origins allowed to call the API from the browser
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # App
    APP_NAME: str = "PathWise"
    DEBUG: bool = True


settings = Settings()
