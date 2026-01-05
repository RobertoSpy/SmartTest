from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select, desc
from app.database import engine
from app.models import Question, Evaluation
from app.services.gametheory.generator_gametheory import generate_gametheory_question
from app.services.gametheory.evaluator_gametheory import evaluate_gametheory
import json
from typing import Optional, List

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

def _hide_solution(q_json: dict) -> dict:
    q = dict(q_json)
    data = q.get("data", {})
    if isinstance(data, dict):
        d = dict(data)
        d.pop("solution_text", None)
        d.pop("metadata", None) 
        q["data"] = d
    return q

@router.post("/generate")
def generate(count: int = Query(1, ge=1, le=50), db: Session = Depends(get_db)):
    qdatas = generate_gametheory_question(count=count)
    
    created = []
    for qdata in qdatas:
        q = Question(
            id=qdata["id"],
            type=qdata["type"],
            prompt=qdata["prompt"],
            data={
                "payoff_matrix": qdata["payoff_matrix"],
                "row_labels": qdata["row_labels"],
                "col_labels": qdata["col_labels"],
                "matrix_lines": qdata["matrix_lines"],
                "matrix_lines": qdata["matrix_lines"],
                "solution_text": qdata["solution_text"],
                "explanation": qdata.get("explanation", ""),
                "metadata": qdata["metadata"]
            }
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        created.append(q)
        
    return {"created": [_hide_solution(json.loads(q.json())) for q in created]}

@router.post("/{qid}/submit")
def submit_answer(qid: str, submission_text: str = Query(...), db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    q_json = json.loads(q.json())
    question_data = q_json.get("data", {})
    
    result = evaluate_gametheory(question_data, submission_text)
    
    eval_record = Evaluation(
        question_id=q.id,
        submission_text=submission_text,
        score_percent=result["score_percent"],
        meta={"feedback": result["feedback"]}
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)
    
    return {"result": result, "evaluation_id": eval_record.id}
