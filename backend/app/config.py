import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "SHIVMANI HRMS"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database Configuration (MS SQL Server)
    DB_HOST: str = "127.0.0.1"
    DB_PORT: str = "1433"
    DB_USER: str = "sa"
    DB_PASSWORD: str = "Enter@123"
    DB_NAME: str = "hrms_db"
    DATABASE_URL: str = "mssql+aioodbc://sa:Enter%40123@127.0.0.1:1433/hrms_db?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"

    # Security & Secrets
    SECRET_KEY: str = "shivmani-enterprise-hrms-secret-key-2026-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        extra="ignore"
    )

settings = Settings()
