import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SERP_API_KEY: str
    GROQ_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str # Using service key for backend operations

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

