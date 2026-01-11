from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
import uuid
from datetime import datetime, timezone

def now_utc():
    return datetime.now(timezone.utc)

def gen_uuid() -> str:
    return str(uuid.uuid4())

class Question(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=gen_uuid, primary_key=True, index=True)
    type: str
    prompt: str
    # generic JSON field to store payoff matrices, labels etc.
    data: Optional[Dict[str, Any]] = Field(sa_column=Column(JSONB), default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)

class Evaluation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: str = Field(foreign_key="question.id", index=True)
    submission_text: Optional[str] = None
    submission_positions: Optional[List[List[int]]] = Field(sa_column=Column(JSONB), default_factory=list)
    score_percent: Optional[float] = None
    # internal attribute `meta`, but map to DB column named "metadata" and expose API name "metadata"
    meta: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        sa_column=Column("metadata", JSONB),
        alias="metadata"
    )
    created_at: datetime = Field(default_factory=now_utc)

class AgentLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    agent: Optional[str] = None
    date: datetime = Field(default_factory=now_utc)
    purpose: Optional[str] = None
    prompt: Optional[str] = None
    response_summary: Optional[str] = None
    transcript: Optional[str] = None
    authors: Optional[List[str]] = Field(sa_column=Column(JSONB), default_factory=list)