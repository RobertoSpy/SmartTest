from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from app.services.csp.evaluator_csp import CSP, solve_csp_wrapper
from app.database import engine
from app.models import Question
from sqlmodel import Session
import random
import uuid
from datetime import datetime

router = APIRouter(prefix="/csp", tags=["CSP"])


def get_db():
    with Session(engine) as session:
        yield session

class CSPRequest(BaseModel):
    variables: List[str]
    domains: Dict[str, List[int]]
    partial_assignment: Dict[str, int]
    constraints: List[Dict[str, str]]
    algorithm: str = "fc" # fc, mrv, ac3

class CSPCheckRequest(BaseModel):
    variables: List[str]
    domains: Dict[str, List[int]]
    constraints: List[Dict[str, str]]
    user_solution: Dict[str, int]

class CSPGenerateRequest(BaseModel):
    variables: List[str] = []
    domains: Dict[str, List[int]] = {}


@router.post("/solve")
def solve_csp(req: CSPRequest):
    constraints = []

    for constraint in req.constraints:
        x = constraint["var1"]
        y = constraint["var2"]
        c = constraint["condition"]

        if c == "!=":
            constraints.append((x, y, lambda a, b: a != b))
        elif c == "=":
            constraints.append((x, y, lambda a, b: a == b))
        elif c == ">":
            constraints.append((x, y, lambda a, b: a > b))
        elif c == "<":
            constraints.append((x, y, lambda a, b: a < b))

    csp = CSP(req.variables, req.domains, constraints)
    steps = []

    try:
        # Use wrapper with selected algorithm
        solutions = solve_csp_wrapper(csp, req.partial_assignment.copy(), req.domains, steps, algorithm=req.algorithm)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Solver Error: {str(e)}")

    # --- Save to History (CSP Custom) ---
    try:
        with Session(engine) as db:
            q_id = str(uuid.uuid4())
            prompt_text = f"CSP Custom Solver ({req.algorithm.upper()}): {len(req.variables)} vars"
            
            q = Question(
                id=q_id,
                type="csp_custom",
                prompt=prompt_text,
                created_at=datetime.utcnow(),
                data={
                    "variables": req.variables,
                    "domains": req.domains,
                    "partial_assignment": req.partial_assignment,
                    "constraints": req.constraints,
                    "solutions": solutions,
                    "steps": steps, # Optional
                    "algorithm": req.algorithm
                }
            )
            db.add(q)
            db.commit()
    except Exception as e:
        print(f"Failed to save CSP history: {e}")

    return {
        "solutions": solutions,
        "steps": steps
    }


@router.post("/generate_problem")
def generate_csp_problem(req: CSPGenerateRequest):
    # Generăm variabile aleatorii (ex: X1, X2, X3)
    num_variables = random.randint(3, 5)  # Număr aleatoriu de variabile (3 până la 5)
    variables = [f"X{i+1}" for i in range(num_variables)]

    # Generăm domenii aleatorii pentru fiecare variabilă (ex: [1, 2, 3], [1, 2, 3, 4], etc.)
    domains = {var: random.sample(range(1, 6), random.randint(2, 4)) for var in variables}

    # Generăm constrângeri aleatorii (de ex: X1 != X2, X2 = X3, X3 > X4)
    conditions = ["!=", "=", ">", "<"]
    constraints_dicts = []
    
    # Logic to ensure valid structure
    for i in range(len(variables) - 1):
        x = variables[i]
        y = variables[i + 1]
        condition = random.choice(conditions)
        constraints_dicts.append({"var1": x, "var2": y, "condition": condition})

    # Prepare real constraints for solver (tuples with lambdas)
    real_constraints = []
    for constraint in constraints_dicts:
        c = constraint["condition"]
        x = constraint["var1"]
        y = constraint["var2"]
        if c == "!=":
            real_constraints.append((x, y, lambda a, b: a != b))
        elif c == "=":
            real_constraints.append((x, y, lambda a, b: a == b))
        elif c == ">":
            real_constraints.append((x, y, lambda a, b: a > b))
        elif c == "<":
            real_constraints.append((x, y, lambda a, b: a < b))

    # Crearea problemei CSP
    csp = CSP(
        variables=variables,
        domains=domains,
        constraints=real_constraints,
    )

    # Randomly select algorithm (33% chance each)
    algorithm = random.choice(["fc", "mrv", "ac3"])

    # Solve using selected algorithm
    steps = []
    assignment = {}
    solution = solve_csp_wrapper(csp, assignment, domains, steps, algorithm=algorithm)

    # --- Save to History (CSP Generated) ---
    try:
        with Session(engine) as db:
            q_id = str(uuid.uuid4())
            prompt_text = f"CSP Generated ({algorithm.upper()}): {len(variables)} vars"
            
            problem_struct = {
                "variables": variables,
                "domains": domains,
                "constraints": constraints_dicts,
                "algorithm": algorithm # Store algorithm
            }

            q = Question(
                id=q_id,
                type="csp_generated",
                prompt=prompt_text,
                created_at=datetime.utcnow(),
                data={
                    "problem": problem_struct,
                    "solution": solution,
                    "steps": steps
                }
            )
            db.add(q)
            db.commit()
    except Exception as e:
        print(f"Failed to save CSP generated history: {e}")

    # Returnăm problema generată și soluția
    return {
        "problem": {
            "variables": variables,
            "domains": domains,
            "constraints": constraints_dicts,
            "algorithm": algorithm
        },
        "solution": solution
    }


