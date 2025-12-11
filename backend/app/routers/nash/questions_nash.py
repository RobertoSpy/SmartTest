from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status, Request
from sqlmodel import Session, select, desc ### MODIFICAT: Am importat `desc` pentru sortare ###
from app.database import engine
from app.models import Question, Evaluation
from app.services.nash.generator_nash import generate_batch
from app.services.nash.evaluator_nash import parse_nfg_answer, evaluate_normal_form
import json
from typing import Optional

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

def _hide_solution_from_question_json(q_json: dict) -> dict:
    q = dict(q_json)
    data = q.get("data")
    if isinstance(data, dict):
        d = dict(data)
        d.pop("equilibria", None)
        q["data"] = d
    return q

# Funcția de generare rămâne neschimbată, este deja corectă
@router.post("/generate")
def generate(count: int = Query(1, ge=1, le=1000),
             distribution: Optional[str] = Query(None, description="Optional distribution string e.g. '2x2:50,2x3:25,3x3:20,4x4:5'"),
             ensure: str = Query("any", regex="^(any|at_least_one|none)$"),
             target_fraction_no_ne: Optional[float] = Query(None, ge=0.0, le=1.0, description="Ex: 0.5 pentru 50% întrebări fără NE pur"),
             db: Session = Depends(get_db)):
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

    qdatas = generate_batch(
        count=count,
        distribution=parsed_dist,
        ensure=ensure,
        target_fraction_no_ne=target_fraction_no_ne
    )

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

    return {"created": [ _hide_solution_from_question_json(json.loads(q.json())) for q in created ]}


@router.get("/")
def list_questions(type: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Listează întrebările. Dacă se trece ?type=... se filtrează după câmpul Question.type,
    altfel se întorc toate întrebările ordonate descrescător după created_at.
    """
    statement = select(Question)
    if type:
        statement = statement.where(Question.type == type)
    statement = statement.order_by(desc(Question.created_at))
    questions = db.exec(statement).all()
    return {"questions": [ _hide_solution_from_question_json(json.loads(item.json())) for item in questions ]}

### NOU: Am adăugat endpoint-ul pentru ștergere ###
@router.delete("/{qid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(qid: str, db: Session = Depends(get_db)):
    # Întâi ștergem evaluările asociate pentru a evita erori de foreign key
    evaluations_to_delete = db.exec(select(Evaluation).where(Evaluation.question_id == qid)).all()
    for evaluation in evaluations_to_delete:
        db.delete(evaluation)
    
    # Apoi ștergem întrebarea
    question_to_delete = db.get(Question, qid)
    if not question_to_delete:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question_to_delete)
    db.commit()
    # Returnăm un răspuns gol cu status 204 No Content
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{qid}")
def get_question(qid: str, db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return _hide_solution_from_question_json(json.loads(q.json()))

@router.post("/{qid}/submit")
async def submit_answer(
    qid: str,
    request: Request,
    submission_text: str = Form(default=""),
    submission_pdf: UploadFile = File(default=None),
    db: Session = Depends(get_db),
):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    content_type = request.headers.get("content-type", "")
    # JSON path: expected for student_input questions (submission_matrix etc.)
    if content_type and "application/json" in content_type:
        body = await request.json()
        submission_matrix = body.get("submission_matrix")
        claimed_equilibria = body.get("claimed_equilibria")
        submission_text_body = body.get("submission_text", "")

        # Only custom student-input questions support JSON submit
        if q.type == "normal_form_game_custom_student_input":
            from app.services.nash_custom.evaluator_custom_nash import evaluate_custom_submission

            q_json = json.loads(q.json())
            try:
                eval_res = evaluate_custom_submission(
                    q_json,
                    submission_matrix=submission_matrix,
                    claimed_equilibria=claimed_equilibria,
                    submission_text=submission_text_body,
                )
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

            # extract inner result
            inner_res = eval_res.get("result", {})

            # persist evaluation
            meta_dict = {
                "computed_has": inner_res.get("has_pure_nash"),
                "computed_equilibria": inner_res.get("equilibria"),
                "matched_equilibria": eval_res.get("matched"),
                "missing_equilibria": eval_res.get("missing"),
                "extra_equilibria": eval_res.get("extra"),
                "note": eval_res.get("explanation"),
            }
            eval_record = Evaluation(
                question_id=q.id,
                submission_text=submission_text_body,
                submission_positions=eval_res.get("matched", []),
                score_percent=eval_res.get("score_percent", 0),
                meta=meta_dict,
            )
            db.add(eval_record)
            db.commit()
            db.refresh(eval_record)
            return {"result": eval_res, "evaluation_id": eval_record.id}

        raise HTTPException(status_code=400, detail="JSON submit is only supported for custom student-input questions")

    # Form / multipart path (existing behavior): extract text (form or PDF) and evaluate using evaluate_normal_form
    text = submission_text or ""
    if submission_pdf and submission_pdf.filename:
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(submission_pdf.file)
            pages_text = [p.extract_text() or "" for p in reader.pages]
            text = f"{text}\n" + "\n".join(pages_text) if text else "\n".join(pages_text)
        except Exception:
            # ignore PDF extraction errors and continue with available text
            pass

    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty submission")

    q_json = json.loads(q.json())
    question_data = q_json.get("data", {})
    eval_res = evaluate_normal_form(question_data, text)

    meta_dict = {
        "provided_has": eval_res.get("provided_has"),
        "provided_equilibria": eval_res.get("provided_equilibria"),
        "matched_equilibria": eval_res.get("matched_equilibria"),
        "missing_equilibria": eval_res.get("missing_equilibria"),
        "extra_equilibria": eval_res.get("extra_equilibria"),
        "note": eval_res.get("note"),
    }

    eval_record = Evaluation(
        question_id=q.id,
        submission_text=text,
        submission_positions=eval_res.get("provided_equilibria", []),
        score_percent=eval_res.get("score_percent", 0),
        meta=meta_dict,
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)

    return {"result": eval_res, "evaluation_id": eval_record.id}