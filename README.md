# SmartTest

## How to Run

You can run this application using Docker Compose (recommended) or manually.

### Prerequisites

- **Docker**: If using the Docker method.
- **Node.js & npm**: If running frontend manually (v16+ recommended).
- **Python 3.9+**: If running backend manually.
- **PostgreSQL**: If running backend manually (unless using Docker for DB).

### Method 1: Docker Compose (Recommended)

This will spin up the database, backend, and frontend services together.

1. Ensure you have a `.env` file in the root directory with the following variables:
   ```env
   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_DB=smarttest_db
   DATABASE_URL=postgresql://user:password@db:5432/smarttest_db
   VITE_API_BASE=http://localhost:8000
   ```

2. Run the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Method 2: Manual Setup

#### 1. Database
Ensure you have a PostgreSQL database running and a `.env` file containing the DB credentials.
If running locally, your `DATABASE_URL` might look like: `postgresql://user:password@localhost:5432/smarttest_db`.

#### 2. Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### 3. Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `backend/`: Python FastAPI application
- `frontend/`: React + Vite + TypeScript application
- `docker-compose.yml`: Docker orchestration
