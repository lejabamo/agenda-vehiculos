from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://vehiculos_user:vehiculos_pass@db:5432/vehiculos_db"

    # JWT
    SECRET_KEY: str = "cambia-esto-en-produccion-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas

    # App
    APP_NAME: str = "Agenda Vehículos SEDC"
    ENVIRONMENT: str = "development"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Email SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@educacion.cauca.gov.co"
    EMAIL_FROM_NAME: str = "Sistema de Vehículos SEDC"

    class Config:
        env_file = [".env", "../.env"]  # funciona desde backend/ y desde raíz del proyecto
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
