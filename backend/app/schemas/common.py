from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator

from app.core.time import as_utc

# Datetime sent as UTC ("...+00:00"); SQLite hands datetimes back without a time zone
UtcDatetime = Annotated[datetime, AfterValidator(as_utc)]
