"""
schemas/user.py
---------------
Pydantic "schemas" define the SHAPE of data going into and out of our API.
They are NOT the same as SQLAlchemy models:

- models.py  -> describes the database TABLE structure.
- schemas/*  -> describes the JSON structure the API accepts (request)
                and returns (response).

Keeping these separate means we can, for example, accept a password on
create but never include it in a response -- or add validation rules
that only matter for API input, without touching the database table.
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Shape of data required to create a new user (POST /users)."""
    name: str
    email: EmailStr
    age: Optional[int] = None


class UserResponse(BaseModel):
    """Shape of data returned to the client after fetching/creating a user."""
    id: int
    name: str
    email: EmailStr
    age: Optional[int] = None
    created_at: datetime

    # In Pydantic v2, this allows the schema to be built directly from a
    # SQLAlchemy model instance (e.g. UserResponse.model_validate(db_user))
    # instead of requiring a plain dict.
    model_config = ConfigDict(from_attributes=True)
