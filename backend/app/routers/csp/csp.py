from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List
from app.services.csp.evaluator_csp import CSP, backtracking_fc

router = APIRouter(prefix="/csp", tags=["CSP"])

class CSPRequest(BaseModel):
    variables: List[str]
    domains: Dict[str, List[int]]
    partial_assignment: Dict[str, int]
    constraints: List[Dict[str, str]]  # Primește constrângerile din frontend

@router.post("/solve")
def solve_csp(req: CSPRequest):
    constraints = []

    # Adăugăm constrângerile din frontend
    for constraint in req.constraints:
        x = constraint["var1"]
        y = constraint["var2"]
        condition = constraint["condition"]
        
        # Definirea constrângerii
        if condition == "!=":
            constraints.append((x, y, lambda a, b: a != b))
        elif condition == "=":
            constraints.append((x, y, lambda a, b: a == b))
        elif condition == ">":
            constraints.append((x, y, lambda a, b: a > b))
        elif condition == "<":
            constraints.append((x, y, lambda a, b: a < b))

    csp = CSP(
        variables=req.variables,
        domains=req.domains,
        constraints=constraints
    )

    steps = []
    assignment = req.partial_assignment.copy()

    solution = backtracking_fc(
        csp, assignment, req.domains, steps
    )

    return {
        "solution": solution,
        "steps": steps
    }

class CSPResponse(BaseModel):
    problem: Dict
    solution: Dict = None
    steps: List[str] = []

@router.post("/generate_problem")
def generate_csp_problem(req: CSPRequest):
    constraints = []

    for i in range(len(req.variables) - 1):
        x = req.variables[i]
        y = req.variables[i + 1]
        constraints.append((x, y, lambda a, b: a != b))  # Exemplu de constrângere simplă

    csp = CSP(
        variables=req.variables,
        domains=req.domains,
        constraints=constraints,
    )

    steps = []
    assignment = {}

    solution = backtracking_fc(csp, assignment, req.domains, steps)

    # Adaugă un print pentru a verifica ce returnează serverul
    print("Problem generated:", {
        "variables": req.variables,
        "domains": req.domains,
        "constraints": constraints,
        "solution": solution,
        "steps": steps,
    })

    return {
        "problem": {
            "variables": req.variables,
            "domains": req.domains,
            "constraints": constraints
        },
        "solution": solution,
        "steps": steps,
    }


@router.post("/check_solution")
def check_csp_solution(req: CSPRequest):
    constraints = []

    for constraint in req.constraints:
        x = constraint["var1"]
        y = constraint["var2"]
        condition = constraint["condition"]
        
        # Adăugăm constrângerea corespunzătoare
        if condition == "!=":
            constraints.append((x, y, lambda a, b: a != b))
        elif condition == "=":
            constraints.append((x, y, lambda a, b: a == b))
        elif condition == ">":
            constraints.append((x, y, lambda a, b: a > b))
        elif condition == "<":
            constraints.append((x, y, lambda a, b: a < b))

    csp = CSP(
        variables=req.variables,
        domains=req.domains,
        constraints=constraints,
    )

    steps = []
    assignment = req.partial_assignment

    solution = backtracking_fc(csp, assignment, req.domains, steps)

    # Verificăm soluția
    if solution == req.partial_assignment:
        return {"is_correct": True, "steps": steps}
    else:
        return {"is_correct": False, "steps": steps}
