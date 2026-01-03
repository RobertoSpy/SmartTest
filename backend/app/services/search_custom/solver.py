from typing import Dict, Any
import unicodedata
from app.services.search_custom.definitions import SCENARIOS

def normalize_text(text: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

def solve_prompt(user_prompt: str) -> Dict[str, Any]:
    """
    Attempts to 'solve' a user-provided prompt by matching it against known scenarios.
    Returns a dictionary with correct_strategy, correct_heuristic, explanation, etc.
    """
    clean_prompt = normalize_text(user_prompt)
    best_match = None
    max_score = 0

    for sc in SCENARIOS:
        score = 0
        
        # 1. Base Score: Match Problem Name (High weight)
        norm_name = normalize_text(sc.problem_name)
        if norm_name in clean_prompt:
            score += 10
            
        # 2. Match Keywords from Instance Text
        norm_instance = normalize_text(sc.instance_text)
        keywords = norm_instance.split()
        for word in keywords:
            if len(word) > 3 and word in clean_prompt:
                score += 2
        
        # 3. Contextual Boosts (Discriminators)
        # "Toate solutiile" (All solutions) -> Strong indicator for Backtracking
        if "backtracking" in sc.required_strategy.lower() and ("toate" in clean_prompt or "all" in clean_prompt or "exhaustiv" in clean_prompt):
            score += 15
            
        # "Optim" / "Minim" -> Indicator for A* / BFS
        if sc.required_strategy in ["A*", "BFS"] and ("optim" in clean_prompt or "minim" in clean_prompt or "scurt" in clean_prompt):
            score += 5
            
        # "Rapid" / "Mare" -> Indicator for Greedy / Hill Climbing
        if sc.required_strategy in ["Greedy Best-First", "Hill Climbing"] and ("rapid" in clean_prompt or "mare" in clean_prompt or "mii" in clean_prompt):
            score += 5

        # Direct strategy mention
        if normalize_text(sc.required_strategy) in clean_prompt:
            score += 20

        if score > max_score:
            max_score = score
            best_match = sc
            
    if best_match and max_score > 0:
        return {
            "correct_strategy": best_match.required_strategy,
            "correct_heuristic": best_match.required_heuristic,
            "explanation": f"Detected Scenario: {best_match.problem_name}\nContext: {best_match.instance_text}\n\n{best_match.explanation}"
        }
        
    return {
        "correct_strategy": "Unknown",
        "correct_heuristic": "Unknown",
        "explanation": "Nu am putut identifica automat un scenariu cunoscut. Încearcă să folosești cuvinte cheie precum 'N-Queens', 'Hanoi', 'toate soluțiile', 'drum minim'." 
    }
