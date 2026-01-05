from typing import Dict, Any, List

def evaluate_gametheory(question_data: Dict[str, Any], submission_text: str) -> Dict[str, Any]:
    """
    Simple keyword based evaluation for now.
    """
    solution = question_data.get("solution_text", "").lower()
    submission = submission_text.lower().strip()
    
    score = 0
    feedback = ""
    
    # Updated Evaluation Logic
    solution_lower = solution.lower()
    
    # Check simple Yes/No if that is the solution
    if solution_lower in ["yes", "no"]:
        if submission == solution_lower:
            score = 100
            feedback = "Correct!"
        else:
            score = 0
            feedback = f"Incorrect. The correct answer was {question_data['solution_text']}."
    else:
        # Fallback for "best_strategy" or other types
        if solution_lower in submission:
             score = 100
             feedback = "Correct!"
        else:
             score = 0
             feedback = f"Incorrect. Expected {question_data['solution_text']}."

    return {
        "score_percent": score,
        "feedback": feedback,
        "explanation": question_data.get("explanation", ""),
        "solution": question_data["solution_text"]
    }
