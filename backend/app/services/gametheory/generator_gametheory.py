import random
import uuid
from typing import List, Tuple, Dict, Any, Optional

def _random_payoffs(m: int, n: int, low: int = -9, high: int = 9):
    """Return an m x n matrix of [row_payoff, col_payoff] pairs."""
    mat = []
    for i in range(m):
        row = []
        for j in range(n):
            row.append([random.randint(low, high), random.randint(low, high)])
        mat.append(row)
    return mat

def _generate_prisoners_dilemma() -> Tuple[List[List[List[int]]], Dict[str, Any]]:
    """
    Generate a Prisoner's Dilemma matrix (2x2).
    Conditions: T > R > P > S
    Row strategies: Cooperate (0), Defect (1)
    Col strategies: Cooperate (0), Defect (1)
    Matrix:
            C           D
        C (R, R)      (S, T)
        D (T, S)      (P, P)
    Dominant strategy is D for both.
    Nash is (D, D).
    Pareto optimal: (C,C), (C,D), (D,C). (D,D) is NOT.
    """
    # Generate 4 distinct integers s.t. T > R > P > S
    # To make it easier, pick 4 digits then sort them
    
    # Try somewhat reasonable range for payoffs
    values = set()
    while len(values) < 4:
        values.add(random.randint(-5, 10))
    
    sorted_vals = sorted(list(values), reverse=True)
    T, R, P, S = sorted_vals[0], sorted_vals[1], sorted_vals[2], sorted_vals[3]
    
    # Construct matrix
    # Row 0 (Cooperate), Col 0 (Cooperate) -> R, R
    # Row 0 (Cooperate), Col 1 (Defect)    -> S, T
    # Row 1 (Defect),    Col 0 (Cooperate) -> T, S
    # Row 1 (Defect),    Col 1 (Defect)    -> P, P
    
    mat = [
        [[R, R], [S, T]],
        [[T, S], [P, P]]
    ]
    
    metadata = {
        "game_name": "Prisoner's Dilemma",
        "strategies_row": ["Silent", "Confess"], # Or Cooperate/Defect
        "strategies_col": ["Silent", "Confess"],
        "dominant_row": "Confess", # 1-based index 2
        "dominant_col": "Confess", # 1-based index 2
        "nash": [(2, 2)],
        "pareto_optimal": [(1, 1), (1, 2), (2, 1)], # 1-based indices
        "explanation": f"In a Prisoner's Dilemma, Confess is strictly dominant. T({T}) > R({R}) > P({P}) > S({S}).",
        "player_row_name": "Player A",
        "player_col_name": "Player B"
    }
    return mat, metadata

def _find_dominant_strategy(payoff: List[List[List[int]]]) -> Dict[str, Any]:
    """
    Check for dominant strategies for Row and Col players.
    Returns info dict.
    """
    m = len(payoff)
    n = len(payoff[0]) if m > 0 else 0
    
    # Row player dominant strategy
    # Strategy r is dominant if for all c, u_row(r, c) >= u_row(k, c) for all k != r
    # Strictly dominant if >
    
    row_dom_idx = -1
    row_dom_type = None # "strict" or "weak"
    
    for r in range(m):
        is_weak = True
        is_strict = True
        
        for k in range(m):
            if r == k: continue
            
            # Check if r dominates k
            # For all c
            for c in range(n):
                u_r = payoff[r][c][0]
                u_k = payoff[k][c][0]
                if u_r < u_k:
                    is_weak = False
                    is_strict = False
                    break
                if u_r == u_k:
                    is_strict = False
            
            if not is_weak: break
            
        if is_weak:
            row_dom_idx = r + 1
            row_dom_type = "strict" if is_strict else "weak"
            break # Can assume only one dominant strategy usually, or just pick first found
            
    # Col player dominant strategy
    col_dom_idx = -1
    col_dom_type = None
    
    for c in range(n):
        is_weak = True
        is_strict = True
        
        for k in range(n):
            if c == k: continue
            
            for r in range(m):
                u_c = payoff[r][c][1]
                u_k = payoff[r][k][1]
                if u_c < u_k:
                    is_weak = False
                    is_strict = False
                    break
                if u_c == u_k:
                    is_strict = False
            
            if not is_weak: break
        
        if is_weak:
            col_dom_idx = c + 1
            col_dom_type = "strict" if is_strict else "weak"
            break

    return {
        "row_dominant": row_dom_idx,
        "row_dominant_type": row_dom_type,
        "col_dominant": col_dom_idx,
        "col_dominant_type": col_dom_type
    }

