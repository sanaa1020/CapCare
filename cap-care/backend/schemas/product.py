"""
schemas/product.py
-------------------
Schemas for the product scanner: the request to analyze a manually
entered ingredient list, and the structured response describing any
potential concerns found.
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class ScannerAnalyzeRequest(BaseModel):
    """Shape of data required to analyze a product's ingredients."""
    user_id: int
    product_name: str
    ingredients: List[str]


class ConcernItem(BaseModel):
    """A single potential concern found during analysis."""
    ingredient: str
    type: str
    severity: Optional[str] = None
    message: str


class ScannerAnalyzeResponse(BaseModel):
    """Result of analyzing a product's ingredients against a user's profile."""
    product_name: str
    safe: bool
    concerns: List[ConcernItem]
    matched_allergens: List[str]
    dietary_conflicts: List[str]
    recommendations: List[str]


class ProductResponse(BaseModel):
    """Shape of a cached product record, as returned by the API."""
    id: int
    barcode: Optional[str] = None
    product_name: str
    ingredients: str
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BarcodeLookupResponse(BaseModel):
    """Shape of the response for a barcode lookup."""
    barcode: str
    product_name: str
    ingredients: List[str]
    source: str
    cached: bool
    warning: Optional[str] = None
