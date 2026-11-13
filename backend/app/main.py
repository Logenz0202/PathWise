from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import comparisons
from app.db.session import engine, Base
from app.models import comparison  # noqa: F401

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Transport Comparison & Planner API",
    version="1.0.0",
    debug=settings.DEBUG,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(comparisons.router)


@app.get("/")
def root():
    return {"message": "Welcome to PathWise API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}