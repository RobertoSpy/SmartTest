from copy import deepcopy

class CSP:
    def __init__(self, variables, domains, constraints):
        self.variables = variables
        self.domains = domains
        self.constraints = constraints

    def is_consistent(self, var, value, assignment):
        for (x, y, constraint) in self.constraints:
            if x == var and y in assignment:
                if not constraint(value, assignment[y]):
                    return False
            if y == var and x in assignment:
                if not constraint(assignment[x], value):
                    return False
        return True


def forward_checking(csp, var, value, domains, assignment):
    new_domains = deepcopy(domains)

    for (x, y, constraint) in csp.constraints:
        if x == var and y not in assignment:
            new_domains[y] = [
                v for v in new_domains[y] if constraint(value, v)
            ]
            if not new_domains[y]:
                return None

        if y == var and x not in assignment:
            new_domains[x] = [
                v for v in new_domains[x] if constraint(v, value)
            ]
            if not new_domains[x]:
                return None

    return new_domains



def select_unassigned_variable(variables, assignment, domains, strategy="fc"):
    if strategy == "mrv":
        # MRV: Choose variable with fewest legal values
        unassigned = [v for v in variables if v not in assignment]
        if not unassigned:
            return None
        return min(unassigned, key=lambda var: len(domains[var]))
    else:
        # Default (FC): First unassigned
        for v in variables:
            if v not in assignment:
                return v
        return None

def revise(csp, xi, xj, domains):
    """
    Returns True if we removed a value from domains[xi].
    Constraint is implicitly checked between xi and xj.
    """
    revised = False
    # Find constraint between xi and xj
    # Our constraints are triples (x, y, func)
    # We need to find the specific constraint object/func
    consistency_func = None

    # This is slightly inefficient but fits our structure
    for (x, y, constraint) in csp.constraints:
        if x == xi and y == xj:
            consistency_func = lambda val_x, val_y: constraint(val_x, val_y)
            break
        elif y == xi and x == xj:
            consistency_func = lambda val_x, val_y: constraint(val_y, val_x)
            break
            
    if not consistency_func:
        # No constraint between them implies anything goes (conceptually consistent)
        return False

    # Check each value x in domains[xi]
    # If there is no value y in domains[xj] satisfying constraint, delete x
    to_remove = []
    for x_val in domains[xi]:
        satisfiable = False
        for y_val in domains[xj]:
            if consistency_func(x_val, y_val):
                satisfiable = True
                break
        if not satisfiable:
            to_remove.append(x_val)
            revised = True
            
    for v in to_remove:
        domains[xi].remove(v)
        
    return revised

def ac3_algorithm(csp, domains, steps=None):
    """
    AC-3 Preprocessing.
    Returns False if inconsistency found (domain empty), True otherwise.
    Modifies domains in-place.
    """
    queue = []
    # Initialize queue with all arcs
    for (x, y, _) in csp.constraints:
        queue.append((x, y))
        queue.append((y, x)) # Arcs are directional in AC-3

    if steps is not None:
        steps.append("AC-3: Initialized queue with all arcs.")

    while queue:
        (xi, xj) = queue.pop(0)
        if revise(csp, xi, xj, domains):
            if len(domains[xi]) == 0:
                if steps is not None:
                    steps.append(f"AC-3: Domain for {xi} became empty during revision with {xj}. Inconsistent.")
                return False
            
            # Add neighbors of xi to queue
            # Simplify: iterate all constraints involving xi
            for (nx, ny, _) in csp.constraints:
                neighbor = None
                if nx == xi and ny != xj: neighbor = ny
                elif ny == xi and nx != xj: neighbor = nx
                
                if neighbor:
                    queue.append((neighbor, xi))

    if steps is not None:
        steps.append("AC-3: Finished successfully. Domains reduced.")
    return True

def backtracking_search(csp, assignment, domains, steps, algorithm="fc"):
    solutions = []

    if len(assignment) == len(csp.variables):
        solutions.append(deepcopy(assignment))
        return solutions

    # Strategy determines variable selection
    strategy = "mrv" if algorithm == "mrv" else "fc"
    var = select_unassigned_variable(csp.variables, assignment, domains, strategy)

    for value in domains[var]:
        if csp.is_consistent(var, value, assignment):
            assignment[var] = value
            steps.append(f"Assign {var} = {value}")

            # Always use Forward Checking here as baseline for "Search"
            # (Even AC-3 usually runs FC during search, or MAC. We stick to FC for simplicity in search phase)
            new_domains = forward_checking(csp, var, value, domains, assignment)

            if new_domains is not None:
                result = backtracking_search(csp, assignment, new_domains, steps, algorithm)
                if result:
                    solutions.extend(result)

            steps.append(f"Backtrack on {var}")
            assignment.pop(var)

    return solutions

def solve_csp_wrapper(csp, partial_assignment, domains, steps, algorithm="fc"):
    """
    Unified entry point.
    """
    current_domains = deepcopy(domains)
    
    if algorithm == "ac3":
        # Run AC-3 Preprocessing first
        consistent = ac3_algorithm(csp, current_domains, steps)
        if not consistent:
            steps.append("AC-3 failed (inconsistency detected).")
            return [] # No solution
        # Proceed with standard backtracking (FC) on reduced domains
        # We call it 'fc' here because the search strategy itself is just standard FC after AC-3
        return backtracking_search(csp, partial_assignment, current_domains, steps, algorithm="fc")
    
    return backtracking_search(csp, partial_assignment, current_domains, steps, algorithm)