def _generate_dominant_explanation_ro(mat: List[List[List[int]]], row_labels: List[str], col_labels: List[str], 
                                      player_name: str = "Jucătorul A", opponent_name: str = "adversarul") -> str:
    """
    Generates a step-by-step explanation in Romanian for the Row Player's dominant strategy.
    """
    m = len(mat)
    n = len(mat[0])
    
    lines = []
    lines.append(f"O strategie dominantă există doar dacă o anumită alegere (un rând) oferă întotdeauna un rezultat mai bun decât celelalte, indiferent de ce alege {opponent_name}.")
    lines.append(f"\nSă comparăm rezultatele pentru **{player_name}** în funcție de ce joacă {opponent_name}:")
    
    # Track best strategies for each column
    best_strategies_per_col = []
    
    for c in range(n):
        lines.append(f"\nDacă {opponent_name} alege **{col_labels[c]}**:")
        best_val = -float('inf')
        best_r_indices = []
        
        for r in range(m):
            val = mat[r][c][0]
            lines.append(f"- {row_labels[r]} aduce: {val}")
            if val > best_val:
                best_val = val
                best_r_indices = [r]
            elif val == best_val:
                best_r_indices.append(r)
        
        best_labels = [row_labels[x] for x in best_r_indices]
        if len(best_labels) == 1:
            lines.append(f"(Cea mai bună alegere este {best_labels[0]})")
        else:
            lines.append(f"(Cele mai bune alegeri sunt: {', '.join(best_labels)})")
        
        best_strategies_per_col.append(set(best_r_indices))
        
    lines.append("\nConcluzie:")
    
    common_best = set.intersection(*best_strategies_per_col)
    
    if not common_best:
         lines.append(f"Deoarece cea mai bună strategie se schimbă în funcție de {opponent_name} (sau nu există una comună optimă), nu există o strategie dominantă pentru {player_name}.")
    else:
         strat_idx = list(common_best)[0] 
         strat_name = row_labels[strat_idx]
         lines.append(f"Strategia **{strat_name}** este cea mai bună (sau la egalitate) indiferent de ce joacă {opponent_name}. Astfel, este o strategie dominantă pentru {player_name}.")

    return "\n".join(lines)

def generate_gametheory_question(count: int = 1) -> List[Dict[str, Any]]:
    results = []
    
def _generate_daffy_bugs() -> Tuple[List[List[List[int]]], Dict[str, Any]]:
    """
    Generate the 'Daffy vs Bugs' 3x3 game with RANDOM payoffs.
    Strategies: Hug, Shoot, Run.
    """
    # Random 3x3 matrix
    mat = _random_payoffs(3, 3)
    
    row_labels = ["Hug", "Shoot", "Run"]
    col_labels = ["Hug", "Shoot", "Run"]
    
    # Calculate dominant strategy dynamically
    dom_info = _find_dominant_strategy(mat)
    
    dom_row_name = None
    if dom_info["row_dominant"] != -1:
        # 1-based index
        dom_row_name = row_labels[dom_info["row_dominant"] - 1]
    
    metadata = {
        "game_name": "Daffy vs Bugs",
        "player_row_name": "Daffy",
        "player_col_name": "Bugs",
        "strategies_row": row_labels,
        "strategies_col": col_labels,
        "dominant_row": dom_row_name, 
        "dominant_col": dom_info["col_dominant"],
        "explanation": "" # Will be generated dynamically
    }
    return mat, metadata

