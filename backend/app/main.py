from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SQLModel
from .routers import questions, agents

app = FastAPI(title="SmarTest L6 API")

# create tables on startup
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])