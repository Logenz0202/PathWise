from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/pathwise"

    # OpenRouter API
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it"

    # Display currency: prices are calculated in EUR and converted only for text shown to the user.
    # Fixed rate for the MVP; keep in sync with EUR_TO_PLN in frontend/src/utils/currency.jsx
    EUR_TO_PLN_RATE: float = 4.25

    # App
    APP_NAME: str = "PathWise"
    DEBUG: bool = True


settings = Settings()
