"""
routers/timeline.py
--------------------
Endpoints for logging and retrieving a user's health timeline (events):
food, symptoms, medicine, activities, and location notes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, time
from typing import List, Optional

from backend.database.database import get_db
from backend.database import models
from backend.schemas.event import EventCreate, EventResponse
from backend.routers.profile import get_user_or_404

router = APIRouter(tags=["Timeline"])


@router.post("/users/{user_id}/events", response_model=EventResponse, status_code=201)
def create_event(user_id: int, event: EventCreate, db: Session = Depends(get_db)):
    """Log a new event (food, symptom, medicine, activity, or location) for a user."""
    get_user_or_404(user_id, db)

    db_event = models.Event(
        user_id=user_id,
        event_type=event.event_type,
        description=event.description,
        timestamp=event.timestamp,
        location=event.location,
        notes=event.notes,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/users/{user_id}/events", response_model=List[EventResponse])
def list_events(
    user_id: int,
    event_type: Optional[str] = Query(
        None, description="Filter by event type: food, symptom, medicine, activity, location"
    ),
    on_date: Optional[date] = Query(
        None, description="Filter to events on this specific date (YYYY-MM-DD)"
    ),
    db: Session = Depends(get_db),
):
    """
    List a user's events, newest first. Optionally filter by event_type
    and/or a specific calendar date.
    """
    get_user_or_404(user_id, db)

    query = db.query(models.Event).filter(models.Event.user_id == user_id)

    if event_type is not None:
        query = query.filter(models.Event.event_type == event_type.lower().strip())

    if on_date is not None:
        # Build the [start of day, end of day) range for the given date,
        # since `timestamp` is stored as a full datetime.
        start_of_day = datetime.combine(on_date, time.min)
        end_of_day = datetime.combine(on_date, time.max)
        query = query.filter(models.Event.timestamp.between(start_of_day, end_of_day))

    return query.order_by(models.Event.timestamp.desc()).all()


@router.get("/users/{user_id}/events/{event_id}", response_model=EventResponse)
def get_event(user_id: int, event_id: int, db: Session = Depends(get_db)):
    """Retrieve a single event by id, scoped to the given user."""
    get_user_or_404(user_id, db)

    db_event = (
        db.query(models.Event)
        .filter(models.Event.id == event_id, models.Event.user_id == user_id)
        .first()
    )
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """Delete an event by id."""
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return None
