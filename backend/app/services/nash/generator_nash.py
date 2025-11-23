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
            best_for_row = all(payoff[k][j][0] <= u_row for k in range(m))
            best_for_col = all(payoff[i][l][1] <= u_col for l in range(n))
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
            break

    qid = str(uuid.uuid4())
    prompt = f"Pentru jocul în formă normală dat în matrice ({m}x{n}), există echilibru Nash pur? Indicați Da/Nu și, dacă Da, precizați unul sau mai multe profile (r,c) 1-based."
    matrix_lines = [ " | ".join(f"({u[0]},{u[1]})" for u in row) for row in payoff]

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
                   ensure: str = "any",
                   target_fraction_no_ne: Optional[float] = None) -> List[Dict[str, Any]]:
    """
    Generate a batch of questions.
    
    NOU: `target_fraction_no_ne` (float 0.0-1.0) forțează un anumit procent de jocuri FĂRĂ NE.
    Ex: target_fraction_no_ne=0.5 va genera ~50% jocuri "Nu".
    """
    if distribution is None:
        distribution = {"2x2": 50, "2x3": 25, "3x3": 20, "4x4": 5}
    
    items, weights = zip(*distribution.items())
    total = sum(weights)
    if total <= 0: raise ValueError("Invalid distribution weights")
    probs = [w / total for w in weights]

    results: List[Dict[str, Any]] = []

    # Logică NOUĂ pentru a forța un mix
    if target_fraction_no_ne is not None:
        if not (0.0 <= target_fraction_no_ne <= 1.0):
            raise ValueError("target_fraction_no_ne must be between 0 and 1")
        
        num_none = int(round(count * target_fraction_no_ne))
        num_with = count - num_none

        for _ in range(num_none):
            s = random.choices(items, probs, k=1)[0]
            m, n = map(int, s.split("x"))
            q = generate_normal_form_question(m=m, n=n, low=low, high=high, ensure="none")
            results.append(q)

        for _ in range(num_with):
            s = random.choices(items, probs, k=1)[0]
            m, n = map(int, s.split("x"))
            q = generate_normal_form_question(m=m, n=n, low=low, high=high, ensure="at_least_one")
            results.append(q)
        
        random.shuffle(results)
        return results

    
    chosen_sizes = random.choices(items, probs, k=count)
    for s in chosen_sizes:
        m, n = map(int, s.split("x"))
        q = generate_normal_form_question(m=m, n=n, low=low, high=high, ensure=ensure)
        results.append(q)
    return results