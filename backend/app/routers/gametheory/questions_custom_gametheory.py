from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database import engine
from app.models import Question
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime
from app.services.gametheory.custom_gametheory import solve_gametheory_scenario

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

class SolveRequest(BaseModel):
    matrix: List[List[List[int]]]
    q_type: str
    row_labels: Optional[List[str]] = None
    col_labels: Optional[List[str]] = None
    player_row: str = "Player A"
    player_col: str = "Player B"

@router.post("/solve")
def solve_custom(req: SolveRequest, db: Session = Depends(get_db)):
    # 1. Solve the scenario
    result = solve_gametheory_scenario(
        matrix=req.matrix,
        q_type=req.q_type,
        row_labels=req.row_labels,
        col_labels=req.col_labels,
        player_row=req.player_row,
        player_col=req.player_col
    )
    
    # 2. Save as a Question for history
    q_id = str(uuid.uuid4())
    
    # Construct a friendly prompt
    prompt_text = f"Game Theory Custom Solver: {req.q_type.replace('_', ' ').title()}"
    
    q = Question(
        id=q_id,
        type=f"game_theory_{req.q_type}", # store exact type or generic
        prompt=prompt_text,
        data={
            "payoff_matrix": req.matrix,
            "row_labels": req.row_labels,
            "col_labels": req.col_labels,
            "player_row": req.player_row,
            "player_col": req.player_col,
            "q_type": req.q_type,
            "solution": result["solution"],
            "explanation": result["explanation"],
            "is_solver": True # Flag to indicate this was a solver run
        }
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # Return result + question info
    return {
        "solution": result["solution"],
        "explanation": result["explanation"],
        "question_id": q.id,
        "created_at": q.created_at
    }