def _is_pareto_optimal(mat: List[List[List[int]]], r: int, c: int) -> Tuple[bool, Optional[Tuple[int, int]]]:
    """
    Check if profile (r, c) is Pareto optimal.
    Returns (is_optimal, better_profile_indices)
    better_profile_indices is (r', c') such that u(r',c') >= u(r,c) for both and > for at least one.
    If multiple exist, returns the first one found.
    """
    m = len(mat)
    n = len(mat[0])
    current_payoff = mat[r][c]
    u1 = current_payoff[0]
    u2 = current_payoff[1]
    
    for i in range(m):
        for j in range(n):
            if i == r and j == c:
                continue
            
            other = mat[i][j]
            o1 = other[0]
            o2 = other[1]
            
            # Check if (i, j) Pareto dominates (r, c)
            # Conditions: o1 >= u1 AND o2 >= u2 AND (o1 > u1 OR o2 > u2)
            if o1 >= u1 and o2 >= u2 and (o1 > u1 or o2 > u2):
                return False, (i, j)
                
    return True, None

def _generate_xy_game() -> Tuple[List[List[List[int]]], Dict[str, Any]]:
    """
    Generate the 'X Y' game from the image.
    Strategies: X, Y.
    Payoffs:
       X     Y
    X 1,1   2,2
    Y 2,2   1,3
    """
    mat = [
        [[1, 1], [2, 2]], # X
        [[2, 2], [1, 3]]  # Y
    ]
    
    metadata = {
        "game_name": "X-Y Game",
        "strategies_row": ["X", "Y"],
        "strategies_col": ["X", "Y"],
        "player_row_name": "Player A",
        "player_col_name": "Player B",
        "explanation": "(X,X) is not Pareto optimal (dominated by (X,Y) or (Y,X)). All others are Pareto optimal."
    }
    return mat, metadata

