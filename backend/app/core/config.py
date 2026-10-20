from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password123@localhost:5432/talent_afrique"
    test_database_url: str = "postgresql://password123@localhost:5432/talent_afrique_test"
    secret_key: str = "changeme-en-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    resend_api_key: str = ""
    frontend_url: str = "http://localhost:5173"
    cv_storage_dir: str = "./storage/cvs"

    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
