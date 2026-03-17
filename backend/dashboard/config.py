from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://capy:capy@localhost:5432/capy_dev"
    use_mock: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
