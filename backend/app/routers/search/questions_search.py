from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.database import engine
from app.models import Question
from app.services.search.generator_search import generate_batch
from app.services.search.evaluator_search import evaluate_search_submission
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

class CustomSearchCreate(BaseModel):
    prompt: str
    options: Optional[List[str]] = []
    # If custom needs more fields, add here. currently api.ts passes { prompt, options? }

@router.post("/generate")
def generate_search_questions(count: int = Query(1, ge=1, le=50), db: Session = Depends(get_db)):
    """
    Generates new search problem identification questions.
    """
    raw_questions = generate_batch(count=count)
    created = []

    for qd in raw_questions:
        # qd keys: id, type, prompt, problem_name, instance_text, options, correct_strategy, correct_heuristic, explanation
        
        # Prepare data dict for the generic JSON field
        data_payload = {
            "problem_name": qd.get("problem_name"),
            "instance_text": qd.get("instance_text"),
            "options": qd.get("options", []),
            "correct_strategy": qd.get("correct_strategy"),
            "correct_heuristic": qd.get("correct_heuristic"),
            "explanation": qd.get("explanation")
        }

        # Create DB object
        question = Question(
            id=qd["id"],
            type=qd["type"],  # "search_problem_identification"
            prompt=qd["prompt"],
            data=data_payload
        )
        
        db.add(question)
        created.append(question)
    
    db.commit()
    for q in created:
        db.refresh(q)
    
    return {"questions": created}

@router.post("/create_custom")
def create_custom_search_question(payload: CustomSearchCreate, db: Session = Depends(get_db)):
    """
    Creates a custom search question (e.g. user defined text).
    """
    # Assuming custom entries have null strategy for now, or we'd need more fields
    data_payload = {
        "is_custom": True,
        "options": payload.options
    }

    question = Question(
        type="search_problem_identification_custom", # Distinct type for custom
        prompt=payload.prompt,
        data=data_payload
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

# If there are specific evaluation endpoints not covered by generic /api/questions/{qid}/answer
# we can add them here. But generic evaluator usually handles it based on type.
