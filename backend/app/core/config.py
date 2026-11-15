from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # .env in the project root (as the README says), or in backend/ when running from there
    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR.parent / ".env", BACKEND_DIR / ".env"), case_sensitive=True, extra="ignore"
    )

    # SQLite file in the backend folder, created on first start. docker-compose keeps it in a volume instead
    DATABASE_URL: str = f"sqlite:///{(BACKEND_DIR / 'pathwise.db').as_posix()}"

    # OpenRouter API
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it"

    # Road routing (OpenStreetMap data, no key needed). Empty disables it: distances and times are
    # then estimated from the straight-line distance.
    OSRM_URL: str = "https://router.project-osrm.org"
    OSRM_TIMEOUT_SECONDS: float = 10.0

    # Display currency: prices are calculated in EUR and converted only for text shown to the user.
    # Fixed rate for the MVP; keep in sync with EUR_TO_PLN in frontend/src/utils/currency.jsx
    EUR_TO_PLN_RATE: float = 4.25

    # Frontend origins allowed to call the API from the browser
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # App
    APP_NAME: str = "PathWise"
    DEBUG: bool = True


settings = Settings()
