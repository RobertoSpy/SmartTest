import uuid
import random
from typing import List, Dict, Optional, Tuple

def solve_n_queens(n: int) -> Optional[List[int]]:
    cols = [-1] * n
    used_cols = set()
    used_diag1 = set()
    used_diag2 = set()

    def backtrack(r):
        if r == n:
            return True
        for c in range(n):
            if c in used_cols or (r - c) in used_diag1 or (r + c) in used_diag2:
                continue
            cols[r] = c
            used_cols.add(c)
            used_diag1.add(r - c)
            used_diag2.add(r + c)
            if backtrack(r + 1):
                return True
            used_cols.remove(c)
            used_diag1.remove(r - c)
            used_diag2.remove(r + c)
            cols[r] = -1
        return False

    if backtrack(0):
        return cols.copy()
    return None

def board_from_solution(cols: List[int]) -> List[str]:
    n = len(cols)
    lines = []
    for r in range(n):
        row = ['.' for _ in range(n)]
        row[cols[r]] = 'Q'
        lines.append(' '.join(row))
    return lines

def generate_n_queens_question(n_min: int = 4, n_max: int = 8) -> Dict:
    n = random.randint(n_min, n_max)
    solution = solve_n_queens(n)
    if solution is None:
        raise ValueError(f"No solution for n={n}")
    qid = str(uuid.uuid4())
    board_lines = board_from_solution(solution)
    correct_positions = [(r+1, c+1) for r, c in enumerate(solution)]
    prompt = f"Plasează {n} regine pe o tablă {n}x{n} astfel încât nicio două să nu se atace."
    return {
        "id": qid,
        "type": "n-queens",
        "n": n,
        "prompt": prompt,
        "correct_positions": correct_positions,
        "board_lines": board_lines
    }