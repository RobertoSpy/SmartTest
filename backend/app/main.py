from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SQLModel
from .routers.nash import questions_nash
from app.routers.search import questions_search
from app.routers.nash.questions_custom_nash import router as questions_custom_router

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

app.include_router(questions_nash.router, prefix="/api/questions", tags=["questions"])
app.include_router(questions_search.router, prefix="/api/questions/search", tags=["questions_search"])
#app.include_router(agents.router, prefix="/api/agents", tags=["agents"])

# în main.py
app.include_router(questions_custom_router, prefix="/api/questions_custom", tags=["questions_custom"])
# acum endpointul de generate custom va fi: /api/questions_custom/generate