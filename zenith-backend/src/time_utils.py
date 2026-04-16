from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return a UTC timestamp compatible with the current naive DB columns."""
    return datetime.now(UTC).replace(tzinfo=None)
