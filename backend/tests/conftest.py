"""Shared test setup.

Unit tests (calculator, eco_coach, geo, routing parsing) need nothing external. API and caching
tests use a throwaway SQLite file in a temporary folder, so the developer's own pathwise.db is
never touched.
"""

import os
import tempfile
from pathlib import Path

import pytest

# Must be set before anything imports app.core.config, which reads the environment once
TEST_DB = Path(tempfile.mkdtemp(prefix="pathwise-tests-")) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
# Tests use the deterministic offline Eco-Coach; the LLM path is tested with a mocked transport
os.environ["OPENROUTER_API_KEY"] = ""
# No network: routes are estimated; the OSRM client is tested with a mocked transport
os.environ["OSRM_URL"] = ""


@pytest.fixture(scope="session")
def api_app():
    from app.main import app  # creates the tables on import

    return app


@pytest.fixture
def db_engine(api_app):
    """The app's database engine, with every table emptied."""
    from app.db.session import Base, engine

    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    return engine


@pytest.fixture
def client(api_app, db_engine):
    """A TestClient on an empty database."""
    from fastapi.testclient import TestClient

    with TestClient(api_app) as test_client:
        yield test_client
