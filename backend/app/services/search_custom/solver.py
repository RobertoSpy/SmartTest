from typing import Dict, Any
import unicodedata
from app.services.search_custom.definitions import SCENARIOS

def normalize_text(text: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

def solve_prompt(user_prompt: str) -> Dict[str, Any]:
    """
    Attempts to 'solve' a user-provided prompt by matching it against known scenarios.
    Uses keywords and flexible word matching for better natural language support.
    """
    clean_prompt = normalize_text(user_prompt)
    prompt_words = set(clean_prompt.split())
    
    best_match = None
    max_score = 0

    for sc in SCENARIOS:
        score = 0
        
        # 1. Keyword Matching (High weight)
        for kw in sc.keywords:
            norm_kw = normalize_text(kw)
            if norm_kw in clean_prompt:
                # Direct phrase match within prompt
                score += 15
            elif norm_kw in prompt_words:
                # Exact word match
                score += 10
            
        # 2. Problem Name Matching
        norm_name = normalize_text(sc.problem_name)
        if norm_name in clean_prompt:
            score += 10
        else:
            # Check if name words are present
            name_words = norm_name.split()
            for nw in name_words:
                if len(nw) > 3 and nw in prompt_words:
                    score += 3
            
        # 3. Contextual Boosts (Discriminators from instance text)
        norm_instance = normalize_text(sc.instance_text)
        instance_keywords = norm_instance.split()
        for word in instance_keywords:
            if len(word) > 3 and word in prompt_words:
                score += 2
        
        # 4. Strategy specific indicators
        # "Toate solutiile" (All solutions) -> Strong indicator for Backtracking
        if "backtracking" in sc.required_strategy.lower() and ("toate" in prompt_words or "all" in prompt_words or "exhaustiv" in prompt_words):
            score += 15
            
        # "Optim" / "Minim" -> Indicator for A* / BFS
        if sc.required_strategy in ["A*", "BFS"] and ("optim" in prompt_words or "minim" in prompt_words or "scurt" in prompt_words):
            score += 5
            
        # "Rapid" / "Mare" -> Indicator for Greedy / Hill Climbing
        if sc.required_strategy in ["Greedy Best-First", "Hill Climbing"] and ("rapid" in prompt_words or "mare" in prompt_words or "mii" in prompt_words):
            score += 5

        if score > max_score:
            max_score = score
            best_match = sc
            
    # Threshold for matching
    if best_match and max_score >= 5:
        return {
            "correct_strategy": best_match.required_strategy,
            "correct_heuristic": best_match.required_heuristic,
            "explanation": f"Detected Scenario: {best_match.problem_name}\nContext: {best_match.instance_text}\n\n{best_match.explanation}"
        }
        
    return {
        "correct_strategy": "Unknown",
        "correct_heuristic": "Unknown",
        "explanation": "Nu am putut identifica automat un scenariu cunoscut. Încearcă să folosești cuvinte cheie precum 'N-Queens', 'Hanoi', 'toate soluțiile', 'drum minim', 'colorare'." 
    }
