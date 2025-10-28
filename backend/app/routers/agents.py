from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..models import AgentLog
from ..database import engine
import json

router = APIRouter()

@router.get("/")
def list_agents():
    with Session(engine) as session:
        items = session.exec(select(AgentLog)).all()
        return {"agents_log": [json.loads(item.json()) for item in items]}

@router.post("/")
def add_agent_log(entry: AgentLog):
    with Session(engine) as session:
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return json.loads(entry.json())