"""
schemas/event.py
-----------------
Schemas for timeline events. Just like severity on allergies, we
restrict `event_type` to a fixed set of allowed values here in the
schema layer -- an invalid type is rejected with a 422 before it ever
reaches the database.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional

ALLOWED_EVENT_TYPES = {"food", "symptom", "medicine", "activity", "location"}


class EventCreate(BaseModel):
    """Shape of data required to log a new event."""
    event_type: str
    description: str
    timestamp: datetime
    location: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        value = value.lower().strip()
        if value not in ALLOWED_EVENT_TYPES:
            raise ValueError(
                f"event_type must be one of {sorted(ALLOWED_EVENT_TYPES)}, got '{value}'"
            )
        return value


class EventResponse(BaseModel):
    """Shape of an event returned by the API."""
    id: int
    user_id: int
    event_type: str
    description: str
    timestamp: datetime
    location: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PatternResponse(BaseModel):
    """
    Shape of a single detected pattern. Deliberately worded as an
    "association", never a cause -- see services/pattern_detector.py.
    """
    pattern_found: bool
    trigger: str
    symptom: str
    occurrences: int
    message: str
    disclaimer: str
