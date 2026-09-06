"""
schemas/profile.py
-------------------
Schemas for the health profile and allergies. This is where we enforce
that `severity` can only ever be "mild", "moderate", or "severe" -- if
a client sends anything else, FastAPI automatically rejects the request
with a 422 error before our code even runs.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import List, Optional

ALLOWED_SEVERITIES = {"mild", "moderate", "severe"}


# ---------- Health Profile ----------

class ProfileCreate(BaseModel):
    """Shape of data required to create/update a health profile."""
    dietary_preference: Optional[str] = None
    ingredient_concerns: List[str] = []


class IngredientConcernResponse(BaseModel):
    """A single ingredient concern, as returned by the API."""
    id: int
    concern_text: str

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    """Shape of a health profile returned by the API."""
    id: int
    user_id: int
    dietary_preference: Optional[str] = None
    ingredient_concerns: List[IngredientConcernResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Allergies ----------

class AllergyCreate(BaseModel):
    """Shape of data required to add an allergy."""
    allergen_name: str
    severity: str

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        value = value.lower().strip()
        if value not in ALLOWED_SEVERITIES:
            raise ValueError(
                f"severity must be one of {sorted(ALLOWED_SEVERITIES)}, got '{value}'"
            )
        return value


class AllergyResponse(BaseModel):
    """Shape of an allergy returned by the API."""
    id: int
    user_id: int
    allergen_name: str
    severity: str

    model_config = ConfigDict(from_attributes=True)
