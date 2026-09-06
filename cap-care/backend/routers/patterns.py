"""
routers/patterns.py
--------------------
Endpoint for detecting recurring associations between logged events
(e.g. a food repeatedly preceding a symptom). All actual logic lives in
services/pattern_detector.py -- this router just fetches the user's
events from the database and hands them to that service.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.database.database import get_db
from backend.database import models
from backend.schemas.event import PatternResponse
from backend.services.pattern_detector import detect_patterns
from backend.routers.profile import get_user_or_404

router = APIRouter(tags=["Patterns"])


@router.get("/users/{user_id}/patterns", response_model=List[PatternResponse])
def get_patterns(user_id: int, db: Session = Depends(get_db)):
    """
    Analyze a user's full event history for recurring associations
    between a trigger (food/medicine/activity) and a symptom.

    Returns an empty list if no recurring pattern meets the minimum
    occurrence threshold -- that is a normal, expected result, not an error.
    """
    get_user_or_404(user_id, db)

    db_events = db.query(models.Event).filter(models.Event.user_id == user_id).all()

    # Convert SQLAlchemy Event objects into plain dicts, since
    # detect_patterns() is pure business logic that shouldn't need to
    # know anything about SQLAlchemy.
    event_dicts = [
        {
            "event_type": e.event_type,
            "description": e.description,
            "timestamp": e.timestamp,
        }
        for e in db_events
    ]

    return detect_patterns(event_dicts)
