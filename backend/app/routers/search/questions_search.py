from fastapi import APIRouter, Depends, HTTPException, Request, Form
from sqlmodel import Session, select, desc
from app.database import engine
from app.models import Question, Evaluation
from app.services.search.generator_search import generate_batch
from app.services.search.evaluator_search import evaluate_search_submission
import json
from typing import Optional

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

def _hide_solution(q_json: dict) -> dict:
    q = dict(q_json)
    data = q.get("data", {})
    if isinstance(data, dict):
        d = dict(data)
        d.pop("correct_strategy", None)
        d.pop("correct_heuristic", None)
        d.pop("explanation", None)
        q["data"] = d
    return q

@router.post("/generate")
def generate(count: int = 1, db: Session = Depends(get_db)):
    qdatas = generate_batch(count=count)
    
    created = []
    for qdata in qdatas:
        q = Question(
            id=qdata["id"],
            type=qdata["type"],
            prompt=qdata["prompt"],
            data={
                "problem_name": qdata["problem_name"],
                "instance_text": qdata["instance_text"],
                "options": qdata["options"],
                "correct_strategy": qdata["correct_strategy"],
                "correct_heuristic": qdata.get("correct_heuristic"),
                "explanation": qdata.get("explanation")
            }
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        created.append(q)
        
    return {"created": [_hide_solution(json.loads(q.json())) for q in created]}

@router.post("/{qid}/submit")
async def submit_answer(
    qid: str,
    request: Request,
    submission_text: str = Form(default=""),
    db: Session = Depends(get_db)
):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Check for JSON content first (useful for pure frontend calls)
    content_type = request.headers.get("content-type", "")
    if content_type and "application/json" in content_type:
        body = await request.json()
        submission_text = body.get("submission_text", submission_text)

    q_json = json.loads(q.json())
    question_data = q_json.get("data", {})
    
    eval_res = evaluate_search_submission(question_data, submission_text)
    
    eval_record = Evaluation(
        question_id=q.id,
        submission_text=submission_text,
        score_percent=eval_res.get("score_percent", 0),
        meta={
            "correct": eval_res.get("correct"),
            "explanation": eval_res.get("explanation")
        }
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)
    
    return {"result": eval_res, "evaluation_id": eval_record.id}
