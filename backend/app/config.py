# =========================================================================
# DYNAMIC CONFIGURATIONS LAYER (backend/app/config.py)
# =========================================================================
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # System App Settings
    PROJECT_NAME: str = "SHIVMANI HRMS Enterprise API"
    API_V1_STR: str = "/api/v1"
    
    # Security Layer
    # Azure App Service se read karega, na milne par default value lega
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_TOKEN_KEY_123!")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 Days

    # Database Settings Layer (Dynamic Switch)
    # Local Docker me ye local config lega, aur Azure me seedhe cloud DB se judega
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mssql+pyodbc://sa:Enter@123@sqlserver:1433/hrms_db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no"
    ) 

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
