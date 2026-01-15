from app.database import engine
from app.models import Question
from sqlmodel import Session, select
import json

def check_csp():
    with Session(engine) as session:
        statement = select(Question)
        all_qs = session.exec(statement).all()
        print(f"Total questions: {len(all_qs)}")
        
        csp_qs = [q for q in all_qs if "csp" in (q.type or "").lower()]
        print(f"Found {len(csp_qs)} CSP questions")
        
        for q in csp_qs:
            print(f"ID: {q.id}, Type: {q.type}, Created: {q.created_at}")
            # print(f"Data keys: {list(q.data.keys()) if q.data else 'No data'}")

if __name__ == "__main__":
    check_csp()
