"""
services/news_service.py
--------------------------
Provides curated health-awareness news content. For this hackathon
version, it reads from a static local file (data/news.json). It's
kept in its own service function -- rather than reading the JSON
directly in the router -- specifically so that later, swapping this
out for a real news API only requires changing the inside of
`get_news()`. The router and response shape never have to change.
"""

import json
import os
from typing import List, Optional

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_NEWS_PATH = os.path.join(_DATA_DIR, "news.json")


def _load_news_data() -> dict:
    with open(_NEWS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_news(category: Optional[str] = None) -> List[dict]:
    """
    Return curated health-awareness articles, optionally filtered by
    category (e.g. "nutrition", "allergies", "wellness", "medicine",
    "health awareness").

    NOTE: this reads the JSON file fresh on every call rather than
    caching it at import time (unlike ingredient_analyzer.py). News
    content is the kind of thing that might realistically be edited
    or replaced while the server is running, so re-reading it keeps
    things simple for now -- it's a tiny file, so the cost is negligible.
    """
    data = _load_news_data()
    articles = data.get("articles", [])

    if category:
        category = category.lower().strip()
        articles = [a for a in articles if a.get("category", "").lower() == category]

    return articles
