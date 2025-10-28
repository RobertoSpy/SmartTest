import re
from typing import List, Tuple, Dict, Any, Set, Iterable

def parse_positions_from_text(text: str) -> List[Tuple[int,int]]:
    text = text.strip()
    if not text:
        return []

    # 1) explicit pairs like (1,3),(2,5)
    pairs = re.findall(r'\(?\s*(\d+)\s*[,;]\s*(\d+)\s*\)?', text)
    if pairs:
        return [(int(r), int(c)) for r, c in pairs]

    # 2) two numbers separated by whitespace per token
    pairs2 = re.findall(r'(\d+)\s+(\d+)', text)
    if pairs2:
        return [(int(r), int(c)) for r, c in pairs2]

    # 3) board format with Q or q
    lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]
    if lines and any('Q' in ln or 'q' in ln for ln in lines):
        positions = []
        for i, ln in enumerate(lines):
            cols = ln.replace(' ', '')
            for j, ch in enumerate(cols):
                if ch.upper() == 'Q':
                    positions.append((i+1, j+1))
        return positions

    # 4) fallback: flat list of numbers [r1,c1,r2,c2,...]
    nums = re.findall(r'\d+', text)
    if len(nums) >= 2 and len(nums) % 2 == 0:
        it = iter(nums)
        return [(int(a), int(b)) for a,b in zip(it, it)]

    return []

def _conflict_pairs(positions: List[Tuple[int,int]]) -> Set[Tuple[Tuple[int,int], Tuple[int,int]]]:
    """Return set of unordered pairs that conflict."""
    conflicts = set()
    npos = len(positions)
    for i in range(npos):
        r1,c1 = positions[i]
        for j in range(i+1, npos):
            r2,c2 = positions[j]
            if r1 == r2 or c1 == c2 or abs(r1-r2) == abs(c1-c2):
                a, b = positions[i], positions[j]
                conflicts.add((a,b))
    return conflicts

def _conflicts_count(positions: List[Tuple[int,int]]) -> int:
    return len(_conflict_pairs(positions))

def _conflicts_per_position(positions: List[Tuple[int,int]]) -> Dict[Tuple[int,int], int]:
    """Return how many conflicts each position is involved in."""
    counts = {p: 0 for p in positions}
    pairs = _conflict_pairs(positions)
    for a,b in pairs:
        counts[a] += 1
        counts[b] += 1
    return counts

def _is_within_board(positions: List[Tuple[int,int]], n: int) -> bool:
    for r,c in positions:
        if r < 1 or r > n or c < 1 or c > n:
            return False
    return True

def _try_normalizations(parsed: List[Tuple[int,int]]) -> List[Tuple[str, List[Tuple[int,int]]]]:
    candidates = []
    candidates.append(("as_is", parsed))
    candidates.append(("add1", [(r+1, c+1) for r,c in parsed]))
    candidates.append(("swapped", [(c, r) for r,c in parsed]))
    candidates.append(("swapped_add1", [(c+1, r+1) for r,c in parsed]))
    return candidates

def _score_per_position_scheme(subs: List[Tuple[int,int]], correct_set: Set[Tuple[int,int]], n: int) -> Dict[str, Any]:
    """
    Per-position scoring scheme:
      - matched & safe => 1.0
      - matched & conflict => 0.6
      - not matched & safe => 0.3
      - not matched & conflict => 0.0
    Returns detailed breakdown and total score.
    """
    # per-position conflict counts
    conflicts_map = _conflicts_per_position(subs)
    total_score = 0.0
    matched = []
    extra = []
    missing = sorted(list(correct_set - set(subs)))
    for p in subs:
        is_matched = p in correct_set
        is_safe = (conflicts_map.get(p, 0) == 0)
        if is_matched and is_safe:
            s = 1.0
            matched.append(p)
        elif is_matched and not is_safe:
            s = 0.6
            matched.append(p)
        elif not is_matched and is_safe:
            s = 0.3
            extra.append(p)
        else:
            s = 0.0
            extra.append(p)
        total_score += s

    # ensure matched list is sorted for stable output
    matched_sorted = sorted(matched)
    extra_sorted = sorted([p for p in subs if p not in correct_set])
    percent_matched = round(len(matched_sorted) / n * 100.0, 2)
    score_percent = round(max(0.0, total_score / n * 100.0), 2)

    return {
        "n": n,
        "num_matched": len(matched_sorted),
        "percent_matched": percent_matched,
        "matched_positions": matched_sorted,
        "missing_positions": missing,
        "extra_positions": extra_sorted,
        "conflicts": _conflicts_count(subs),
        "penalty": _conflicts_count(subs),  # keep for compatibility
        "score_percent": score_percent
    }

def evaluate_n_queens(question: Dict[str, Any], submission_positions: List[Tuple[int,int]], accept_any_solution: bool = True) -> Dict[str, Any]:
    """
    Evaluation that awards partial credit per-position while preserving full-credit if submission is a valid N-Queens solution.
    Chooses best normalization among candidates (skipping candidates with out-of-range coords).
    """
    n = int(question.get('n', 0))
    correct_positions = [tuple(p) for p in question.get('correct_positions', [])]
    correct_set = set(correct_positions)

    if not submission_positions:
        return {
            "n": n,
            "num_matched": 0,
            "percent_matched": 0.0,
            "matched_positions": [],
            "missing_positions": sorted(list(correct_set)),
            "extra_positions": [],
            "conflicts": 0,
            "penalty": 0,
            "score_percent": 0.0,
            "parsed_positions": [],
            "used_normalization": None,
            "note": "No positions parsed from submission"
        }

    candidates = _try_normalizations(submission_positions)
    best_score = None
    best_entry = None

    for key, cand in candidates:
        # skip candidates with out-of-range coords
        if not _is_within_board(cand, n):
            continue
        # evaluate per-position scheme
        basic = _score_per_position_scheme(cand, correct_set, n)
        # determine if cand is a valid (no conflicts and n positions) solution
        valid = (basic["conflicts"] == 0) and (len(cand) == n)
        basic["valid_solution"] = valid
        # ranking metric: prefer valid, then higher score_percent, then more num_matched, then fewer conflicts
        metric = (1 if valid else 0, basic["score_percent"], basic["num_matched"], -basic["conflicts"])
        if best_score is None or metric > best_score:
            best_score = metric
            best_entry = (key, cand, basic)

    # if all candidates excluded because out-of-range, fall back to as_is (without filtering)
    if best_entry is None:
        key, cand = candidates[0]
        basic = _score_per_position_scheme(cand, correct_set, n)
        basic["valid_solution"] = (basic["conflicts"] == 0 and len(cand) == n)
        best_entry = (key, cand, basic)

    used_key, used_positions, used_basic = best_entry

    # If accept_any_solution and chosen candidate is valid -> full score and report accordingly
    if accept_any_solution and used_basic.get("valid_solution"):
        return {
            "n": n,
            "num_matched": n,
            "percent_matched": 100.0,
            "matched_positions": sorted(list(used_positions)),
            "missing_positions": [],
            "extra_positions": [],
            "conflicts": 0,
            "penalty": 0,
            "score_percent": 100.0,
            "parsed_positions": sorted(list(used_positions)),
            "used_normalization": used_key,
            "valid_solution": True,
            "note": "Accepted as valid N-Queens solution (any valid solution gets full credit)"
        }

    used_basic.update({
        "parsed_positions": sorted(list(used_positions)),
        "used_normalization": used_key,
        "correct_positions": sorted(list(correct_set))
    })
    return used_basic