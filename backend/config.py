from pydantic_settings import BaseSettings
from typing import List, Optional
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/m3_platform"
    SECRET_KEY: str = "m3-family-office-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:5173"]'
    ANTHROPIC_API_KEY: Optional[str] = None

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
