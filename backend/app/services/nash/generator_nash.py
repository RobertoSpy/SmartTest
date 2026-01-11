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
                   target_fraction_no_ne: Optional[float] = None,
                   difficulty: Optional[str] = "medium") -> List[Dict[str, Any]]:
    """
    Generate a batch of questions.
    difficulty: "easy" | "medium" | "hard"
    """
    results: List[Dict[str, Any]] = []

    # Difficulty Configuration
    # Easy: Small matrices, mixed probability (50% with NE, 50% without)
    if difficulty == "easy":
        possible_sizes = [(2, 2), (2, 3), (3, 2)]
        ensure_mode = "mixed_50_50"
    # Medium: Medium matrices, mixed probability
    elif difficulty == "medium":
        possible_sizes = [(3, 3), (2, 4), (4, 2), (3, 4), (4, 3)]
        ensure_mode = "mixed_50_50"
    # Hard: Large matrices, mixed (can have 0 NE natively, randomness determines it)
    elif difficulty == "hard":
        possible_sizes = [(4, 4), (3, 5), (5, 3), (4, 5), (5, 4), (5, 5)]
        ensure_mode = "any"
    else:
        # Fallback / Legacy behavior similar to medium
        possible_sizes = [(2, 2), (2, 3), (3, 3), (4, 4)]
        ensure_mode = ensure # Use passed ensure if no valid difficulty

    # Override ensure if specifically meant to be "legacy" logic (though we discouraged it)
    # But here we rely on difficulty. 
    
    # If using legacy 'distribution' explicitly, we might ignore difficulty? 
    # Let's prioritize difficulty if distribution is None.
    
    if distribution:
        # Legacy path with distribution dictionary
        items, weights = zip(*distribution.items())
        total = sum(weights)
        probs = [w / total for w in weights]
        
        # Original legacy logic for target_fraction
        if target_fraction_no_ne is not None:
             num_none = int(round(count * target_fraction_no_ne))
             num_with = count - num_none
             # ... (simplified: just use ensure per item based on count)
             # keeping it simple: just use difficulty path if dist is None
             pass 

    # Main Difficulty Loop
    for _ in range(count):
        # Handle the custom 50/50 mode for Easy/Medium
        current_ensure = ensure_mode
        if ensure_mode == "mixed_50_50":
            if random.random() < 0.5:
                current_ensure = "at_least_one"
            else:
                current_ensure = "none"

        m, n = random.choice(possible_sizes)
        q = generate_normal_form_question(m=m, n=n, low=low, high=high, ensure=current_ensure)
        results.append(q)

    return results