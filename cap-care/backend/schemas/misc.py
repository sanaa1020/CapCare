"""
schemas/misc.py
-----------------
Small standalone schemas that don't belong to any single domain file:
news articles and the aggregated health summary.
"""

from pydantic import BaseModel
from typing import List, Optional


class NewsArticle(BaseModel):
    """Shape of a single curated news article."""
    id: int
    category: str
    title: str
    summary: str
    notes: Optional[str] = None


class SummaryAllergy(BaseModel):
    allergen_name: str
    severity: str


class SummaryPattern(BaseModel):
    trigger: str
    symptom: str
    occurrences: int


class HealthSummaryResponse(BaseModel):
    """
    Aggregated snapshot of a user's health data, intended as the basis
    for a future doctor-friendly PDF export.
    """
    user_id: int
    name: str
    email: str
    age: Optional[int] = None
    dietary_preference: Optional[str] = None
    allergies: List[SummaryAllergy]
    total_logged_events: int
    recent_symptoms: List[str]
    recent_food_entries: List[str]
    detected_patterns: List[SummaryPattern]
    disclaimer: str
