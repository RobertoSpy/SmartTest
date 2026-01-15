# modifică endpointul generate pentru a accepta fixed_rows / fixed_cols
from fastapi import APIRouter, Query, Request
from typing import Optional, Dict, Any, List
from sqlmodel import Session
from app.database import engine
from app.models import Question
import uuid
from datetime import datetime
from app.services.nash_custom import generator_custom_nash

router = APIRouter()  # router fără prefix intern, main.py va include cu prefixul dorit

def get_db_session():
    return Session(engine)

@router.post("/generate")
def generate_questions_endpoint(
    request: Request,
    count: int = Query(1, ge=1),
    save_as: Optional[str] = Query(None),
    fixed_rows: Optional[int] = Query(None),
    fixed_cols: Optional[int] = Query(None),
    difficulty: Optional[str] = Query("medium"),
):
    # debug print
    try:
        print("generate called with", dict(request.query_params))
    except Exception:
        pass

    created_items: List[Dict[str, Any]] = []
    with get_db_session() as db:
        
        qdatas = generator_custom_nash.generate_batch(
            count=count,
            distribution=None,
            student_input=(save_as == "normal_form_game_custom_student_input"),
            fixed_rows=fixed_rows,
            fixed_cols=fixed_cols,
            difficulty=difficulty,
        )

        for qd in qdatas:
            if save_as == "normal_form_game_custom_student_input":
                q = Question(
                    id=qd.get("id") or str(uuid.uuid4()),
                    type="normal_form_game_custom_student_input",
                    prompt=qd.get("prompt"),
                    data={
                        "rows": qd.get("rows"),
                        "cols": qd.get("cols"),
                        "target_has_pure": qd.get("target_has_pure"),
                        "row_labels": qd.get("row_labels"),
                        "col_labels": qd.get("col_labels"),
                        "example_equilibria": qd.get("equilibria_example"),
                        "example_has_pure": qd.get("has_pure_example"),
                    },
                )
            else:
                q = Question(
                    id=qd.get("id") or str(uuid.uuid4()),
                    type="normal_form_game",
                    prompt=qd.get("prompt") or f"Joc generat {qd.get('rows', 0)}x{qd.get('cols', 0)}",
                    data={
                        "payoff_matrix": qd.get("payoff_matrix"),
                        "rows": qd.get("rows"),
                        "cols": qd.get("cols"),
                        "equilibria": qd.get("equilibria") or qd.get("equilibria_example"),
                        "has_equilibrium": bool(qd.get("equilibria") or qd.get("has_pure_example")),
                    },
                )

            db.add(q)
            db.commit()
            db.refresh(q)
            created_items.append({
                "id": q.id,
                "type": q.type,
                "created_at": q.created_at.isoformat(),
                "prompt": q.prompt,
                "data": q.data,
            })

    return {"created": created_items}