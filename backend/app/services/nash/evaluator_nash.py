import re
from typing import List, Tuple, Dict, Any

def parse_nfg_answer(text: str) -> Dict[str, Any]:
    """
    Parse answer text. Accept examples:
      "Nu" or "No"
      "Da (1,2)" or "Yes (1,2) (2,1)"
      "Yes; (1,2)"
      "Da: (1,2),(3,3)"
    Returns dict: {"has_equilibrium": bool, "equilibria": [(r,c), ...]}
    """
    t = (text or "").strip()
    if not t:
        return {"has_equilibrium": False, "equilibria": []}
    lower = t.lower()
    # explicit "no" variants
    if re.match(r'^\s*(n|no|nu)\b', lower):
        return {"has_equilibrium": False, "equilibria": []}
    # detect yes-like words
    has_yes = bool(re.search(r'\b(da|yes|y|true)\b', lower))
    # extract pairs like (1,2) or 1,2 or 1;2
    pairs = re.findall(r'\(?\s*(\d+)\s*[,;]\s*(\d+)\s*\)?', t)
    # some formats may have space instead of comma: "1 2" or "(1 2)"
    if not pairs:
        pairs = re.findall(r'\(?\s*(\d+)\s+\s*(\d+)\s*\)?', t)
    equilibria = [(int(a), int(b)) for a,b in pairs]
    if has_yes or equilibria:
        return {"has_equilibrium": True, "equilibria": equilibria}
    return {"has_equilibrium": False, "equilibria": []}

def evaluate_normal_form(question: Dict[str, Any], answer_text: str) -> Dict[str, Any]:
    """
    Evaluate submission. Returns detailed result with partial scoring:
    - If no true equilibria exist:
        * user says "Nu" -> 100%
        * user says "Da" (with or without profiles) -> 0%
    - If true equilibria exist:
        * score proportional to fraction of true equilibria identified: matched / total_true
        * penalize incorrect extra profiles: subtract penalty_per_extra * number_of_extra
        * final score = clamp(base_fraction - penalty, 0, 1) * 100
        * special cases:
            - user claims "Nu" while there are true equilibria -> 0
            - user claims "Da" but gives no profiles -> 0
            - if user provides no profiles but has_equilibrium True (detected by word) -> treated as no profiles
    """
    parsed = parse_nfg_answer(answer_text)
    provided_has = parsed["has_equilibrium"]
    provided_equils = [tuple(p) for p in parsed["equilibria"]]

    true_equils = [tuple(e) for e in question.get("equilibria", [])]
    true_set = set(true_equils)
    prov_set = set(provided_equils)

    matched = sorted(list(true_set & prov_set))
    missing = sorted(list(true_set - prov_set))
    extra = sorted(list(prov_set - true_set))

    # Scoring parameters (tweak these as you like)
    penalty_per_extra = 0.25  # subtract this fraction for each extra wrong profile

    # Case: no true equilibria
    if not true_set:
        if not provided_has:
            score = 100.0
            note = "Corect: nu există echilibru pur."
        else:
            score = 0.0
            note = "Greșit: nu există echilibru pur, ai spus că există."
        return {
            "is_there": False,
            "provided_has": provided_has,
            "provided_equilibria": provided_equils,
            "matched_equilibria": matched,
            "missing_equilibria": missing,
            "extra_equilibria": extra,
            "score_percent": score,
            "note": note,
            "correct_equilibria": sorted(true_equils)
        }

    # Case: there are true equilibria
    # If user explicitly said No and provided no profiles -> wrong
    if not provided_has and not prov_set:
        score = 0.0
        note = "Greșit: există echilibru pur, ai spus Nu."
        return {
            "is_there": True,
            "provided_has": provided_has,
            "provided_equilibria": provided_equils,
            "matched_equilibria": matched,
            "missing_equilibria": missing,
            "extra_equilibria": extra,
            "score_percent": score,
            "note": note,
            "correct_equilibria": sorted(true_equils)
        }

    # If user claimed existence but provided no profiles -> no credit (0)
    if provided_has and not prov_set:
        score = 0.0
        note = "Ai spus că există dar nu ai furnizat niciun profil."
        return {
            "is_there": True,
            "provided_has": provided_has,
            "provided_equilibria": provided_equils,
            "matched_equilibria": matched,
            "missing_equilibria": missing,
            "extra_equilibria": extra,
            "score_percent": score,
            "note": note,
            "correct_equilibria": sorted(true_equils)
        }

    # Otherwise compute proportional score with penalty for extras
    base_fraction = len(matched) / len(true_set) if len(true_set) > 0 else 0.0
    penalty = len(extra) * penalty_per_extra
    score_fraction = max(0.0, min(1.0, base_fraction - penalty))
    score = round(score_fraction * 100.0, 2)

    if len(matched) == 0:
        note = "Greșit: nu ai identificat niciun echilibru corect."
    elif len(matched) < len(true_set):
        note = "Partial: ai identificat unele echilibria corecte."
    else:
        # all matched (and possibly some extras which already penalized)
        if len(extra) == 0:
            note = "Corect: ai identificat toate echilibria pure."
        else:
            note = "Partial: ai identificat toate echilibria dar ai adăugat profile greșite (penalizare)."

    # Generate detailed explanation
    explanation = _generate_explanation(question.get("payoff_matrix"), matched, extra)

    return {
        "is_there": True,
        "provided_has": provided_has,
        "provided_equilibria": provided_equils,
        "matched_equilibria": matched,
        "missing_equilibria": missing,
        "extra_equilibria": extra,
        "score_percent": score,
        "note": note,
        "correct_equilibria": sorted(true_equils),
        "explanation": explanation
    }

