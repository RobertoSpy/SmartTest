
from .config import settings
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = str(settings.DATABASE_URL)
# create_engine echo True for dev
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

def get_session():
    with Session(engine) as session:
        yield session