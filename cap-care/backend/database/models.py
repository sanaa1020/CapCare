"""
models.py
---------
This file defines our SQLAlchemy MODELS. A "model" here is a Python class
that represents a database TABLE. Each class attribute (like `name`,
`email`) becomes a COLUMN in that table.

We are building this incrementally. Right now (Stage 1) we only define
the `User` table, since every other table (health_profiles, allergies,
events, products) will have a foreign key pointing back to a user.

Relationships to other tables (HealthProfile, Allergy, Event) are added
as those models are introduced in later stages, using SQLAlchemy's
`relationship()` helper, which lets us do things like `user.allergies`
in Python instead of writing manual JOIN queries everywhere.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.database.database import Base


class User(Base):
    """
    Represents a single person using Cap Care.

    Why this table exists:
    Every other piece of data in the app (profile, allergies, logged
    events, etc.) belongs to a specific person. The User table is the
    anchor that everything else links back to via a `user_id` foreign key.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Now that HealthProfile and Allergy exist below, we can wire up the
    # relationships. `uselist=False` on profile means "one user has at
    # most one profile" (a one-to-one relationship), whereas allergies
    # is a plain one-to-many list. `cascade="all, delete-orphan"` means:
    # if a User is deleted, their profile/allergies are deleted too,
    # instead of being left behind as orphaned rows.
    profile = relationship(
        "HealthProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    allergies = relationship(
        "Allergy", back_populates="user", cascade="all, delete-orphan"
    )
    events = relationship(
        "Event", back_populates="user", cascade="all, delete-orphan"
    )


class HealthProfile(Base):
    """
    Stores a user's high-level dietary preference (e.g. "vegan").

    Why this table exists (separate from User):
    Not every user will fill this in immediately, and it's optional /
    editable data distinct from core identity info. Keeping it in its
    own table also keeps the User table lean and makes it easy to add
    more profile fields later without touching the users table.
    """

    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    dietary_preference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")
    # One profile can have many individual ingredient concerns
    # (e.g. "animal-derived", "plastic-derived"), each as its own row.
    ingredient_concerns = relationship(
        "IngredientConcern", back_populates="profile", cascade="all, delete-orphan"
    )


class IngredientConcern(Base):
    """
    A single ingredient-related concern attached to a health profile
    (e.g. "animal-derived", "artificial-sweetener").

    Why this table exists (instead of a comma-separated string column):
    Storing each concern as its own row lets us add, remove, and query
    individual concerns cleanly with normal SQL, instead of parsing and
    rewriting a packed text field every time something changes.
    """

    __tablename__ = "ingredient_concerns"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("health_profiles.id"), nullable=False)
    concern_text = Column(String, nullable=False)

    profile = relationship("HealthProfile", back_populates="ingredient_concerns")


class Allergy(Base):
    """
    A single allergy belonging to a user (e.g. "milk", severity "severe").

    Why this table exists:
    A user can have multiple allergies, each with its own severity, so
    this needs to be a separate one-to-many table rather than columns
    on User.
    """

    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    allergen_name = Column(String, nullable=False)
    # Severity is stored as a plain string here; the *validation* that
    # restricts it to "mild"/"moderate"/"severe" happens in the Pydantic
    # schema (schemas/profile.py), not in the database column itself.
    severity = Column(String, nullable=False)

    user = relationship("User", back_populates="allergies")


class Event(Base):
    """
    A single entry in a user's health timeline: a logged food, symptom,
    medicine, activity, or location note.

    Why this table exists:
    This is the core "diary" of the app. Every food eaten, symptom felt,
    medicine taken, or activity done is one row here. The pattern
    detector (later stage) and health summary both read from this table.

    `event_type` is stored as a plain string; the restriction to
    food/symptom/medicine/activity/location is enforced in the Pydantic
    schema (schemas/event.py), same approach as `severity` on Allergy.
    """

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    location = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="events")


class Product(Base):
    """
    A cached record of a product's name and ingredients, keyed by barcode.

    Why this table exists:
    Looking up a barcode against an external service (Open Food Facts,
    added in the next stage) is slow and depends on the internet being
    available. Storing what we've already looked up here means repeat
    scans of the same barcode are instant and work offline, and lets us
    track where the data came from (`source`, e.g. "openfoodfacts" or
    "manual").
    """

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    product_name = Column(String, nullable=False)
    # Stored as a single comma-separated string for simplicity, since a
    # product's ingredient list is read-only reference data (unlike
    # ingredient_concerns, which users actively add/remove one at a time).
    ingredients = Column(String, nullable=False)
    source = Column(String, nullable=False, default="manual")
    created_at = Column(DateTime, default=datetime.utcnow)
