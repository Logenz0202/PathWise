"""Minimal schema upgrades for databases created by an older version of the app.

`Base.metadata.create_all` creates missing tables but never adds columns to existing ones,
so new nullable columns are added here. Each step checks first, so it is safe to run on
every startup and on a fresh database.
"""

from sqlalchemy import Engine, inspect, text

# (table, column, SQL type) — nullable columns added after the table was first released
ADDED_COLUMNS = [
    ("comparisons", "car_name", "VARCHAR"),
]


def upgrade_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, column, sql_type in ADDED_COLUMNS:
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
