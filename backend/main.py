from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"

OPTIONS = {
    "branch_type": [
        "Mall",
        "CBD / Office",
        "Neighborhood",
        "Transit",
        "Hospital",
        "University Area",
    ],
    "region": ["Bangkok", "Central", "North", "Northeast", "South"],
    "season": [
        "Normal",
        "Valentine",
        "Graduation",
        "Songkran",
        "Mother's Day",
        "New Year",
        "Christmas",
        "Back to School",
    ],
    "occasion": [
        "Birthday",
        "Couple Gift",
        "Friend Group",
        "Family Celebration",
        "Office Celebration",
        "Self Reward",
        "Seasonal Gift",
    ],
    "cake_type": [
        "Chocolate",
        "Vanilla",
        "Strawberry",
        "Red Velvet",
        "Cheesecake",
        "Matcha",
        "Fruit Cake",
    ],
    "promotion_type": [
        "Discount",
        "Bundle",
        "Limited Edition",
        "Free Add-on",
        "Personalized Box",
        "Social Challenge",
        "Creator Collaboration",
    ],
    "day_of_week": ["Weekday", "Weekend"],
}

FEATURE_COLUMNS = [
    "branch_type",
    "region",
    "season",
    "occasion",
    "cake_type",
    "promotion_type",
    "day_of_week",
    "discount_percent",
    "social_media_spend",
    "influencer_support",
    "customization_available",
    "personalized_bundle",
    "campaign_duration_days",
    "estimated_foot_traffic",
    "website_visits",
    "branch_capacity",
    "base_price",
    "gross_margin_percent",
    "campaign_cost",
]


class PromotionInput(BaseModel):
    branch_type: str = "Mall"
    region: str = "Bangkok"
    season: str = "Valentine"
    occasion: str = "Couple Gift"
    cake_type: str = "Strawberry"
    promotion_type: str = "Personalized Box"
    discount_percent: float = Field(10, ge=0, le=60)
    social_media_spend: float = Field(50000, ge=0)
    influencer_support: int = Field(1, ge=0, le=1)
    customization_available: int = Field(1, ge=0, le=1)
    personalized_bundle: int = Field(1, ge=0, le=1)
    day_of_week: str = "Weekend"
    campaign_duration_days: int = Field(7, ge=1, le=60)
    estimated_foot_traffic: float = Field(12000, ge=0)
    website_visits: float = Field(8000, ge=0)
    branch_capacity: float = Field(600, ge=1)
    base_price: float = Field(950, ge=1)
    gross_margin_percent: float = Field(55, ge=1, le=95)
    campaign_cost: float = Field(90000, ge=0)


class PredictionResponse(BaseModel):
    predicted_orders: int
    predicted_revenue: float
    predicted_profit: float
    predicted_roi: float
    calculated_roi: float
    success_probability: float
    recommendation: Literal["Launch", "Revise", "Reject"]
    reason: str
    risk_level: Literal["Low", "Medium", "High"]
    estimated_incremental_revenue: float
    break_even_orders: int


app = FastAPI(
    title="Cake The Crack - Forecasting Engine MVP",
    description="Promotion forecasting API for S&P cake marketing strategy demos.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_models = None


def load_models():
    global _models
    if _models is not None:
        return _models

    paths = {
        "revenue": MODELS_DIR / "revenue_model.pkl",
        "roi": MODELS_DIR / "roi_model.pkl",
        "success": MODELS_DIR / "success_model.pkl",
    }
    missing = [str(path) for path in paths.values() if not path.exists()]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Model files are missing: {', '.join(missing)}. Run scripts/train_model.py.",
        )
    _models = {key: joblib.load(path) for key, path in paths.items()}
    return _models


def validate_options(payload: PromotionInput) -> None:
    for field, values in OPTIONS.items():
        if getattr(payload, field) not in values:
            raise HTTPException(
                status_code=422,
                detail=f"{field} must be one of: {', '.join(values)}",
            )


