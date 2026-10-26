from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

from app.api.planner import router as planner_router
from app.api.dashboard import router as dashboard_router
from app.api.career import router as career_router
from app.api.quiz import router as quiz_router
from app.api.revision import router as revision_router
from app.api.progress import router as progress_router

app = FastAPI(
    title="PrepWise AI API",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(planner_router)
app.include_router(dashboard_router)
app.include_router(career_router)
app.include_router(quiz_router)
app.include_router(revision_router)
app.include_router(progress_router)
@app.get("/")
def root():
    return {"message": "Welcome to PrepWise AI API"}


@app.get("/health")
def health():
    return {"status": "healthy"}