def _generate_explanation(payoff_matrix: List[List[List[int]]], matched: List[Tuple[int, int]], extra: List[Tuple[int, int]]) -> str:
    if not payoff_matrix:
        return ""
    
    m = len(payoff_matrix)
    n = len(payoff_matrix[0])
    lines = []

    # Explain matched (correct) equilibria
    if matched:
        lines.append("De ce sunt corecte soluțiile identificate:")
        for (r, c) in matched:
            # r, c are 1-based
            row_idx = r - 1
            col_idx = c - 1
            u_row, u_col = payoff_matrix[row_idx][col_idx]
            
            lines.append(f"- (R{r}, C{c}): Jucătorul Linie câștigă {u_row}, Jucătorul Coloană câștigă {u_col}.")
            # Prove row optimaility
            row_opt = True
            for k in range(m):
                if payoff_matrix[k][col_idx][0] > u_row:
                    row_opt = False # Should not happen for correct NE
            
            # Prove col optimality
            col_opt = True
            for l in range(n):
                if payoff_matrix[row_idx][l][1] > u_col:
                    col_opt = False # Should not happen
            
            if row_opt and col_opt:
                lines.append(f"  Acesta este un Echilibru Nash deoarece niciun jucător nu poate obține un câștig mai mare schimbând unilateral strategia.")

    # Explain extra (wrong) equilibria
    if extra:
        lines.append("\nDe ce sunt greșite celelalte profiluri:")
        for (r, c) in extra:
            row_idx = r - 1
            col_idx = c - 1
            
            # Bounds check
            if row_idx < 0 or row_idx >= m or col_idx < 0 or col_idx >= n:
                lines.append(f"- (R{r}, C{c}): Profil inexistent în matrice.")
                continue

            u_row, u_col = payoff_matrix[row_idx][col_idx]
            reasons = []
            
            # Check Row deviation
            best_row_val = -float('inf')
            best_row_idx = -1
            for k in range(m):
                val = payoff_matrix[k][col_idx][0]
                if val > best_row_val:
                    best_row_val = val
                    best_row_idx = k
            
            if best_row_val > u_row:
                reasons.append(f"Jucătorul Linie ar prefera R{best_row_idx + 1} (câștig {best_row_val} > {u_row})")

            # Check Col deviation
            best_col_val = -float('inf')
            best_col_idx = -1
            for l in range(n):
                val = payoff_matrix[row_idx][l][1]
                if val > best_col_val:
                    best_col_val = val
                    best_col_idx = l
            
            if best_col_val > u_col:
                reasons.append(f"Jucătorul Coloană ar prefera C{best_col_idx + 1} (câștig {best_col_val} > {u_col})")
            
            if reasons:
                lines.append(f"- (R{r}, C{c}): Nu este echilibru. {'; '.join(reasons)}.")
            else:
                 # This technically shouldn't happen if it WAS flagged as extra (meaning not in true_set)
                 # Unless true_set calculation failed or it's actually NE but missed by generator?
                 lines.append(f"- (R{r}, C{c}): Eroare de validare.")

    if not matched and not extra:
        # If user picked nothing or claimed "No" correctly/incorrectly
        # We can explain why correct ones are correct (if any exist)
        pass # The function signature assumes we explain the USER'S selection. 
             # But maybe we should explain the CORRECT ones even if user missed them?
             # For now, following the requested pattern "why are correct ones correct, why wrong ones wrong".
             # If user missed correct ones, they are in 'missing'. I should pass 'missing' too to explain them?
    
    return "\n".join(lines)