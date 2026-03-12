from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str
    anthropic_model: str = "claude-3-haiku-20240307"

    class Config:
        env_file = ".env"


settings = Settings()