@router.post("/check_solution")
def check_csp_solution(req: CSPCheckRequest):
    constraints = []

    for constraint in req.constraints:
        x = constraint["var1"]
        y = constraint["var2"]
        c = constraint["condition"]

        if c == "!=":
            constraints.append((x, y, lambda a, b: a != b))
        elif c == "=":
            constraints.append((x, y, lambda a, b: a == b))
        elif c == ">":
            constraints.append((x, y, lambda a, b: a > b))
        elif c == "<":
            constraints.append((x, y, lambda a, b: a < b))

    csp = CSP(req.variables, req.domains, constraints)
    steps = []

    correct_solutions = solve_csp_wrapper(csp, {}, req.domains, steps, algorithm="fc")

    if not correct_solutions:
        return {
            "is_correct": False,
            "score": 0,
            "feedback": "Problema nu are soluție."
        }

    total = len(req.variables)
    correct = sum(
        1 for v in req.variables
        if any(solution.get(v) == req.user_solution.get(v) for solution in correct_solutions)
    )

    score = int((correct / total) * 100)

    # --- Generate detailed explanation based on constraints ---
    explanation_lines = []
    violation_found = False

    # Re-evaluate constraints on user solution to give specific feedback
    # We reconstruct the lambda checks for explanation purposes
    for constraint_def in req.constraints:
        var1 = constraint_def["var1"]
        var2 = constraint_def["var2"]
        cond = constraint_def["condition"]
        
        val1 = req.user_solution.get(var1)
        val2 = req.user_solution.get(var2)

        if val1 is None or val2 is None:
            # Skip unassigned
            continue

        satisfied = True
        if cond == "!=":
            satisfied = (val1 != val2)
        elif cond == "=":
            satisfied = (val1 == val2)
        elif cond == ">":
            satisfied = (val1 > val2)
        elif cond == "<":
            satisfied = (val1 < val2)

        if not satisfied:
            violation_found = True
            
            # Conditie text
            cond_text = cond
            if cond == "!=": cond_text = "diferit de"
            elif cond == "=": cond_text = "egal cu"
            elif cond == ">": cond_text = "mai mare decat"
            elif cond == "<": cond_text = "mai mic decat"

            explanation_lines.append(
                f"- Constrângere încălcată: {var1} {cond} {var2}.\n"
                f"  Tu ai ales {var1}={val1} și {var2}={val2}, dar regula cere ca {var1} să fie {cond_text} {var2}."
            )
        else:
             pass

    if not violation_found and score == 100:
        explanation_lines.append("Toate constrângerile sunt respectate. Soluția este validă!")
    elif not violation_found and score < 100:
        explanation_lines.append("Nu sunt încălcări directe ale constrângerilor între variabilele completate, dar soluția poate fi incompletă.")

    return {
        "is_correct": score == 100,
        "score": score,
        "correct_solutions": correct_solutions,
        "feedback": (
            "Răspuns corect!" if score == 100
            else f"{correct}/{total} variabile corecte."
        ),
        "explanation": "\n".join(explanation_lines)
    }
