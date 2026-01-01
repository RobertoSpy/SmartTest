import random
import math
from typing import List, Optional, Dict, Tuple

class Node:
    def __init__(self, id: str, value: Optional[int] = None, children: List['Node'] = None, is_max: bool = True):
        self.id = id
        self.value = value
        self.children = children if children is not None else []
        self.is_max = is_max

    def to_dict(self):
        return {
            "id": self.id,
            "value": self.value,
            "children": [child.to_dict() for child in self.children],
            "is_max": self.is_max
        }

class MinMaxService:
    def generate_tree(self, difficulty: str) -> Dict:
        """
        Generates a random game tree based on difficulty.
        Easy: Depth 2, Branching 2
        Medium: Depth 3, Branching 3
        Hard: Depth 4, Branching varies (2-3)
        """
        if difficulty == "easy":
            depth = 2
            branching_factor = lambda: 2
        elif difficulty == "medium":
            depth = 3
            branching_factor = lambda: 3
        elif difficulty == "hard":
            depth = 4
            branching_factor = lambda: random.randint(2, 3)
        else:
            # Default to easy
            depth = 2
            branching_factor = lambda: 2

        root = self._build_tree(depth, branching_factor, is_max=True, current_id="root")
        return root.to_dict()

    def _build_tree(self, depth: int, branching_factor_func, is_max: bool, current_id: str) -> Node:
        if depth == 0:
            # Leaf node
            val = random.randint(1, 20)
            return Node(id=current_id, value=val, is_max=is_max)
        
        node = Node(id=current_id, is_max=is_max)
        num_children = branching_factor_func()
        
        for i in range(num_children):
            child_id = f"{current_id}-{i}"
            child = self._build_tree(depth - 1, branching_factor_func, not is_max, child_id)
            node.children.append(child)
            
        return node

    def solve_alpha_beta(self, tree_dict: Dict) -> Tuple[int, int, str]:
        """
        Solves the tree using MinMax with Alpha-Beta pruning.
        Returns: (root_value, visited_leaves_count, explanation)
        """
        solver = AlphaBetaSolver()
        root_node = self._dict_to_node(tree_dict)
        root_value = solver.solve(root_node)
        return root_value, solver.visited_leaves_count, solver.get_explanation()

    def _dict_to_node(self, data: Dict) -> Node:
        children = [self._dict_to_node(c) for c in data.get("children", [])]
        return Node(
            id=data["id"],
            value=data.get("value"),
            children=children,
            is_max=data.get("is_max", True)
        )

class AlphaBetaSolver:
    def __init__(self):
        self.visited_leaves_count = 0
        self.log_steps = []

    def solve(self, node: Node) -> int:
        return self._alpha_beta(node, -math.inf, math.inf)

    def _alpha_beta(self, node: Node, alpha: float, beta: float) -> int:
        if not node.children:
            self.visited_leaves_count += 1
            if node.value is None:
                return 0
            self.log_steps.append(f"Visit leaf {node.id}, value={node.value}")
            return node.value

        if node.is_max:
            value = -math.inf
            for child in node.children:
                score = self._alpha_beta(child, alpha, beta)
                value = max(value, score)
                
                # Fail-Hard Pruning (Rule from user's course)
                if value >= beta:
                    self.log_steps.append(f"Pruning at MAX node {node.id}: score ({value}) >= beta ({beta}). Returning beta.")
                    return beta
                
                if value > alpha:
                    alpha = value
            return value
        else:
            value = math.inf
            for child in node.children:
                score = self._alpha_beta(child, alpha, beta)
                value = min(value, score)
                
                # Fail-Hard Pruning (Rule from user's course)
                if value <= alpha:
                    self.log_steps.append(f"Pruning at MIN node {node.id}: score ({value}) <= alpha ({alpha}). Returning alpha.")
                    return alpha
                
                if value < beta:
                    beta = value
            return value

    def get_explanation(self) -> str:
        intro = "Algoritmul Alpha-Beta Pruning a fost executat astfel:\n\n"
        steps = "\n".join(self.log_steps)
        conclusion = f"\n\nTotal noduri frunză vizitate: {self.visited_leaves_count}."
        reference = "\n\nReferință: Russell, S., & Norvig, P. Artificial Intelligence: A Modern Approach. Capitolul 'Adversarial Search'."
        return intro + steps + conclusion + reference

minmax_service = MinMaxService()
