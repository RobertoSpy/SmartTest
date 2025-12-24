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


def select_unassigned_variable(variables, assignment):
    for v in variables:
        if v not in assignment:
            return v
    return None


def backtracking_fc(csp, assignment, domains, steps):
    if len(assignment) == len(csp.variables):
        return assignment

    var = select_unassigned_variable(csp.variables, assignment)

    for value in domains[var]:
        if csp.is_consistent(var, value, assignment):
            assignment[var] = value
            steps.append(f"Assign {var} = {value}")

            new_domains = forward_checking(
                csp, var, value, domains, assignment
            )

            if new_domains is not None:
                result = backtracking_fc(
                    csp, assignment, new_domains, steps
                )
                if result:
                    return result

            steps.append(f"Backtrack on {var}")
            assignment.pop(var)

    return None
