from typing import Dict, Any
import unicodedata

def remove_diacritics(text: str) -> str:
    """Removes diacritics from Romanian text (e.g. ă -> a, ț -> t)."""
    if not text:
        return ""
    # Normalize unicode characters to decompose combined characters
    normalized = unicodedata.normalize('NFD', text)
    # Filter out non-spacing mark characters (the diacritics)
    return "".join(c for c in normalized if unicodedata.category(c) != 'Mn')

def evaluate_search_submission(
    question_data: Dict[str, Any],
    submission_text: str
) -> Dict[str, Any]:
    """
    Evaluates a search problem submission.
    Correctness checks if the submitted strategy matches the template's correct strategy.
    """
    correct_strategy = question_data.get("correct_strategy")
    correct_heuristic = question_data.get("correct_heuristic")
    
    if not correct_strategy:
        return {
            "score_percent": 0,
            "correct": False,
            "explanation": "Eroare internă: Întrebarea nu are strategie corectă definită."
        }

    submission_clean = remove_diacritics(submission_text.lower())
    correct_strategy_clean = remove_diacritics(correct_strategy.lower())
    # Extract primary strategy name if parentheses exist: "BFS (Breadth...)" -> "bfs " -> "bfs"
    target_strategy = correct_strategy_clean.split('(')[0].strip()
    
    # Partial Scoring Logic
    score = 0
    feedback_parts = []
    
    # 1. Check Strategy
    strategy_ok = target_strategy in submission_clean
    if strategy_ok:
        score += 50
        feedback_parts.append(f"Strategie corectă ({correct_strategy}).")
    else:
        feedback_parts.append(f"Strategie incorectă (se aștepta {correct_strategy}).")

    # 2. Check Heuristic (if applicable)
    heuristic_ok = True
    if correct_heuristic and correct_heuristic != "Niciuna":
        correct_heuristic_clean = remove_diacritics(correct_heuristic.lower())
        target_heuristic = correct_heuristic_clean.split('(')[0].strip()
        heuristic_ok = target_heuristic in submission_clean
        if heuristic_ok:
            score += 50
            feedback_parts.append(f"Euristică corectă ({correct_heuristic}).")
        else:
            feedback_parts.append(f"Euristică incorectă (se aștepta {correct_heuristic}).")
    else:
        # If no heuristic required, award full points if strategy is correct
        if strategy_ok:
            score += 50
    
    # Final Result
    is_correct = score == 100
    base_explanation = question_data.get("explanation", "")
    final_explanation = " ".join(feedback_parts) + "\n\n" + base_explanation

    return {
        "score_percent": score,
        "correct": is_correct,
        "explanation": final_explanation
    }
