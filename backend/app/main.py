from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SQLModel
from .routers.nash import questions_nash
from app.routers.search import questions_search
from app.routers.nash.questions_custom_nash import router as questions_custom_router
from app.routers.csp import csp
from app.routers.minmax import questions_minmax
from app.routers.gametheory import questions_gametheory

app = FastAPI(title="SmarTest L6 API")

# create tables on startup
@app.on_event("startup")
def on_startup():
    import time
    from sqlalchemy.exc import OperationalError
    
    retries = 20
    while retries > 0:
        try:
            print(f"Attempting DB connection... {retries} retries left.")
            SQLModel.metadata.create_all(engine)
            print("DB Connected and tables created.")
            break
        except OperationalError as e:
            retries -= 1
            print(f"DB not ready yet, waiting 2s... Error: {e}")
            time.sleep(2)
    else:
        print("Could not connect to DB after multiple retries.")
        # Optional: raise e or sys.exit(1)

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions_minmax.router, prefix="/api/questions/minmax", tags=["minmax"])
app.include_router(questions_search.router, prefix="/api/questions/search", tags=["questions_search"])
app.include_router(questions_custom_router, prefix="/api/questions_custom", tags=["questions_custom"])
app.include_router(csp.router)
app.include_router(questions_gametheory.router, prefix="/api/gametheory", tags=["gametheory"])
from app.routers.gametheory import questions_custom_gametheory
app.include_router(questions_custom_gametheory.router, prefix="/api/gametheory-custom", tags=["gametheory-custom"])
# Nash router has a generic path /api/questions/{qid} so it must be last
app.include_router(questions_nash.router, prefix="/api/questions", tags=["questions"])
