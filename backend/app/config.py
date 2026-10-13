# =========================================================================
# DYNAMIC CONFIGURATIONS LAYER (backend/app/config.py)
# =========================================================================
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

def sanitize_database_url(url: str) -> str:
    if not url:
        return ""
    url = url.strip()
    # Auto-convert synchronous pyodbc or generic mssql dialect to async aioodbc
    if url.startswith("mssql+pyodbc://"):
        url = "mssql+aioodbc://" + url[len("mssql+pyodbc://"):]
    elif url.startswith("mssql://"):
        url = "mssql+aioodbc://" + url[len("mssql://"):]

    # Ensure ODBC driver parameter is present for aioodbc
    if "mssql+aioodbc" in url and "driver=" not in url.lower():
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}driver=ODBC+Driver+18+for+SQL+Server"
    return url

class Settings(BaseSettings):
    PROJECT_NAME: str = "HRMS Enterprise"
    APP_NAME: str = "HRMS Enterprise"
    API_V1_STR: str = "/api/v1"
    
    # Missing Variables Configured Here to Prevent AttributeErrors
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    CORS_ORIGINS: list = ["*"]
    
    # Security Layer
    # Azure App Service se read karega, na milne par default value lega
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_TOKEN_KEY_123!")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 Days

    # Database Settings Layer (Dynamic Switch)
    # Local Docker me ye local config lega, aur Azure me seedhe cloud DB se judega
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mssql+aioodbc://sa:Enter%40123@sqlserver:1433/hrms_db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no"
    ) 

    DEBUG: bool = False
    DB_HOST: str | None = None
    DB_PORT: int | str | None = None
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None

    def get_database_url(self) -> str:
        return sanitize_database_url(self.DATABASE_URL)

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
