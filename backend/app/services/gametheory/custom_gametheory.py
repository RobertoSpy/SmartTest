from typing import List, Dict, Any
from app.services.gametheory.generator_gametheory import _find_dominant_strategy, _generate_dominant_explanation_ro, _is_pareto_optimal

def solve_gametheory_scenario(
    matrix: List[List[List[int]]], 
    q_type: str, 
    row_labels: List[str] = None, 
    col_labels: List[str] = None,
    player_row: str = "Player A",
    player_col: str = "Player B"
) -> Dict[str, Any]:
    """
    Solve a custom scenario provided by user.
    q_type: 'dominant_strategy', 'best_strategy', 'pareto_optimality'
    """
    m = len(matrix)
    n = len(matrix[0])
    
    if not row_labels: row_labels = [f"R{i+1}" for i in range(m)]
    if not col_labels: col_labels = [f"C{i+1}" for i in range(n)]
    
    solution = ""
    explanation = ""
    
    if q_type == "dominant_strategy" or q_type == "best_strategy":
        dom_info = _find_dominant_strategy(matrix)
        dom_idx = dom_info.get("row_dominant", -1) # 1-based
        dom_strat = row_labels[dom_idx - 1] if dom_idx != -1 else None
        
        if q_type == "dominant_strategy":
            # "Does Player A have a dominant strategy?"
            if dom_strat:
                solution = "Yes"
                explanation = _generate_dominant_explanation_ro(matrix, row_labels, col_labels, player_name=player_row, opponent_name=player_col)
                if "Yes." not in explanation: explanation = f"Yes. {explanation}"
            else:
                solution = "No"
                explanation = _generate_dominant_explanation_ro(matrix, row_labels, col_labels, player_name=player_row, opponent_name=player_col)
                
        else:
            # "Best strategy"
            if dom_strat:
                solution = dom_strat
                
                # Intermediate explanation: More than one line, but less than the full proof
                lines = []
                lines.append(f"Strategia cea mai bună pentru **{player_row}** este **{dom_strat}**.")
                lines.append(f"\nAceastă strategie oferă rezultate superioare indiferent de ce joacă **{player_col}**:")
                
                # Iterate columns to show dominance briefly
                for c in range(n):
                    c_label = col_labels[c]
                    # dom_idx is 1-based
                    dom_val = matrix[dom_idx-1][c][0]
                    
                    other_vals = []
                    for r in range(m):
                        if r != (dom_idx - 1):
                            other_vals.append(f"{row_labels[r]} ({matrix[r][c][0]})")
                            
                    others_str = ", ".join(other_vals)
                    lines.append(f"- Împotriva **{c_label}**: **{dom_strat}** ({dom_val}) este mai bun (sau egal) decât {others_str}.")
                    
                lines.append(f"\nFiind cea mai avantajoasă în toate scenariile, **{dom_strat}** este strategia dominantă.")
                explanation = "\n".join(lines)
            else:
                solution = "None"
                explanation = f"Nu există o singură strategie 'cea mai bună' care să fie dominantă. Cea mai bună alegere pentru **{player_row}** depinde de ce alege **{player_col}**."

    elif q_type == "pareto_optimality":
        # Return the list of Pareto Optimal outcomes for the whole matrix.
        pareto_cells = []
        for r in range(m):
            for c in range(n):
                is_p, _ = _is_pareto_optimal(matrix, r, c)
                if is_p:
                     pareto_cells.append(f"({row_labels[r]}, {col_labels[c]})")
        
        solution = ", ".join(pareto_cells)
        explanation = f"Rezultatele Pareto optimale sunt: {solution}. Orice alt rezultat este dominat de unul dintre acestea."

    return {
        "solution": solution,
        "explanation": explanation
    }
