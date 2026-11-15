from datetime import datetime, timezone


def utc_now() -> datetime:
    """Current time in UTC; used for created_at columns."""
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    """SQLite stores datetimes without a time zone; ours are always UTC, so say so again.

    Without this the API would send "2026-11-15T16:04:06" and browsers would read it as local time.
    """
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
