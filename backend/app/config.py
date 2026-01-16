from pydantic import BaseSettings, AnyUrl

class Settings(BaseSettings):
    DATABASE_URL: AnyUrl
    # adaugă aici orice alte secrete/config necesare
    # JWT_SECRET: str = "changeme"
    # DEBUG: bool = False

    class Config:
        env_file = "../.env"  # sau ".env" dacă .env este în folderul backend; ajustați calea după cum e organizat

settings = Settings()