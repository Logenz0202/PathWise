from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import cars, comparisons, geo
from app.core.config import settings
from app.db.migrations import upgrade_schema
from app.db.session import Base, engine
from app.models import car_profile, comparison  # noqa: F401  (registers the tables on Base)

# Create missing tables, then add any columns introduced since an existing database was created
Base.metadata.create_all(bind=engine)
upgrade_schema(engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Transport Comparison & Planner API",
    version="1.0.0",
    debug=settings.DEBUG,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(comparisons.router)
app.include_router(cars.router)
app.include_router(geo.router)


@app.get("/")
def root():
    return {"message": "Welcome to PathWise API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
