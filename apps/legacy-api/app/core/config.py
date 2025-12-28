from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Work Order Pro"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "workorderpro"

    # AWS S3
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "eu-north-1"
    AWS_BUCKET_NAME: str | None = None

    SQLALCHEMY_DATABASE_URI: str | None = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: str | None, values: dict[str, any]) -> str:
        if isinstance(v, str) and v:
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            # Handle Render/Heroku 'postgres://' scheme
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            return v
        
        # Check for DATABASE_URL (common in Render/Heroku)
        import os
        db_url = os.getenv("DATABASE_URL")
        if db_url:
             if db_url.startswith("postgresql://"):
                return db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
             if db_url.startswith("postgres://"):
                return db_url.replace("postgres://", "postgresql+asyncpg://", 1)
             return db_url
             
        # Default to SQLite for local development reliability
        return "sqlite+aiosqlite:///./workorderpro.db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
