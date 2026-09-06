"""
routers/scanner.py
-------------------
Endpoints for analyzing a product's ingredients against a user's health
profile. The barcode-lookup endpoint is added in the next stage.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database import models
from backend.schemas.product import ScannerAnalyzeRequest, ScannerAnalyzeResponse, BarcodeLookupResponse
from backend.services.ingredient_analyzer import analyze_ingredients
from backend.services import barcode_service

router = APIRouter(prefix="/scanner", tags=["Scanner"])


@router.post("/analyze", response_model=ScannerAnalyzeResponse)
def analyze_product(request: ScannerAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyze a manually entered product's ingredients against the given
    user's allergies, dietary preference, and ingredient concerns.

    Flow: look up the user -> gather their profile/allergies -> hand
    everything to the ingredient_analyzer service -> return the result.
    """
    db_user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db_profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == request.user_id)
        .first()
    )
    dietary_preference = db_profile.dietary_preference if db_profile else None
    ingredient_concerns = (
        [c.concern_text for c in db_profile.ingredient_concerns] if db_profile else []
    )

    db_allergies = db.query(models.Allergy).filter(models.Allergy.user_id == request.user_id).all()
    allergies = [{"allergen_name": a.allergen_name, "severity": a.severity} for a in db_allergies]

    result = analyze_ingredients(
        ingredients=request.ingredients,
        allergies=allergies,
        dietary_preference=dietary_preference,
        ingredient_concerns=ingredient_concerns,
    )

    return {
        "product_name": request.product_name,
        **result,
    }


@router.get("/barcode/{barcode}", response_model=BarcodeLookupResponse)
def lookup_barcode(barcode: str, db: Session = Depends(get_db)):
    """
    Look up a product by barcode.

    First checks our local cache (the products table); if we've already
    looked this barcode up before, we return that instantly without
    hitting Open Food Facts again. Otherwise, queries Open Food Facts,
    caches a successful result, and returns it.

    This endpoint never crashes on external API failure -- network
    problems are translated into a clean 503 response instead of a
    raw exception.
    """
    # 1. Check the cache first.
    cached_product = db.query(models.Product).filter(models.Product.barcode == barcode).first()
    if cached_product is not None:
        return {
            "barcode": barcode,
            "product_name": cached_product.product_name,
            "ingredients": [i.strip() for i in cached_product.ingredients.split(",") if i.strip()],
            "source": cached_product.source,
            "cached": True,
            "warning": None,
        }

    # 2. Not cached -> ask the external service.
    result = barcode_service.lookup_barcode(barcode)

    if result["status"] == "invalid_barcode":
        raise HTTPException(status_code=422, detail=result["message"])

    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail=result["message"])

    if result["status"] == "network_error":
        # 503 Service Unavailable: OUR server is fine, but the external
        # dependency it relies on is not. This is the "graceful failure"
        # the spec asks for -- the FastAPI app itself never crashes.
        raise HTTPException(status_code=503, detail=result["message"])

    # 3. Success -> cache it for next time, then return it.
    ingredients_list = result["ingredients"]
    db_product = models.Product(
        barcode=barcode,
        product_name=result["product_name"],
        ingredients=", ".join(ingredients_list),
        source="openfoodfacts",
    )
    db.add(db_product)
    db.commit()

    warning = "This product has no ingredient data available." if result.get("missing_ingredients") else None

    return {
        "barcode": barcode,
        "product_name": result["product_name"],
        "ingredients": ingredients_list,
        "source": "openfoodfacts",
        "cached": False,
        "warning": warning,
    }
