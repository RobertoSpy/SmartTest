from typing import List

class ProblemScenario:
    def __init__(self, 
                 problem_name: str, 
                 instance_text: str, 
                 required_strategy: str, 
                 required_heuristic: str,
                 prompt_hint: str,
                 explanation: str):
        self.problem_name = problem_name
        self.instance_text = instance_text
        self.required_strategy = required_strategy
        self.required_heuristic = required_heuristic
        self.prompt_hint = prompt_hint
        self.explanation = explanation

# --- LISTA EXTINSĂ DE SCENARII ---
SCENARIOS = [
    # ---------------------------------------------------------
    # 1. GENERALIZED HANOI & PATHFINDING (A* vs Greedy vs BFS)
    # ---------------------------------------------------------
    ProblemScenario(
        problem_name="Generalized Hanoi",
        instance_text="Mutarea discurilor între tije cu număr minim de mutări.",
        required_strategy="A*",
        required_heuristic="Admisibilă",
        prompt_hint="Se caută o soluție optimă (număr minim de pași) într-un timp rezonabil.",
        explanation="A* garantează găsirea drumului optim dacă euristica este admisibilă (nu supraestimează niciodată costul real)."
    ),
    ProblemScenario(
        problem_name="Generalized Hanoi",
        instance_text="Găsirea unei soluții valide rapid, fără garanția optimului.",
        required_strategy="Greedy Best-First",
        required_heuristic="Informată", 
        prompt_hint="Se dorește o soluție cât mai rapidă; nu contează dacă facem câteva mutări în plus.",
        explanation="Greedy expandează starea care pare cea mai aproape de final. Este rapidă, dar poate fi prinsă în bucle sau poate găsi soluții neoptimale (similar cu DFS în worst-case)."
    ),
    ProblemScenario(
        problem_name="Generalized Hanoi",
        instance_text="Spațiul stărilor este mic, se cere drumul optim, dar nu avem o euristică bună.",
        required_strategy="BFS (Breadth First Search)",
        required_heuristic="Niciuna (Neinformată)",
        prompt_hint="Strategie neinformată care garantează drumul cel mai scurt.",
        explanation="În lipsa unei euristici, BFS este singura strategie neinformată care garantează soluția optimă (drumul cel mai scurt), deși consumă multă memorie."
    ),

    # ---------------------------------------------------------
    # 2. N-QUEENS & LOCAL SEARCH (Hill Climbing, Sim. Annealing)
    # ---------------------------------------------------------
    ProblemScenario(
        problem_name="N-Queens",
        instance_text="Găsirea unei singure configurații valide pentru N=1000.",
        required_strategy="Hill Climbing",
        required_heuristic="Min-Conflicts (sau Obiectiv)",
        prompt_hint="Spațiul este imens. Căutăm un maxim local/global rapid, nu un drum.",
        explanation="Hill Climbing este cea mai rapidă strategie generală pentru optimizare, dar riscă să se blocheze în maxime locale. Aici euristica nu este o distanță, ci o funcție de fitness (h(FS)=max)."
    ),
    ProblemScenario(
        problem_name="N-Queens",
        instance_text="Rezolvarea problemei evitând blocarea în maxime locale.",
        required_strategy="Simulated Annealing",
        required_heuristic="Obiectiv",
        prompt_hint="Strategie care acceptă uneori stări mai proaste pentru a scăpa din optimuri locale.",
        explanation="Simulated Annealing este o variantă de Hill Climbing care permite alegerea unor stări mai 'slabe' cu o probabilitate descrescătoare, pentru a evita blocarea în maxime locale."
    ),
    ProblemScenario(
        problem_name="N-Queens",
        instance_text="Găsirea TUTUROR soluțiilor pentru N=8.",
        required_strategy="Backtracking",
        required_heuristic="Niciuna (Implicită)",
        prompt_hint="Se cere explorare sistematică și exhaustivă.",
        explanation="Backtracking este ideal pentru enumerarea tuturor soluțiilor deoarece poate evita buclele fără a memora stările vizitate și explorează sistematic."
    ),

    # ---------------------------------------------------------
    # 3. MEMORY CONSTRAINTS & COMPLEX PATHS (SMA*, Beam)
    # ---------------------------------------------------------
    ProblemScenario(
        problem_name="Pathfinding in Large Graph",
        instance_text="Căutare A* unde memoria RAM se umple înainte de a găsi soluția.",
        required_strategy="SMA* (Simplified Memory Bounded A*)",
        required_heuristic="Consistentă",
        prompt_hint="Strategie care 'uită' noduri când memoria e plină, dar le poate regenera.",
        explanation="SMA* elimină (prunes) stările cele mai puțin promițătoare când memoria e plină și memorează costul pentru a le regenera dacă este nevoie."
    ),
    ProblemScenario(
        problem_name="Complex Search",
        instance_text="Căutare într-un spațiu vast, păstrând doar cele mai bune k opțiuni la fiecare pas.",
        required_strategy="Beam Search",
        required_heuristic="Informată",
        prompt_hint="Este un BFS optimizat care limitează memoria păstrând o listă sortată de mărime fixă.",
        explanation="Beam Search este un BFS care păstrează doar cele mai bune 'k' stări vizitate. Este eficient mem-wise, dar nu garantează optimul, putând rata soluția."
    ),

    # ---------------------------------------------------------
    # 4. GAME THEORY / INTERACTIVE
    # ---------------------------------------------------------
    ProblemScenario(
        problem_name="Chess / Board Game",
        instance_text="Joc interactiv unde adversarul încearcă să ne minimizeze câștigul.",
        required_strategy="Minimax (sau Alpha-Beta)", # Deși cursul atinge jocurile la final
        required_heuristic="Evaluare Pozițională",
        prompt_hint="Problemă decizională interactivă (Games). Soluția depinde de adversar.",
        explanation="Jocurile sunt cele mai grele probleme rezolvabile. Aici nu căutăm o simplă stare finală, ci o strategie împotriva unui adversar optim."
    ),
    
    # ---------------------------------------------------------
    # 5. GRAPH COLORING / CSP
    # ---------------------------------------------------------
    ProblemScenario(
        problem_name="Graph Coloring",
        instance_text="Verificarea rapidă a posibilității de colorare (fail-fast).",
        required_strategy="Backtracking",
        required_heuristic="MRV (Minimum Remaining Values)",
        prompt_hint="Se alege variabila cea mai constrânsă pentru a detecta eșecul cât mai devreme.",
        explanation="În problemele CSP, Backtracking cu euristici precum MRV ajută la 'pruning'-ul ramurilor invalide mult mai devreme."
    )
]
