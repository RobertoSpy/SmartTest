from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlmodel import Session, select
from ..database import engine
from ..models import Question, Evaluation
# Folosim generate_batch pentru a produce seturi conform distribuției
from ..services.generator import generate_batch
from ..services.evaluator import parse_nfg_answer, evaluate_normal_form
import json
from typing import Optional

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

def _hide_solution_from_question_json(q_json: dict) -> dict:
    """
    Return a copy of question JSON with any ground-truth keys (like 'equilibria') removed
    so clients cannot see the solution.
    """
    q = dict(q_json)
    data = q.get("data")
    if isinstance(data, dict):
        d = dict(data)
        d.pop("equilibria", None)  # remove correct answers
        q["data"] = d
    return q

@router.post("/generate")
def generate(count: int = Query(1, ge=1, le=1000),
             distribution: Optional[str] = Query(None, description="Optional distribution string e.g. '2x2:50,2x3:25,3x3:20,4x4:5'"),
             ensure: str = Query("any", regex="^(any|at_least_one|none)$"),
             db: Session = Depends(get_db)):
    """
    Generate `count` questions. Optional distribution query param with comma-separated kv pairs.
    Examples:
      /generate?count=100
      /generate?count=100&distribution=2x2:50,2x3:25,3x3:20,4x4:5
      /generate?count=20&ensure=at_least_one
    """
    # parse distribution if provided
    parsed_dist = None
    if distribution:
        parsed_dist = {}
        try:
            parts = [p.strip() for p in distribution.split(",") if p.strip()]
            for p in parts:
                k, v = p.split(":")
                parsed_dist[k.strip()] = float(v.strip())
        except Exception:
            raise HTTPException(status_code=400, detail="Bad distribution format. Use '2x2:50,2x3:25,...'")

    # generate batch according to distribution and ensure flag
    qdatas = generate_batch(count=count, distribution=parsed_dist, ensure=ensure)

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
                "equilibria": qdata["equilibria"]
            }
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        created.append(q)

    # return created questions but hide solutions
    return {"created": [ _hide_solution_from_question_json(json.loads(q.json())) for q in created ]}

@router.get("/")
def list_questions(db: Session = Depends(get_db)):
    q = db.exec(select(Question)).all()
    return {"questions": [ _hide_solution_from_question_json(json.loads(item.json())) for item in q ]}

@router.get("/{qid}")
def get_question(qid: str, db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return _hide_solution_from_question_json(json.loads(q.json()))

@router.post("/{qid}/submit")
async def submit_answer(qid: str, submission_text: str = Form(default=""), submission_pdf: UploadFile = File(default=None), db: Session = Depends(get_db)):
    # evaluation uses stored equilibria from DB (hidden from clients)
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    text = submission_text or ""
    if submission_pdf and submission_pdf.filename:
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(submission_pdf.file)
            pages_text = []
            for p in reader.pages:
                t = p.extract_text() or ""
                pages_text.append(t)
            text = "\n".join([text, "\n".join(pages_text)]) if text else "\n".join(pages_text)
        except Exception:
            pass

    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty submission")

    q_json = json.loads(q.json())
    question_data = q_json.get("data", {})
    eval_res = evaluate_normal_form(question_data, text)

    meta_dict = {
        "provided_has": eval_res["provided_has"],
        "provided_equilibria": eval_res["provided_equilibria"],
        "matched_equilibria": eval_res["matched_equilibria"],
        "missing_equilibria": eval_res["missing_equilibria"],
        "extra_equilibria": eval_res["extra_equilibria"],
        "note": eval_res["note"],
    }

    eval_record = Evaluation(
        question_id=q.id,
        submission_text=text,
        submission_positions=eval_res.get("provided_equilibria", []),
        score_percent=eval_res["score_percent"],
        meta=meta_dict
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)

    return {"result": eval_res, "evaluation_id": eval_record.id}