from fastapi import FastAPI

app = FastAPI(
    title="PrepWise AI API",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to PrepWise AI API"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
