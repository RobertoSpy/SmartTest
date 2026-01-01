from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.minmax_service import minmax_service
from sqlmodel import Session
from app.database import engine
from app.models import Question
import uuid
from datetime import datetime

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

class GenerateRequest(BaseModel):
    difficulty: str = "easy"  # easy, medium, hard

class SubmitRequest(BaseModel):
    tree: Dict
    root_value: int
    visited_leaves: int

class CheckResponse(BaseModel):
    correct: bool
    correct_root_value: Optional[int] = None
    correct_visited_leaves: Optional[int] = None
    explanation: Optional[str] = None
    reference: Optional[str] = None
    message: str

@router.post("/generate")
def generate_question(req: GenerateRequest, db: Session = Depends(get_db)):
    """
    Generates a MinMax tree based on difficulty and saves it to DB for history.
    """
    tree = minmax_service.generate_tree(req.difficulty)
    
    # Save to History
    q_id = str(uuid.uuid4())
    q = Question(
        id=q_id,
        type="minmax_generated",
        prompt=f"MinMax Tree ({req.difficulty})",
        created_at=datetime.utcnow(),
        data={
            "tree": tree,
            "difficulty": req.difficulty
        }
    )
    db.add(q)
    db.commit()
    
    return {"tree": tree, "difficulty": req.difficulty, "id": q_id}

@router.post("/submit", response_model=CheckResponse)
def submit_answer(req: SubmitRequest):
    """
    Validates the user's answer against the server-calculated result.
    """
    real_root_val, real_visited_leaves, explanation = minmax_service.solve_alpha_beta(req.tree)
    
    correct_root = (req.root_value == real_root_val)
    correct_leaves = (req.visited_leaves == real_visited_leaves)
    is_correct = correct_root and correct_leaves
    
    msg = "Corect!" if is_correct else "Incorect. Vezi detaliile mai jos."
    
    return CheckResponse(
        correct=is_correct,
        correct_root_value=real_root_val if not is_correct else None,
        correct_visited_leaves=real_visited_leaves if not is_correct else None,
        explanation=explanation,
        reference="Russell, S., & Norvig, P. Artificial Intelligence: A Modern Approach. Capitolul 'Adversarial Search'.",
        message=msg
    )
