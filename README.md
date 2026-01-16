#  SmartTest AI Platform

**SmartTest** is a comprehensive AI-driven educational and testing platform designed to demonstrate and evaluate core Artificial Intelligence algorithms. From state-space search to advanced game theory strategies, SmartTest provides a robust framework for generating, solving, and understanding complex AI problems.

---

##  Key Features & Algorithms

###  Intelligence Search
Implementation of fundamental search strategies for pathfinding and problem-solving:
*   **BFS (Breadth-First Search)**: Guaranteed optimal path for unweighted graphs.
*   **DFS (Depth-First Search)**: Memory-efficient exploration for deep state spaces.
*   **A* Search**: Heuristic-based optimized search for finding the shortest path efficiently.
*   **Backtracking**: Exhaustive search used for problems like N-Queens and Tower of Hanoi.

###  Game Theory & Strategic Decision Making
Analysis of competitive environments and decision trees:
*   **Pure & Mixed Nash Equilibrium**: Algorithms to find stable strategies in non-cooperative games.
*   **Zero-Sum Game Analysis**: Solving matrix games where one player's gain is exactly equal to the other's loss.

###  MinMax & Optimization
Strategic decision-making trees tailored for two-player games:
*   **MinMax Algorithm**: Recursive decision-making for minimizing the possible loss for a maximum loss (maximin) scenario.
*   **Alpha-Beta Pruning**: Highly optimized tree traversal using **Fail-Hard** pruning rules to eliminate branches that can't influence the final decision, significantly improving performance.

###  Constraint Satisfaction Problems (CSP)
Sophisticated solvers for problems with predefined rules (e.g., Map Coloring, Scheduling):
*   **AC-3 (Arc Consistency)**: Preprocessing algorithm to reduce domains before searching.
*   **Forward Checking**: Proactive constraint propagation during backtracking.
*   **MRV (Minimum Remaining Values)**: Heuristic for intelligent variable selection to prune the search space early.

---

## 🛠 Tech Stack

- **Backend**: Python 3.9+ with **FastAPI** for high-performance asynchronous API handling.
- **Frontend**: **React** with **TypeScript** and **Vite** for a responsive, type-safe user interface.
- **Database**: **PostgreSQL** for persistent storage of generated problems and history.
- **Containerization**: **Docker** & **Docker Compose** for seamless environment orchestration.

---

##  Installation & Setup

### Method 1: Docker Compose (Recommended)
The fastest way to get everything running in a production-like environment.

1.  **Configure Environment**: Create a `.env` file in the root directory:
    ```env
    POSTGRES_USER=smartest
    POSTGRES_PASSWORD=smartestpass
    POSTGRES_DB=smartest_db

    # Backend config
    DATABASE_URL=postgresql://smartest:smartestpass@db:5432/smartest_db
    PYTHONUNBUFFERED=1
    PYTHONPATH=/app/backend
    # Frontend (Vite)
    VITE_API_BASE=http://localhost:8000
    ```
2.  **Launch**:
    ```bash
    docker-compose up --build
    ```
3.  **Access**:
    *   **Frontend**: [http://localhost:5173](http://localhost:5173)
    *   **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Method 2: Manual Setup
For development purposes where you want to run services independently.

#### 1. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

##  Project Structure

*   `backend/`: FastAPI application, database models, and AI service logic.
*   `frontend/`: React components, pages, and API integration hooks.
*   `docker-compose.yml`: Multi-container orchestration config.

---


## Contact
For questions or collaboration:
robertoissues1@gmail.com

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
