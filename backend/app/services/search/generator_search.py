import random
import uuid
from typing import List, Dict, Any
from app.services.search_custom.definitions import SCENARIOS, ProblemScenario

def generate_search_question() -> Dict[str, Any]:
    """
    Generates a dynamic search problem question based on a random scenario.
    """
    scenario = random.choice(SCENARIOS)
    qid = str(uuid.uuid4())
    
    # Build prompt dynamically
    prompt = (
        f"Pentru problema '{scenario.problem_name}' cu contextul: '{scenario.instance_text}'\n"
        f"Cerință: {scenario.prompt_hint}\n"
        f"Ce strategie și ce tip de euristică sunt recomandate?"
    )
    
    return {
        "id": qid,
        "type": "search_problem_identification",
        "prompt": prompt,
        "problem_name": scenario.problem_name,
        "instance_text": scenario.instance_text,
        "options": [], # Free text response expected
        "correct_strategy": scenario.required_strategy,
        "correct_heuristic": scenario.required_heuristic,
        "explanation": scenario.explanation
    }

def generate_batch(count: int = 1) -> List[Dict[str, Any]]:
    return [generate_search_question() for _ in range(count)]