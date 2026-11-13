from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/pathwise"
    
    # OpenRouter API
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
        OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b"
    
    # App
    APP_NAME: str = "PathWise"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()