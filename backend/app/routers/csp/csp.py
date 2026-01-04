from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List
from app.services.csp.evaluator_csp import CSP, backtracking_fc
import random
router = APIRouter(prefix="/csp", tags=["CSP"])


class CSPRequest(BaseModel):
    variables: List[str]
    domains: Dict[str, List[int]]
    partial_assignment: Dict[str, int]
    constraints: List[Dict[str, str]]

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

    solutions = backtracking_fc(csp, req.partial_assignment.copy(), req.domains, steps)

    return {
        "solutions": solutions,  # Returnăm toate soluțiile găsite
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
    constraints = []
    for i in range(len(variables) - 1):
        x = variables[i]
        y = variables[i + 1]
        condition = random.choice(conditions)  # Alegem aleatoriu o condiție
        constraints.append({"var1": x, "var2": y, "condition": condition})

    # Crearea problemei CSP
    csp = CSP(
        variables=variables,
        domains=domains,
        constraints=constraints,
    )

    # Creăm pașii pentru backtracking și soluția
    steps = []
    assignment = {}

    solution = backtracking_fc(csp, assignment, domains, steps)

    # Returnăm problema generată și soluția
    return {
        "problem": {
            "variables": variables,
            "domains": domains,
            "constraints": constraints
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

    correct_solutions = backtracking_fc(csp, {}, req.domains, steps)

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

    return {
        "is_correct": score == 100,
        "score": score,
        "correct_solutions": correct_solutions,
        "feedback": (
            "Răspuns corect!" if score == 100
            else f"{correct}/{total} variabile corecte."
        )
    }
