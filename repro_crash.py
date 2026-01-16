
import sys
import os

# Set up python path to include backend
sys.path.append("/Users/rares/Desktop/AI/SmartTest/backend")

from app.services.nash_custom.evaluator_custom_nash import evaluate_custom_submission
import json

# Mimic the payload from the screenshot
submission_matrix = [
    [[1,1],[1,1],[1,1],[1,1]],
    [[1,1],[1,1],[1,1],[1,1]]
]
claimed_equilibria = None
submission_text = ""

# Mock question data
question_data = {
    "target_has_pure": True, # Assume true for test, or False, or None
    "rows": 2,
    "cols": 4
}

print("Running evaluate_custom_submission...")
try:
    result = evaluate_custom_submission(
        question_data,
        submission_matrix=submission_matrix,
        claimed_equilibria=claimed_equilibria,
        submission_text=submission_text
    )
    print("Success! Result:")
    print(json.dumps(result, indent=2, default=str))
except Exception as e:
    print("CRASHED:")
    print(e)
    import traceback
    traceback.print_exc()

print("\n--- Checking key mapping for DB ---")
# Simulate what questions_nash.py does
eval_res = result if 'result' in locals() else {}

try:
    meta_dict = {
        "computed_has": eval_res.get("computed_has"),
        "computed_equilibria": eval_res.get("computed_equilibria"),
        "matched_equilibria": eval_res.get("matched_equilibria"),
        "missing_equilibria": eval_res.get("missing_equilibria"),
        "extra_equilibria": eval_res.get("extra_equilibria"),
        "note": eval_res.get("note"),
    }
    print("Meta dict constructed:", meta_dict)
    
    # Simulate DB model instantiation (partial)
    submission_positions = eval_res.get("matched_equilibria", [])
    print("submission_positions:", submission_positions)
    
except Exception as e:
    print("Mapping logic failed:")
    print(e)