def recommendation_for(predicted_roi: float, success_probability: float) -> tuple[str, str]:
    if predicted_roi >= 1.5 and success_probability >= 0.65:
        return (
            "Launch",
            "Strong projected ROI and high success probability. This mix is ready for launch.",
        )
    if predicted_roi < 1.0 or success_probability < 0.45:
        return (
            "Reject",
            "The forecast does not clear the ROI or confidence threshold. Redesign before committing budget.",
        )
    return (
        "Revise",
        "The campaign has potential, but budget, channel support, or offer design should be tuned first.",
    )


def risk_for(predicted_roi: float) -> str:
    if predicted_roi >= 1.5:
        return "Low"
    if predicted_roi >= 1.0:
        return "Medium"
    return "High"


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "S&P Promotion Forecasting Engine"}


@app.get("/options")
def get_options() -> dict[str, list[str]]:
    return OPTIONS


@app.get("/model-info")
def get_model_info() -> dict[str, object]:
    metrics_path = MODELS_DIR / "metrics.json"
    if not metrics_path.exists():
        return {
            "model_type": "Models not trained yet",
            "training_data_size": 0,
            "revenue_r2": None,
            "roi_r2": None,
            "success_accuracy": None,
            "last_trained_date": None,
            "feature_importance": [],
            "disclaimer": "This is an MVP using simulated data for business case demonstration.",
        }
    info = json.loads(metrics_path.read_text(encoding="utf-8"))
    info["disclaimer"] = "This is an MVP using simulated data for business case demonstration."
    return info


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PromotionInput) -> PredictionResponse:
    validate_options(payload)
    models = load_models()

    row = pd.DataFrame([{column: getattr(payload, column) for column in FEATURE_COLUMNS}])
    predicted_revenue = max(0, float(models["revenue"].predict(row)[0]))
    model_roi = float(models["roi"].predict(row)[0])

    if hasattr(models["success"], "predict_proba"):
        model_success_probability = float(models["success"].predict_proba(row)[0][1])
    else:
        model_success_probability = float(models["success"].predict(row)[0])

    predicted_orders = int(round(predicted_revenue / max(payload.base_price, 1)))
    predicted_profit = predicted_revenue * (payload.gross_margin_percent / 100) - payload.campaign_cost
    calculated_roi = predicted_profit / payload.campaign_cost if payload.campaign_cost else 0.0
    predicted_roi = max(-1.0, (model_roi * 0.55) + (calculated_roi * 0.45))
    heuristic_probability = 1 / (1 + math.exp(-((predicted_roi - 1.12) * 2.35)))
    heuristic_probability += 0.04 if payload.customization_available else 0
    heuristic_probability += 0.04 if payload.personalized_bundle else 0
    heuristic_probability += 0.03 if payload.influencer_support else 0
    success_probability = min(
        0.96,
        max(model_success_probability, heuristic_probability),
    )

    recommendation, reason = recommendation_for(predicted_roi, success_probability)
    risk_level = risk_for(predicted_roi)

    baseline_revenue = payload.branch_capacity * payload.base_price * 0.52 * (
        payload.campaign_duration_days / 7
    )
    estimated_incremental_revenue = predicted_revenue - baseline_revenue
    margin_value = max(payload.base_price * (payload.gross_margin_percent / 100), 1)
    break_even_orders = int(round(payload.campaign_cost / margin_value))

    return PredictionResponse(
        predicted_orders=predicted_orders,
        predicted_revenue=round(predicted_revenue, 2),
        predicted_profit=round(predicted_profit, 2),
        predicted_roi=round(predicted_roi, 3),
        calculated_roi=round(calculated_roi, 3),
        success_probability=round(success_probability, 3),
        recommendation=recommendation,
        reason=reason,
        risk_level=risk_level,
        estimated_incremental_revenue=round(estimated_incremental_revenue, 2),
        break_even_orders=break_even_orders,
    )
