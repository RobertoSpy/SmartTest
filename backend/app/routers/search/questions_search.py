from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.database import engine
from app.models import Question, Evaluation
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

class SearchSubmitRequest(BaseModel):
    submission_text: str

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
    Creates a custom search question (e.g. user defined text) and auto-solves it.
    """
    from app.services.search_custom.solver import solve_prompt
    solution = solve_prompt(payload.prompt)

    data_payload = {
        "is_custom": True,
        "is_solver": True, 
        "options": payload.options,
        "correct_strategy": solution.get("correct_strategy"),
        "correct_heuristic": solution.get("correct_heuristic"),
        "explanation": solution.get("explanation")
    }

    question = Question(
        type="search_problem_identification_custom", 
        prompt=payload.prompt,
        data=data_payload
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    # Return both the question and the identified solution for the UI
    return {
        "id": question.id,
        "type": question.type,
        "prompt": question.prompt,
        "data": question.data,
        "solution": solution
    }

@router.post("/{qid}/submit")
def submit_search_answer(qid: str, req: SearchSubmitRequest, db: Session = Depends(get_db)):
    """
    Validates the user's answer for a search question.
    """
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if not q.type.startswith("search_problem_identification"):
         raise HTTPException(status_code=400, detail="Not a search question")

    # Evaluate
    result = evaluate_search_submission(q.data, req.submission_text)
    
    # Persist evaluation
    eval_record = Evaluation(
        question_id=q.id,
        submission_text=req.submission_text,
        score_percent=result.get("score_percent", 0),
        meta={
            "explanation": result.get("explanation"),
            "correct": result.get("correct")
        }
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)
    
    return {
        "result": result,
        "evaluation_id": eval_record.id
    }
