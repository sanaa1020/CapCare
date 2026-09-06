"""
routers/profile.py
-------------------
Endpoints for creating/updating and retrieving a user's health profile,
including their list of ingredient concerns.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database import models
from backend.schemas.profile import ProfileCreate, ProfileResponse, AllergyCreate, AllergyResponse
from typing import List

router = APIRouter(tags=["Profile"])


def get_user_or_404(user_id: int, db: Session) -> models.User:
    """
    Shared helper: look up a user by id, or raise a 404.

    Several routers need this same check (profile, allergies, events,
    scanner), so pulling it out avoids repeating the same four lines
    everywhere.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.post("/users/{user_id}/profile", response_model=ProfileResponse)
def create_or_update_profile(user_id: int, profile: ProfileCreate, db: Session = Depends(get_db)):
    """
    Create a health profile for the user if one doesn't exist yet,
    or update it (including replacing the ingredient concerns list)
    if it does.
    """
    get_user_or_404(user_id, db)

    db_profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == user_id)
        .first()
    )

    if db_profile is None:
        # No profile yet -> create one.
        db_profile = models.HealthProfile(user_id=user_id, dietary_preference=profile.dietary_preference)
        db.add(db_profile)
        db.flush()  # assigns db_profile.id without fully committing yet
    else:
        # Profile exists -> update its dietary preference and wipe out
        # its old concerns so we can replace them with the new list below.
        db_profile.dietary_preference = profile.dietary_preference
        for concern in list(db_profile.ingredient_concerns):
            db.delete(concern)

    # Add the (possibly new) list of ingredient concerns.
    for concern_text in profile.ingredient_concerns:
        db.add(models.IngredientConcern(profile_id=db_profile.id, concern_text=concern_text))

    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.get("/users/{user_id}/profile", response_model=ProfileResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    """Retrieve a user's health profile, or 404 if none exists yet."""
    get_user_or_404(user_id, db)

    db_profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == user_id)
        .first()
    )
    if db_profile is None:
        raise HTTPException(status_code=404, detail="This user has no health profile yet")
    return db_profile


# ---------------------------------------------------------------------
# Allergy endpoints
# These live in this same router file since they're conceptually part
# of a user's health profile, and share the AllergyCreate/Response
# schemas defined in schemas/profile.py.
# ---------------------------------------------------------------------

@router.post("/users/{user_id}/allergies", response_model=AllergyResponse, status_code=201, tags=["Profile"])
def add_allergy(user_id: int, allergy: AllergyCreate, db: Session = Depends(get_db)):
    """Add a new allergy for the given user."""
    get_user_or_404(user_id, db)

    db_allergy = models.Allergy(
        user_id=user_id,
        allergen_name=allergy.allergen_name,
        severity=allergy.severity,
    )
    db.add(db_allergy)
    db.commit()
    db.refresh(db_allergy)
    return db_allergy


@router.get("/users/{user_id}/allergies", response_model=List[AllergyResponse], tags=["Profile"])
def list_allergies(user_id: int, db: Session = Depends(get_db)):
    """List every allergy belonging to the given user."""
    get_user_or_404(user_id, db)
    return db.query(models.Allergy).filter(models.Allergy.user_id == user_id).all()


@router.delete("/allergies/{allergy_id}", status_code=204, tags=["Profile"])
def delete_allergy(allergy_id: int, db: Session = Depends(get_db)):
    """
    Delete an allergy by id.

    Note: we don't need a user_id in the URL here because allergy_id is
    already globally unique. We just look it up directly.
    """
    db_allergy = db.query(models.Allergy).filter(models.Allergy.id == allergy_id).first()
    if db_allergy is None:
        raise HTTPException(status_code=404, detail="Allergy not found")
    db.delete(db_allergy)
    db.commit()
    return None
