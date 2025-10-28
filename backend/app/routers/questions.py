from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from ..database import engine
from ..models import Question, Evaluation
from ..services.generator import generate_n_queens_question
from ..services.evaluator import parse_positions_from_text, evaluate_n_queens
from fpdf import FPDF
import json

router = APIRouter()

def get_db():
    with Session(engine) as session:
        yield session

@router.post("/generate")
def generate(count: int = 1, db: Session = Depends(get_db)):
    created = []
    for _ in range(count):
        qdata = generate_n_queens_question()
        q = Question(
            id=qdata["id"],
            type=qdata["type"],
            n=qdata["n"],
            prompt=qdata["prompt"],
            correct_positions=qdata["correct_positions"],
            board_lines=qdata["board_lines"],
            recommended_strategy=qdata.get("recommended_strategy"),
            strategy_rationale=qdata.get("strategy_rationale"),
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        created.append(q)
    return {"created": [json.loads(q.json()) for q in created]}

@router.get("/")
def list_questions(db: Session = Depends(get_db)):
    q = db.exec(select(Question)).all()
    return {"questions": [json.loads(item.json()) for item in q]}

@router.get("/{qid}")
def get_question(qid: str, db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return json.loads(q.json())

def make_pdf_bytes(question: Question) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 8, f"Întrebare (ID: {question.id})", ln=1)
    pdf.multi_cell(0, 6, question.prompt)
    pdf.ln(4)
    pdf.cell(0, 6, f"Dimension: {question.n}x{question.n}", ln=1)
    pdf.ln(4)
    pdf.cell(0, 6, "Exemplu poziție corectă (doar pentru evaluator):", ln=1)
    for line in question.board_lines:
        pdf.cell(0, 6, line, ln=1)
    return pdf.output(dest='S').encode('latin-1')

@router.get("/{qid}/download")
def download_question(qid: str, db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    pdf_bytes = make_pdf_bytes(q)
    return {"pdf_bytes_base64": pdf_bytes.hex()}

@router.post("/{qid}/submit")
async def submit_answer(qid: str, submission_text: str = Form(default=""), submission_pdf: UploadFile = File(default=None), db: Session = Depends(get_db)):
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
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parse error: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty submission")

    positions = parse_positions_from_text(text)
    eval_res = evaluate_n_queens(json.loads(q.json()), positions)

    # Be tolerant to both old and new evaluator result keys
    # prefer 'num_matched' (new evaluator) then 'num_correct' (old)
    num_correct = eval_res.get("num_matched")
    if num_correct is None:
        num_correct = eval_res.get("num_correct", 0)

    conflicts = eval_res.get("conflicts", 0)
    penalty = eval_res.get("penalty", conflicts)
    score_percent = eval_res.get("score_percent", eval_res.get("score_percent", 0))

    # build meta dict (use internal model field name 'meta' to construct Evaluation)
    meta_dict = {
        "num_correct": num_correct,
        "conflicts": conflicts,
        "penalty": penalty,
        # include extra helpful info if present
        "percent_matched": eval_res.get("percent_matched"),
        "parsed_positions": eval_res.get("parsed_positions") or eval_res.get("parsed_positions", positions),
        "used_normalization": eval_res.get("used_normalization"),
        "note": eval_res.get("note")
    }

    # create Evaluation: set internal attribute 'meta' (models use `meta` as internal name)
    eval_record = Evaluation(
        question_id=q.id,
        submission_text=text,
        submission_positions=positions,
        score_percent=score_percent,
        meta=meta_dict
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)

    # Return evaluator result and evaluation id to client
    return {"result": eval_res, "evaluation_id": eval_record.id}