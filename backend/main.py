from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.planner import router as planner_router
from app.api.dashboard import router as dashboard_router

from app.api.career import router as career_router

app = FastAPI(
    title="PrepWise AI API",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(planner_router)
app.include_router(dashboard_router)
app.include_router(career_router)

@app.get("/")
def root():
    return {"message": "Welcome to PrepWise AI API"}


@app.get("/health")
def health():
    return {"status": "healthy"}