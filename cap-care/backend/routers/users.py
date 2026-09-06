"""
routers/users.py
-----------------
A "router" groups related API endpoints together. This one handles
everything about Users: creating, listing, and fetching a single user.

Splitting routers into files (users.py, profile.py, scanner.py, etc.)
instead of dumping everything in main.py keeps each file small and
focused, and makes it obvious where to look when you need to change
something.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from backend.database.database import get_db
from backend.database import models
from backend.schemas.user import UserCreate, UserResponse
from backend.schemas.misc import HealthSummaryResponse
from backend.services.pattern_detector import detect_patterns

# `prefix` means every route in this file automatically starts with /users.
# `tags` controls how these routes are grouped/labeled in the Swagger UI.
router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.

    Flow: Pydantic validates the incoming JSON against UserCreate ->
    we build a SQLAlchemy User object -> save it -> return it (FastAPI
    converts it to JSON using UserResponse).
    """
    db_user = models.User(name=user.name, email=user.email, age=user.age)
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        # This happens if the email already exists, since we marked
        # `email` as unique in the model.
        db.rollback()
        raise HTTPException(status_code=422, detail="A user with this email already exists.")
    db.refresh(db_user)  # reloads db_user with the id/created_at set by the DB
    return db_user


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Return every user in the database."""
    return db.query(models.User).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Return a single user by id, or 404 if not found."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("/{user_id}/summary", response_model=HealthSummaryResponse)
def get_health_summary(user_id: int, db: Session = Depends(get_db)):
    """
    Return an aggregated snapshot of a user's health data: profile,
    allergies, event counts, recent symptoms/food, and detected
    patterns. This is designed to later feed a doctor-friendly PDF
    export -- for now it's just structured JSON.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db_profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == user_id)
        .first()
    )
    dietary_preference = db_profile.dietary_preference if db_profile else None

    db_allergies = db.query(models.Allergy).filter(models.Allergy.user_id == user_id).all()

    db_events = (
        db.query(models.Event)
        .filter(models.Event.user_id == user_id)
        .order_by(models.Event.timestamp.desc())
        .all()
    )

    # "Recent" here means the 5 most recent of that type, newest first.
    recent_symptoms = [e.description for e in db_events if e.event_type == "symptom"][:5]
    recent_food_entries = [e.description for e in db_events if e.event_type == "food"][:5]

    event_dicts = [
        {"event_type": e.event_type, "description": e.description, "timestamp": e.timestamp}
        for e in db_events
    ]
    patterns = detect_patterns(event_dicts)

    return {
        "user_id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "age": db_user.age,
        "dietary_preference": dietary_preference,
        "allergies": [{"allergen_name": a.allergen_name, "severity": a.severity} for a in db_allergies],
        "total_logged_events": len(db_events),
        "recent_symptoms": recent_symptoms,
        "recent_food_entries": recent_food_entries,
        "detected_patterns": [
            {"trigger": p["trigger"], "symptom": p["symptom"], "occurrences": p["occurrences"]}
            for p in patterns
        ],
        "disclaimer": (
            "This summary is for personal health awareness and record-keeping only. "
            "It is not a medical diagnosis. Please consult a healthcare professional "
            "for medical advice."
        ),
    }