def generate_gametheory_question(count: int = 1) -> List[Dict[str, Any]]:
    results = []
    
    for _ in range(count):
        # 33% Generic, 33% PD, 33% Daffy/XY (Named)
        rand_val = random.random()
        
        game_type = "generic"
        if rand_val < 0.33:
            game_type = "pd"
        elif rand_val < 0.66:
            game_type = "named" # Daffy or XY
        else:
            game_type = "generic"
            
        mat = []
        meta = {}
        
        if game_type == "pd":
            mat, meta = _generate_prisoners_dilemma()
        elif game_type == "named":
            if random.random() < 0.5:
                mat, meta = _generate_daffy_bugs()
            else:
                mat, meta = _generate_xy_game()
        else:
            # Generic
            m, n = random.choice([(2,2), (2,3), (3,3)])
            mat = _random_payoffs(m, n)
            meta = _find_dominant_strategy(mat)
            meta["strategies_row"] = [f"R{i+1}" for i in range(m)]
            meta["strategies_col"] = [f"C{i+1}" for i in range(n)]
            meta["game_name"] = "Normal Game"
            meta["player_row_name"] = "Player A"
            meta["player_col_name"] = "Player B"

        row_labels = meta["strategies_row"]
        col_labels = meta["strategies_col"]
        game_name = meta.get("game_name", "Game")
        p_row = meta.get("player_row_name", "Player A")
        p_col = meta.get("player_col_name", "Player B")
        
        # Decide Question Type
        # If PD or XY, we can ask Pareto. 
        # For Generic or Daffy, usually Dominant Strategy is safer/easier, but we can do Pareto too.
        # Let's allow Pareto for all, but handled carefully.
        
        available_q_types = ["dominant_strategy"]
        if game_type in ["pd", "named", "generic"]:
             available_q_types.append("pareto_optimality")
        
        if game_type == "pd":
             available_q_types.append("best_strategy")
        elif game_type == "generic" and meta.get("row_dominant", -1) != -1:
             # Also allow generic to ask best strategy if one exists
             available_q_types.append("best_strategy")
             
        # Daffy specifically requested random dominant/best? 
        # User said "add even one more question for the prisoner's dilemma if the strategy is pareto optimal".
        
        q_type = random.choice(available_q_types)
        
        prompt = ""
        solution = ""
        explanation = ""
        
        if q_type == "dominant_strategy":
            # Existing Logic...
            # For named games, meta might have 'dominant_row' directly
            # For generic, we have meta as the result of _find_dominant_strategy
            
            # Unify checking dominant strategy:
            if "dominant_row" in meta:
               # Named game result style
               dom_row = meta["dominant_row"]
            else:
               # Generic result style
               dom_idx = meta.get("row_dominant", -1)
               dom_row = row_labels[dom_idx - 1] if dom_idx != -1 else None

            prompt = f"Consider the {game_name}. Does {p_row} have a dominant strategy?"
            
            if dom_row:
                solution = "Yes"
                # Use existing explainer if not provided
                if not meta.get("explanation"):
                     explanation = _generate_dominant_explanation_ro(mat, row_labels, col_labels, player_name=p_row, opponent_name=p_col)
                else:
                     explanation = meta["explanation"]
                     if "Yes." not in explanation and "No." not in explanation:
                         explanation = f"Yes. {explanation}"
            else:
                solution = "No"
                if not meta.get("explanation"):
                     explanation = _generate_dominant_explanation_ro(mat, row_labels, col_labels, player_name=p_row, opponent_name=p_col)
                else:
                     explanation = meta["explanation"]

        elif q_type == "pareto_optimality":
             # Pick a random cell
             r = random.randint(0, len(mat)-1)
             c = random.randint(0, len(mat[0])-1)
             
             strat_r = row_labels[r]
             strat_c = col_labels[c]
             
             is_po, better = _is_pareto_optimal(mat, r, c)
             
             # Prompt
             prompt = f"Consider the {game_name}. Is the outcome ({strat_r}, {strat_c}) Pareto optimal?"
             
             if is_po:
                 solution = "Yes"
                 explanation = f"Da, rezultatul ({strat_r}, {strat_c}) este Pareto optimal. Nu există niciun alt rezultat care să îmbunătățească situația unui jucător fără a o înrăutăți pe a celuilalt."
             else:
                 solution = "No"
                 # better is (r', c')
                 b_r, b_c = better
                 better_strats = f"({row_labels[b_r]}, {col_labels[b_c]})"
                 explanation = f"Nu, ({strat_r}, {strat_c}) nu este Pareto optimal. Rezultatul {better_strats} oferă câștiguri mai bune (sau egale și cel puțin unul strict mai bun) pentru ambii jucători."

        elif q_type == "best_strategy":
             # Specifically for games with a known dominant strategy like PD
             dom_strat = meta.get("dominant_row")
             if not dom_strat:
                 # Fallback for generic if available
                 dom_idx = meta.get("row_dominant", -1)
                 if dom_idx != -1:
                     dom_strat = row_labels[dom_idx - 1]
             
             if dom_strat:
                 prompt = f"For the {game_name} shown, what is the best strategy for {p_row} to act?"
                 solution = dom_strat
                 explanation = f"Strategia cea mai bună este **{dom_strat}** deoarece este o strategie dominantă strictă (oferă un rezultat mai bun indiferent de ce face adversarul)."
             else:
                 # If we accidentally got here without a dominant strategy, fallback to existence check
                 prompt = f"Does {p_row} have a best (dominant) strategy?"
                 solution = "No"
                 explanation = f"Nu există o singură strategie cea mai bună care să funcționeze indiferent de adversar."

        qid = str(uuid.uuid4())
        results.append({
            "id": qid,
            "type": f"game_theory_{q_type}", # store exact sub-type
            "prompt": prompt,
            "payoff_matrix": mat,
            "row_labels": row_labels,
            "col_labels": col_labels,
            "matrix_lines": [ " | ".join(f"({u[0]},{u[1]})" for u in row) for row in mat],
            "solution_text": solution,
            "explanation": explanation,
            "metadata": meta
        })
            
    return results
