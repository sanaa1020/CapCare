"""
routers/news.py
-----------------
Endpoint for curated health-awareness news content.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from backend.schemas.misc import NewsArticle
from backend.services.news_service import get_news

router = APIRouter(prefix="/news", tags=["News"])


@router.get("", response_model=List[NewsArticle])
def list_news(
    category: Optional[str] = Query(
        None, description="Filter by category: nutrition, allergies, wellness, medicine, health awareness"
    ),
):
    """Return curated health-awareness articles, optionally filtered by category."""
    return get_news(category=category)
