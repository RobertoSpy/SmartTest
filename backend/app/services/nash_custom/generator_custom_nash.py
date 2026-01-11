from typing import List, Tuple, Dict, Any, Optional
import random
import uuid
from app.services.nash.generator_nash import _find_pure_nash  # folosit pentru validare internă

def _random_matrix(m: int, n: int, low: int = -2, high: int = 5) -> List[List[List[int]]]:
    mat = []
    for i in range(m):
        row = []
        for j in range(n):
            row_payoff = random.randint(low, high)
            col_payoff = random.randint(low, high)
            row.append([row_payoff, col_payoff])
        mat.append(row)
    return mat

def _generate_matrix_with_condition(m: int, n: int, want_has_pure: Optional[bool], max_tries: int = 200):
    for _ in range(max_tries):
        mat = _random_matrix(m, n)
        equilibria = _find_pure_nash(mat) or []
        has = bool(equilibria)
        if want_has_pure is None or want_has_pure == has:
            return mat, equilibria
    # fallback: return last generated
    mat = _random_matrix(m, n)
    equilibria = _find_pure_nash(mat) or []
    return mat, equilibria

def generate_batch(
    count: int = 1,
    distribution: Optional[Dict[str, float]] = None,
    ensure: str = "any",
    target_fraction_no_ne: Optional[float] = None,
    student_input: bool = True,
    fixed_rows: Optional[int] = None,
    fixed_cols: Optional[int] = None,
    difficulty: Optional[str] = "medium",
) -> List[Dict[str, Any]]:
    """
    Generează un batch de task-uri. 
    difficulty: "easy" | "medium" | "hard".
    ensure overrides difficulty if strictly set, but we usually rely on difficulty defaults.
    """
    qdatas = []
    
    # Defaults based on difficulty
    if difficulty == "easy":
        possible_sizes = [(2, 2), (2, 3), (3, 2)]
        default_want = None # Easy -> Mixed 50/50
    elif difficulty == "medium":
        possible_sizes = [(3, 3), (2, 4), (4, 2), (3, 4), (4, 3)]
        default_want = None # Medium -> Mixed 50/50
    elif difficulty == "hard":
        possible_sizes = [(4, 4), (3, 5), (5, 3), (4, 5), (5, 4)]
        default_want = None # Hard -> Mixed (any)
    else:
        possible_sizes = [(3, 3)]
        default_want = None

    if ensure == "at_least_one":
        want = True
    elif ensure == "none":
        want = False
    else:
        want = default_want # Fallback to difficulty setting

    for _ in range(count):
        # decide m, n
        if fixed_rows and fixed_cols:
            m, n = fixed_rows, fixed_cols
        else:
            m, n = random.choice(possible_sizes)

        # decide target_has_pure: dacă want e None, alege aleator pentru acest item
        if want is None:
            target_for_this = random.choice([True, False])
        else:
            target_for_this = want

        # pentru student_input generăm intern o matrice compatibilă pentru a calcula exemplu, dar nu salvăm payoff_matrix
        mat, equilibria = _generate_matrix_with_condition(m, n, target_for_this)
        has = bool(equilibria)

        qid = str(uuid.uuid4())
        prompt = (
            f"Formează o matrice {m}x{n} în care să fie Nash pur." if target_for_this
            else f"Formează o matrice {m}x{n} în care să NU fie Nash pur."
        ) if student_input else (
            f"Generează o matrice de payoff {m}x{n}."
        )

        qdata = {
            "id": qid,
            "type": "normal_form_game_custom_student_input" if student_input else "normal_form_game",
            "prompt": prompt,
            # Nu includem payoff_matrix pentru task-urile student_input
            "row_labels": [f"R{i+1}" for i in range(m)],
            "col_labels": [f"C{j+1}" for j in range(n)],
            "equilibria_example": equilibria,
            "has_pure_example": has,
            "target_has_pure": target_for_this,
            "rows": m,
            "cols": n,
        }
        # opțional: dacă nu e student_input, includem payoff_matrix
        if not student_input:
            qdata["payoff_matrix"] = mat
            qdata["equilibria"] = equilibria

        qdatas.append(qdata)

    return qdatas

def analyze_matrix(payoff: List[List[List[int]]]) -> Dict[str, Any]:
    # Basic shape validation
    if not isinstance(payoff, list) or not payoff:
        raise ValueError("payoff must be a non-empty list of rows")
    m = len(payoff)
    n = len(payoff[0])
    for row in payoff:
        if not isinstance(row, list) or len(row) != n:
            raise ValueError("all rows must be lists of same length")
        for cell in row:
            if not (isinstance(cell, (list, tuple)) and len(cell) == 2):
                raise ValueError("each cell must be a pair [row_payoff, col_payoff]")

    # _find_pure_nash should return list of tuples indicating equilibria (1-based if your other code expects it);
    equilibria = _find_pure_nash(payoff) or []
    has_pure = bool(equilibria)

    justification_lines = []
    if not has_pure:
        justification_lines.append("Nu există echilibru Nash pur: pentru fiecare celulă, cel puțin un jucător poate îmbunătăți unilateral.")
    else:
        # defensive: ensure equilibria are tuples of ints
        try:
            eqs = [(int(r), int(c)) for (r, c) in equilibria]
        except Exception:
            eqs = equilibria
        justification_lines.append(f"Au fost găsite {len(eqs)} echilibr(ia): " + ", ".join(f"({r},{c})" for r,c in eqs))
        # build brief rationale per equilibrium
        for (r, c) in eqs:
            i = r - 1
            j = c - 1
            if 0 <= i < m and 0 <= j < n:
                u_row = payoff[i][j][0]
                u_col = payoff[i][j][1]
                col_row_vals = [payoff[k][j][0] for k in range(m)]
                row_col_vals = [payoff[i][l][1] for l in range(n)]
                justification_lines.append(
                    f"Pentru profil ({r},{c}): row payoff={u_row} vs col-values {col_row_vals}; col payoff={u_col} vs row-values {row_col_vals}."
                )

    return {
        "has_pure_nash": has_pure,
        "equilibria": equilibria,
        "justification": "\n".join(justification_lines),
        "rows": m,
        "cols": n,
    }