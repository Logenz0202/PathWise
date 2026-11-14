"""Shared test setup.

Unit tests (calculator, eco_coach, geo) need nothing external. API tests run against a real
PostgreSQL database, `pathwise_test` on the docker-compose `db` service by default, so the
developer's own `pathwise` data is never touched. Override it with TEST_DATABASE_URL (CI does).
"""

import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/pathwise_test"
)

# Must be set before anything imports app.core.config, which reads the environment once
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
# Tests use the deterministic offline Eco-Coach; the LLM path is tested with a mocked transport
os.environ["OPENROUTER_API_KEY"] = ""


def _ensure_test_database(url: str) -> None:
    """Create the test database if it doesn't exist yet (refusing anything not named *test*)."""
    parsed = make_url(url)
    if "test" not in parsed.database:
        raise RuntimeError(f"Refusing to run API tests against non-test database {parsed.database!r}")
    admin = create_engine(parsed.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as conn:
            exists = conn.scalar(text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": parsed.database})
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{parsed.database}"'))
    finally:
        admin.dispose()


@pytest.fixture(scope="session")
def api_app():
    _ensure_test_database(TEST_DATABASE_URL)
    from app.main import app  # creates the tables on import

    return app


@pytest.fixture
def db_engine(api_app):
    from app.db.session import engine

    return engine


@pytest.fixture
def client(api_app, db_engine):
    """A TestClient on an empty database."""
    from fastapi.testclient import TestClient

    with db_engine.begin() as conn:
        conn.execute(text("TRUNCATE comparisons, car_profiles RESTART IDENTITY"))
    with TestClient(api_app) as test_client:
        yield test_client
