"""
services/ingredient_analyzer.py
--------------------------------
This is the core "business logic" of Cap Care: given a list of
ingredients and a user's health profile (allergies, dietary preference,
ingredient concerns), figure out what might be worth their attention.

This file is deliberately kept separate from the router (scanner.py).
The router's job is just to handle HTTP request/response; this file's
job is the actual analysis, so it can be tested or reused independently
of any web framework.

IMPORTANT: this analyzer never claims a product is medically "safe" or
"dangerous". It only surfaces *potential concerns* based on simple
keyword matching against user-provided data. It is not a diagnostic or
medical tool.
"""

import json
import os
from typing import List, Dict, Optional

# Resolve paths to the data files relative to this file's location, so
# the analyzer works no matter what directory uvicorn is started from.
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_ALLERGENS_PATH = os.path.join(_DATA_DIR, "allergens.json")
_INGREDIENTS_PATH = os.path.join(_DATA_DIR, "ingredients.json")


def _load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# Loaded once when this module is first imported, rather than re-reading
# the files from disk on every single API request.
_allergen_data = _load_json(_ALLERGENS_PATH)
_ingredient_data = _load_json(_INGREDIENTS_PATH)


def _build_allergen_lookup() -> Dict[str, str]:
    """
    Build a flat dictionary mapping every allergen name AND every one of
    its aliases (all lowercased) to the canonical allergen name.

    Example result includes entries like:
        "casein" -> "milk"
        "milk"   -> "milk"
        "shrimp" -> "shellfish"
    """
    lookup = {}
    for allergen in _allergen_data["allergens"]:
        canonical = allergen["name"].lower()
        lookup[canonical] = canonical
        for alias in allergen.get("aliases", []):
            lookup[alias.lower()] = canonical
    return lookup


_allergen_lookup = _build_allergen_lookup()


def _canonical_ingredient_name(raw_ingredient: str) -> str:
    """
    Resolve an ingredient's alias (e.g. "casein") to its canonical form
    (e.g. "milk") using ingredients.json, if one exists. Otherwise,
    return the ingredient as-is (lowercased).
    """
    cleaned = raw_ingredient.lower().strip()
    return _ingredient_data.get("aliases", {}).get(cleaned, cleaned)


def _ingredient_categories(canonical_name: str) -> List[str]:
    """Return the concern categories (e.g. ['animal-derived']) tagged for this ingredient."""
    return _ingredient_data.get("categories", {}).get(canonical_name, [])


def analyze_ingredients(
    ingredients: List[str],
    allergies: Optional[List[dict]] = None,
    dietary_preference: Optional[str] = None,
    ingredient_concerns: Optional[List[str]] = None,
) -> dict:
    """
    Analyze a list of ingredients against a user's health profile.

    Parameters
    ----------
    ingredients: raw ingredient strings from a product, e.g. ["milk", "sugar", "cocoa"]
    allergies: list of dicts like {"allergen_name": "milk", "severity": "severe"}
    dietary_preference: e.g. "vegan", "vegetarian", or None
    ingredient_concerns: list of concern strings, e.g. ["animal-derived", "plastic-derived"]

    Returns
    -------
    A dict with:
        - safe: bool (False if any concern was found -- see note below)
        - concerns: list of {ingredient, type, severity, message}
        - matched_allergens: list of canonical allergen names matched
        - dietary_conflicts: list of ingredients conflicting with dietary_preference
        - recommendations: list of plain-language suggestions

    NOTE on "safe": this field only reflects whether our simple keyword
    matching found anything worth flagging. It is NEVER a medical safety
    claim -- see the disclaimer baked into the "recommendations" list.
    """
    allergies = allergies or []
    ingredient_concerns = [c.lower().strip() for c in (ingredient_concerns or [])]

    # Build a quick lookup of the user's allergies by canonical allergen name.
    user_allergen_severity = {}
    for a in allergies:
        name = a["allergen_name"].lower().strip()
        canonical = _allergen_lookup.get(name, name)
        user_allergen_severity[canonical] = a["severity"]

    vegan_or_vegetarian = (dietary_preference or "").lower().strip() in {"vegan", "vegetarian"}

    concerns = []
    matched_allergens = set()
    dietary_conflicts = []

    for raw_ingredient in ingredients:
        canonical = _canonical_ingredient_name(raw_ingredient)
        categories = _ingredient_categories(canonical)

        # 1. Personal allergens: does this ingredient match one of the
        #    user's allergies (directly or via an allergen alias)?
        allergen_match = _allergen_lookup.get(raw_ingredient.lower().strip()) or _allergen_lookup.get(canonical)
        if allergen_match and allergen_match in user_allergen_severity:
            severity = user_allergen_severity[allergen_match]
            matched_allergens.add(allergen_match)
            concerns.append({
                "ingredient": raw_ingredient,
                "type": "allergen",
                "severity": severity,
                "message": (
                    f"Potential concern: '{raw_ingredient}' matches your recorded "
                    f"'{allergen_match}' allergy."
                ),
            })

        # 2. Dietary conflicts: if the user is vegan/vegetarian and this
        #    ingredient is tagged animal-derived, flag it.
        if vegan_or_vegetarian and "animal-derived" in categories:
            dietary_conflicts.append(raw_ingredient)
            concerns.append({
                "ingredient": raw_ingredient,
                "type": "dietary",
                "severity": None,
                "message": (
                    f"Potential concern: '{raw_ingredient}' is animal-derived, which may "
                    f"conflict with your {dietary_preference} preference."
                ),
            })

        # 3. Animal-derived (surfaced even without a vegan/vegetarian
        #    preference, in case the user just wants awareness).
        elif "animal-derived" in categories:
            concerns.append({
                "ingredient": raw_ingredient,
                "type": "animal-derived",
                "severity": None,
                "message": f"'{raw_ingredient}' is an animal-derived ingredient.",
            })

        # 4. User-defined ingredient concerns (e.g. "plastic-derived").
        matched_user_concerns = [c for c in ingredient_concerns if c in categories]
        for concern_label in matched_user_concerns:
            concerns.append({
                "ingredient": raw_ingredient,
                "type": "user-concern",
                "severity": None,
                "message": (
                    f"Potential concern: '{raw_ingredient}' matches your noted concern "
                    f"about '{concern_label}' ingredients."
                ),
            })

    recommendations = [
        "This analysis is for health awareness only and is not a medical diagnosis.",
        "If you have a known severe allergy, always verify ingredients directly with the manufacturer.",
    ]

    return {
        "safe": len(concerns) == 0,
        "concerns": concerns,
        "matched_allergens": sorted(matched_allergens),
        "dietary_conflicts": dietary_conflicts,
        "recommendations": recommendations,
    }
