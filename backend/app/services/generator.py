import random
import uuid
from typing import List, Tuple, Dict, Any, Optional

def _random_payoffs(m: int, n: int, low: int = -5, high: int = 10):
    """Return an m x n matrix of [row_payoff, col_payoff] pairs."""
    mat = []
    for i in range(m):
        row = []
        for j in range(n):
            row.append([random.randint(low, high), random.randint(low, high)])
        mat.append(row)
    return mat

def _find_pure_nash(payoff: List[List[List[int]]]) -> List[Tuple[int,int]]:
    """Given payoff matrix payoff[i][j] = [u_row, u_col], return list of pure NE as 1-based indices."""
    m = len(payoff)
    n = len(payoff[0]) if m > 0 else 0
    ne = []
    for i in range(m):
        for j in range(n):
            u_row = payoff[i][j][0]
            u_col = payoff[i][j][1]
            # row best response to column j?
            best_for_row = True
            for k in range(m):
                if payoff[k][j][0] > u_row:
                    best_for_row = False
                    break
            # column best response to row i?
            best_for_col = True
            for l in range(n):
                if payoff[i][l][1] > u_col:
                    best_for_col = False
                    break
            if best_for_row and best_for_col:
                ne.append((i + 1, j + 1))
    return ne

def generate_normal_form_question(m: Optional[int] = None,
                                   n: Optional[int] = None,
                                   low: int = -5,
                                   high: int = 10,
                                   ensure: str = "any",
                                   max_attempts: int = 500) -> Dict[str, Any]:
    """
    Generate a single normal-form game:
      - m x n : if None, picks from default sizes
      - ensure: "any" | "at_least_one" | "none"
    Returns dict with payoff_matrix, matrix_lines, equilibria (ground truth), id, prompt, labels.
    """
    sizes = [(2,2), (2,3), (3,3), (4,4)]
    if m is None or n is None:
        m, n = random.choice(sizes)

    attempts = 0
    while True:
        attempts += 1
        payoff = _random_payoffs(m, n, low=low, high=high)
        ne = _find_pure_nash(payoff)
        if ensure == "any":
            break
        if ensure == "at_least_one" and ne:
            break
        if ensure == "none" and not ne:
            break
        if attempts >= max_attempts:
            # fallback: accept current generated instance
            break

    qid = str(uuid.uuid4())
    prompt = f"Pentru jocul în formă normală dat în matrice ({m}x{n}), există echilibru Nash pur? Indicați Da/Nu și, dacă Da, precizați unul sau mai multe profile (r,c) 1-based."
    matrix_lines = []
    for i in range(m):
        row_cells = []
        for j in range(n):
            u_row, u_col = payoff[i][j]
            row_cells.append(f"({u_row},{u_col})")
        matrix_lines.append(" | ".join(row_cells))

    return {
        "id": qid,
        "type": "normal_form_game",
        "prompt": prompt,
        "payoff_matrix": payoff,
        "row_labels": [f"R{i+1}" for i in range(m)],
        "col_labels": [f"C{j+1}" for j in range(n)],
        "matrix_lines": matrix_lines,
        "equilibria": ne
    }

def generate_batch(count: int = 1,
                   distribution: Optional[Dict[str, float]] = None,
                   low: int = -5,
                   high: int = 10,
                   ensure: str = "any") -> List[Dict[str, Any]]:
    """
    Generate a batch of questions following a distribution.
    distribution keys: "2x2", "2x3", "3x3", "4x4" with probabilities (summing to 1 or percents).
    If distribution is None, use default:
      50% 2x2, 25% 2x3, 20% 3x3, 5% 4x4
    """
    if distribution is None:
        distribution = {"2x2": 50, "2x3": 25, "3x3": 20, "4x4": 5}

    # normalize weights
    items = []
    weights = []
    for k, v in distribution.items():
        items.append(k)
        weights.append(float(v))
    total = sum(weights)
    if total <= 0:
        raise ValueError("Invalid distribution weights")
    probs = [w / total for w in weights]

    # sample sizes according to probabilities
    chosen_sizes = random.choices(items, probs, k=count)

    results: List[Dict[str, Any]] = []
    for s in chosen_sizes:
        parts = s.split("x")
        try:
            m = int(parts[0]); n = int(parts[1])
        except Exception:
            m, n = 2, 2
        q = generate_normal_form_question(m=m, n=n, low=low, high=high, ensure=ensure)
        results.append(q)
    return results