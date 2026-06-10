from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "promotions_mock.csv"
MODELS_DIR = ROOT / "models"

CATEGORICAL_FEATURES = [
    "branch_type",
    "region",
    "season",
    "occasion",
    "cake_type",
    "promotion_type",
    "day_of_week",
]
NUMERIC_FEATURES = [
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
FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
        ]
    )


def pipeline(model) -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", make_preprocessor()),
            ("model", model),
        ]
    )


def top_feature_importance(model: Pipeline, limit: int = 12) -> list[dict[str, float | str]]:
    preprocessor = model.named_steps["preprocessor"]
    feature_names = preprocessor.get_feature_names_out()
    estimator = model.named_steps["model"]
    importances = getattr(estimator, "feature_importances_", None)
    if importances is None:
        return []
    ranked = sorted(zip(feature_names, importances), key=lambda item: item[1], reverse=True)
    total = sum(value for _, value in ranked[:limit]) or 1
    return [
        {
            "feature": name.replace("categorical__", "").replace("numeric__", ""),
            "importance": round(float(value / total), 4),
        }
        for name, value in ranked[:limit]
    ]


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Missing {DATA_PATH}. Run `python scripts/generate_mock_data.py` first."
        )

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATA_PATH)
    x = df[FEATURES]

    (
        x_train,
        x_test,
        revenue_train,
        revenue_test,
        roi_train,
        roi_test,
        success_train,
        success_test,
    ) = train_test_split(
        x,
        df["actual_revenue"],
        df["actual_roi"],
        df["success_label"],
        test_size=0.22,
        random_state=42,
        stratify=df["success_label"],
    )

    revenue_model = pipeline(
        RandomForestRegressor(n_estimators=260, min_samples_leaf=3, random_state=42, n_jobs=1)
    )
    roi_model = pipeline(
        GradientBoostingRegressor(n_estimators=240, learning_rate=0.045, max_depth=3, random_state=42)
    )
    success_model = pipeline(
        RandomForestClassifier(n_estimators=260, min_samples_leaf=4, random_state=42, n_jobs=1)
    )

    revenue_model.fit(x_train, revenue_train)
    roi_model.fit(x_train, roi_train)
    success_model.fit(x_train, success_train)

    revenue_pred = revenue_model.predict(x_test)
    roi_pred = roi_model.predict(x_test)
    success_pred = success_model.predict(x_test)

    metrics = {
        "training_data_size": int(len(df)),
        "last_trained_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "model_type": "RandomForestRegressor revenue, GradientBoostingRegressor ROI, RandomForestClassifier success",
        "revenue_mae": round(float(mean_absolute_error(revenue_test, revenue_pred)), 2),
        "revenue_r2": round(float(r2_score(revenue_test, revenue_pred)), 4),
        "roi_mae": round(float(mean_absolute_error(roi_test, roi_pred)), 3),
        "roi_r2": round(float(r2_score(roi_test, roi_pred)), 4),
        "success_accuracy": round(float(accuracy_score(success_test, success_pred)), 4),
        "feature_importance": top_feature_importance(revenue_model),
    }

    joblib.dump(revenue_model, MODELS_DIR / "revenue_model.pkl")
    joblib.dump(roi_model, MODELS_DIR / "roi_model.pkl")
    joblib.dump(success_model, MODELS_DIR / "success_model.pkl")
    (MODELS_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print("Saved models to models/")
    print(f"Revenue MAE: {metrics['revenue_mae']:,.2f}")
    print(f"Revenue R2: {metrics['revenue_r2']}")
    print(f"ROI MAE: {metrics['roi_mae']}")
    print(f"ROI R2: {metrics['roi_r2']}")
    print(f"Success classifier accuracy: {metrics['success_accuracy']}")


if __name__ == "__main__":
    main()
