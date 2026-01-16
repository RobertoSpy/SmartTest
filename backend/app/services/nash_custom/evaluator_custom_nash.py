from typing import Any, Dict, List, Optional, Sequence, Tuple, Set
from app.services.nash_custom import generator_custom_nash

# helper: normalize list/tuple like [(r,c), ...] into set of (int,int)
def _normalize_equilibria(eqs: Optional[Sequence]) -> Set[Tuple[int, int]]:
    if not eqs:
        return set()
    out = set()
    for e in eqs:
        # accept formats: [r,c] or (r,c) or "r,c" or {"r":..., "c":...}
        try:
            if isinstance(e, (list, tuple)) and len(e) >= 2:
                r = int(e[0])
                c = int(e[1])
                out.add((r, c))
            elif isinstance(e, str):
                s = e.strip().lstrip("(").rstrip(")")
                parts = [p.strip() for p in s.replace(",", " ").split() if p.strip()]
                if len(parts) >= 2:
                    out.add((int(parts[0]), int(parts[1])))
            elif isinstance(e, dict):
                if "r" in e and "c" in e:
                    out.add((int(e["r"]), int(e["c"])))
                else:
                    keys = list(e.keys())
                    if len(keys) >= 2:
                        out.add((int(e[keys[0]]), int(e[keys[1]])))
        except Exception:
            # skip malformed entries
            continue
    return out

def _eq_sets(a: Optional[Sequence], b: Optional[Sequence]):
    """
    Returns (matched, missing, extra)
    - matched: list of equilibria present in both (as tuples)
    - missing: list of equilibria that are in a but not in b (computed but not claimed)
    - extra: list of equilibria that are in b but not in a (claimed but not computed)
    """
    aset = _normalize_equilibria(a)
    bset = _normalize_equilibria(b)
    matched = sorted(list(aset & bset))
    missing = sorted(list(aset - bset))
    extra = sorted(list(bset - aset))
    return matched, missing, extra

def evaluate_custom_submission(
    question: Any,
    submission_matrix: List[List[List[int]]],
    claimed_equilibria: Optional[List[Tuple[int, int]]] = None,
    submission_text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluate submission, with partial credit rules:
    - If question requires Nash (target_has_pure == True):
        * if submitted matrix has no pure Nash -> 0%
        * if has Nash and student DID NOT claim equilibria -> 75%
        * if has Nash and student claimed exact equilibria -> 100%
        * if has Nash and student claimed but mismatches -> 0%
    - If question requires NO Nash (target_has_pure == False):
        * if submitted matrix has no pure Nash -> 100% (no claim expected)
        * else -> 0%
    - If target is None (any):
        * if student provided claimed equilibria: check match -> 100/0
        * if student did not provide claimed equilibria: give 75% (partial)
    """
    # Basic validation (shape)
    if not isinstance(submission_matrix, list) or not submission_matrix:
        raise ValueError("submission_matrix must be a non-empty list of rows")
    m = len(submission_matrix)
    n = len(submission_matrix[0])
    for row in submission_matrix:
        if not isinstance(row, list) or len(row) != n:
            raise ValueError("All rows must be lists of the same length")
        for cell in row:
            if not (isinstance(cell, (list, tuple)) and len(cell) == 2):
                raise ValueError("Each cell must be a pair [row_payoff, col_payoff]")

    # Compute analysis using common generator analyze_matrix helper
    analysis = generator_custom_nash.analyze_matrix(submission_matrix)
    computed_eq = analysis.get("equilibria") or []
    computed_set = _normalize_equilibria(computed_eq)
    claimed_set = _normalize_equilibria(claimed_equilibria)

    matched, missing, extra = _eq_sets(computed_eq, claimed_equilibria)

    # get target requirement from question data
    if isinstance(question, dict):
        qdata = question.get("data", {})
    else:
        qdata = getattr(question, "data", {}) or {}
    
    target = qdata.get("target_has_pure", None)  # True | False | None

    has_pure = bool(computed_set)

    correct = False
    score_percent = 0
    explanation = ""

    if target is True:
        # question requested a matrix WITH Nash
        if not has_pure:
            correct = False
            score_percent = 0
            explanation = "Matricea nu are Nash pur, dar cerința era să aibă."
        else:
            # has Nash
            if not claimed_set:
                # student didn't mark equilibria -> partial credit
                correct = True
                score_percent = 75
                explanation = "Matricea conține Nash pur; nu ai specificat echilibrul(e) — primești credit parțial (75%)."
            else:
                # student specified equilibria -> verify exact match
                if not missing and not extra:
                    correct = True
                    score_percent = 100
                    explanation = "Ai identificat corect echilibrul(e) Nash pur — 100%."
                else:
                    correct = False
                    score_percent = 0
                    explanation = "Ai indicat echilibria greșit — 0%."
    elif target is False:
        # question requested a matrix WITHOUT Nash
        if has_pure:
            correct = False
            score_percent = 0
            explanation = "Matricea conține Nash pur; cerința era să NU aibă."
        else:
            # correctly no Nash -> full credit; ignore any claimed equilibria
            correct = True
            score_percent = 100
            explanation = "Corect — matricea NU are Nash pur."
    else:
        # target is None (any allowed)
        if claimed_set:
            # if claimed, check match
            if not missing and not extra:
                correct = True
                score_percent = 100
                explanation = "Ai identificat corect echilibrul(e) Nash pur — 100%."
            else:
                correct = False
                score_percent = 0
                explanation = "Echilibrile indicate nu se potrivesc cu cele calculate — 0%."
        else:
            # no claimed equilibria -> give partial credit (student at least submitted a matrix)
            correct = True
            score_percent = 75
            explanation = "Ai trimis o matrice; nu ai indicat echilibrile — primești credit parțial (75%)."

    result = {
        "has_pure_nash": has_pure,
        "equilibria": sorted(list(computed_set)),
        "justification": analysis.get("justification", ""),
        "rows": analysis.get("rows", m),
        "cols": analysis.get("cols", n),
    }

    return {
        "result": result,
        "score_percent": score_percent,
        "correct": correct,
        "matched": matched,
        "missing": missing,
        "extra": extra,
        "explanation": explanation,
    }