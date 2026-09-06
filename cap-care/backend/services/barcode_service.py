"""
services/barcode_service.py
-----------------------------
Looks up a product by barcode using the Open Food Facts API
(https://world.openfoodfacts.org). All the messy details of talking to
that external service -- network calls, timeouts, malformed responses --
are isolated here, so the rest of the app (the router) never has to
know or care that an external API is involved. It just gets back a
clean dict describing what happened.

Why isolate this in its own file:
External APIs are unreliable by nature (they can be slow, down, or
change their response format). Keeping that unpredictability contained
to one file means a failure here can never crash the rest of the
FastAPI app -- the router just checks the "status" field and responds
accordingly.
"""

import requests

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
REQUEST_TIMEOUT_SECONDS = 6

# Open Food Facts blocks requests with generic/default User-Agent headers
# (like the default one Python's requests library sends) with a 403.
# They ask API consumers to identify their app, so we set one explicitly.
_HEADERS = {
    "User-Agent": "CapCare-Hackathon-App/1.0 (contact: hackathon-project@example.com)"
}


def _is_valid_barcode_format(barcode: str) -> bool:
    """
    Very basic sanity check: a barcode should be a non-empty string of
    digits (real-world barcodes -- UPC/EAN -- are numeric). This catches
    obviously malformed input before we even attempt a network call.
    """
    return barcode.isdigit() and len(barcode) >= 6


def lookup_barcode(barcode: str) -> dict:
    """
    Look up a product by barcode.

    Returns a dict with a "status" key that is always one of:
        "invalid_barcode"  -> barcode isn't a plausible barcode format
        "not_found"         -> Open Food Facts has no record of this barcode
        "network_error"     -> could not reach Open Food Facts, or it errored
        "success"           -> product found; "product_name" and
                                "ingredients" (a list of strings) are populated
                                ("ingredients" may be an empty list if the
                                product exists but has no ingredient data)

    This function NEVER raises an exception for expected failure cases
    (bad barcode, product missing, network down) -- it always returns a
    dict describing what happened, so the caller can respond cleanly
    instead of crashing.
    """
    if not _is_valid_barcode_format(barcode):
        return {"status": "invalid_barcode", "message": "Barcode must be a numeric string of at least 6 digits."}

    url = OPEN_FOOD_FACTS_URL.format(barcode=barcode)

    try:
        response = requests.get(url, headers=_HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout:
        return {"status": "network_error", "message": "Open Food Facts did not respond in time. Please try again."}
    except requests.exceptions.RequestException as exc:
        # Covers connection errors, DNS failures, bad HTTP status codes, etc.
        return {"status": "network_error", "message": f"Could not reach Open Food Facts: {exc}"}
    except ValueError:
        # response.json() raises ValueError if the body isn't valid JSON.
        return {"status": "network_error", "message": "Open Food Facts returned an unreadable response."}

    # Open Food Facts uses "status": 1 for found, 0 for not found.
    if data.get("status") != 1 or "product" not in data:
        return {"status": "not_found", "message": f"No product found for barcode '{barcode}'."}

    product = data["product"]
    product_name = product.get("product_name") or "Unknown product"

    # Ingredients can show up in a couple of different shapes depending
    # on the product entry. We try the structured list first, then fall
    # back to the plain text field, and finally accept that some
    # products simply have no ingredient data at all.
    ingredients: list[str] = []
    structured = product.get("ingredients")
    if isinstance(structured, list) and structured:
        ingredients = [item.get("text", "").strip() for item in structured if item.get("text")]

    if not ingredients:
        ingredients_text = product.get("ingredients_text") or ""
        if ingredients_text.strip():
            ingredients = [part.strip() for part in ingredients_text.split(",") if part.strip()]

    return {
        "status": "success",
        "product_name": product_name,
        "ingredients": ingredients,
        "missing_ingredients": len(ingredients) == 0,
    }
