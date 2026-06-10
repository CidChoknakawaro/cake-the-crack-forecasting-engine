from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "promotions_mock.csv"

BRANCH_TYPES = [
    "Mall",
    "CBD / Office",
    "Neighborhood",
    "Transit",
    "Hospital",
    "University Area",
]
REGIONS = ["Bangkok", "Central", "North", "Northeast", "South"]
SEASONS = [
    "Normal",
    "Valentine",
    "Graduation",
    "Songkran",
    "Mother's Day",
    "New Year",
    "Christmas",
    "Back to School",
]
OCCASIONS = [
    "Birthday",
    "Couple Gift",
    "Friend Group",
    "Family Celebration",
    "Office Celebration",
    "Self Reward",
    "Seasonal Gift",
]
CAKE_TYPES = [
    "Chocolate",
    "Vanilla",
    "Strawberry",
    "Red Velvet",
    "Cheesecake",
    "Matcha",
    "Fruit Cake",
]
PROMOTION_TYPES = [
    "Discount",
    "Bundle",
    "Limited Edition",
    "Free Add-on",
    "Personalized Box",
    "Social Challenge",
    "Creator Collaboration",
]
DAY_TYPES = ["Weekday", "Weekend"]


def weighted_choice(rng: np.random.Generator, values: list[str], weights: list[float]) -> str:
    return rng.choice(values, p=np.array(weights) / np.sum(weights)).item()


def build_row(rng: np.random.Generator, campaign_id: int) -> dict[str, object]:
    branch_type = weighted_choice(
        rng, BRANCH_TYPES, [0.25, 0.18, 0.20, 0.12, 0.10, 0.15]
    )
    region = weighted_choice(rng, REGIONS, [0.46, 0.18, 0.12, 0.12, 0.12])
    season = weighted_choice(
        rng, SEASONS, [0.34, 0.10, 0.10, 0.08, 0.09, 0.11, 0.10, 0.08]
    )
    occasion = rng.choice(OCCASIONS).item()
    cake_type = rng.choice(CAKE_TYPES).item()
    promotion_type = rng.choice(PROMOTION_TYPES).item()
    day_of_week = weighted_choice(rng, DAY_TYPES, [0.62, 0.38])

    branch_multiplier = {
        "Mall": 1.25,
        "CBD / Office": 1.18,
        "Neighborhood": 0.98,
        "Transit": 0.82,
        "Hospital": 0.88,
        "University Area": 1.05,
    }[branch_type]
    region_multiplier = {
        "Bangkok": 1.18,
        "Central": 1.02,
        "North": 0.92,
        "Northeast": 0.88,
        "South": 0.94,
    }[region]
    season_multiplier = {
        "Normal": 1.0,
        "Valentine": 1.55,
        "Graduation": 1.38,
        "Songkran": 1.15,
        "Mother's Day": 1.50,
        "New Year": 1.42,
        "Christmas": 1.34,
        "Back to School": 1.16,
    }[season]
    promo_multiplier = {
        "Discount": 1.10,
        "Bundle": 1.18,
        "Limited Edition": 1.22,
        "Free Add-on": 1.08,
        "Personalized Box": 1.25,
        "Social Challenge": 1.10,
        "Creator Collaboration": 1.16,
    }[promotion_type]

    gen_z_fit = (
        branch_type == "University Area"
        or occasion in {"Friend Group", "Self Reward"}
        or season in {"Graduation", "Back to School"}
    )
    social_first = promotion_type in {"Social Challenge", "Creator Collaboration"}

    discount_percent = int(rng.choice([0, 5, 10, 15, 20, 25, 30], p=[0.09, 0.12, 0.22, 0.22, 0.18, 0.11, 0.06]))
    influencer_support = int(rng.random() < (0.52 if social_first else 0.24))
    customization_available = int(rng.random() < (0.70 if promotion_type == "Personalized Box" else 0.38))
    personalized_bundle = int(rng.random() < (0.58 if promotion_type in {"Bundle", "Personalized Box"} else 0.25))
    campaign_duration_days = int(rng.integers(3, 15))

    branch_capacity = {
        "Mall": rng.integers(420, 780),
        "CBD / Office": rng.integers(360, 680),
        "Neighborhood": rng.integers(240, 520),
        "Transit": rng.integers(180, 420),
        "Hospital": rng.integers(160, 380),
        "University Area": rng.integers(260, 580),
    }[branch_type].item()

    foot_traffic = int(
        rng.normal(
            {
                "Mall": 11500,
                "CBD / Office": 9000,
                "Neighborhood": 5200,
                "Transit": 7600,
                "Hospital": 4300,
                "University Area": 7000,
            }[branch_type]
            * region_multiplier,
            1300,
        )
    )
    estimated_foot_traffic = max(1200, foot_traffic)

    social_media_spend = int(
        max(
            5000,
            rng.normal(42000 if social_first else 24000, 16000)
            + influencer_support * rng.normal(18000, 5000),
        )
    )
    base_web = social_media_spend * rng.uniform(0.09, 0.16)
    website_visits = int(
        max(
            900,
            base_web
            * (1.45 if social_first else 1.0)
            * (1.28 if influencer_support else 1.0)
            * (1.22 if gen_z_fit else 1.0)
            + rng.normal(900, 450),
        )
    )

    base_price = int(
        rng.normal(
            {
                "Chocolate": 820,
                "Vanilla": 760,
                "Strawberry": 890,
                "Red Velvet": 980,
                "Cheesecake": 940,
                "Matcha": 880,
                "Fruit Cake": 920,
            }[cake_type],
            70,
        )
    )
    base_price = int(np.clip(base_price, 590, 1250))

    gross_margin_percent = float(
        np.clip(
            rng.normal(55, 4.5)
            - discount_percent * 0.35
            + customization_available * 2.2
            + personalized_bundle * 1.4,
            34,
            66,
        )
    )

    web_conversion = 0.022
    web_conversion += customization_available * 0.006
    web_conversion += personalized_bundle * 0.005
    web_conversion += (discount_percent / 100) * 0.035
    web_conversion += (0.007 if social_first and social_media_spend > 50000 else 0)
    web_conversion += (0.005 if gen_z_fit and social_first else 0)

    walk_in_orders = (
        estimated_foot_traffic
        * 0.010
        * branch_multiplier
        * season_multiplier
        * (1.10 if day_of_week == "Weekend" else 1.0)
    )
    digital_orders = website_visits * web_conversion * promo_multiplier * season_multiplier
    duration_multiplier = np.sqrt(campaign_duration_days / 7)

    raw_orders = (walk_in_orders + digital_orders) * duration_multiplier
    capacity_limit = branch_capacity * (campaign_duration_days / 7) * rng.uniform(0.82, 1.04)
    actual_orders = int(np.clip(rng.normal(raw_orders, max(8, raw_orders * 0.10)), 12, capacity_limit))

    average_order_value = base_price * (1 - discount_percent / 100)
    average_order_value *= 1 + customization_available * 0.09 + personalized_bundle * 0.12
    average_order_value *= 1 + (0.04 if promotion_type == "Limited Edition" else 0)
    actual_revenue = round(actual_orders * average_order_value, 2)

    campaign_cost = round(
        social_media_spend
        + influencer_support * rng.uniform(18000, 43000)
        + campaign_duration_days * rng.uniform(1800, 4200)
        + personalized_bundle * rng.uniform(6000, 16000),
        2,
    )
    actual_profit = round(actual_revenue * (gross_margin_percent / 100) - campaign_cost, 2)
    actual_roi = round(actual_profit / campaign_cost if campaign_cost else 0, 3)

    baseline_revenue = (
        branch_capacity
        * base_price
        * 0.52
        * (campaign_duration_days / 7)
        * branch_multiplier
    )
    success_label = int(actual_roi >= 1.2 and actual_revenue >= baseline_revenue)

    return {
        "campaign_id": f"CMP-{campaign_id:05d}",
        "branch_type": branch_type,
        "region": region,
        "season": season,
        "occasion": occasion,
        "cake_type": cake_type,
        "promotion_type": promotion_type,
        "discount_percent": discount_percent,
        "social_media_spend": social_media_spend,
        "influencer_support": influencer_support,
        "customization_available": customization_available,
        "personalized_bundle": personalized_bundle,
        "day_of_week": day_of_week,
        "campaign_duration_days": campaign_duration_days,
        "estimated_foot_traffic": estimated_foot_traffic,
        "website_visits": website_visits,
        "branch_capacity": branch_capacity,
        "base_price": base_price,
        "actual_orders": actual_orders,
        "actual_revenue": actual_revenue,
        "gross_margin_percent": round(gross_margin_percent, 2),
        "campaign_cost": campaign_cost,
        "actual_profit": actual_profit,
        "actual_roi": actual_roi,
        "success_label": success_label,
    }


def generate(rows: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    return pd.DataFrame(build_row(rng, index + 1) for index in range(rows))


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate mock S&P cake promotion data.")
    parser.add_argument("--rows", type=int, default=2500, help="Number of campaigns to generate.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for repeatable data.")
    parser.add_argument("--output", type=Path, default=DATA_PATH, help="CSV output path.")
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    df = generate(args.rows, args.seed)
    df.to_csv(args.output, index=False)
    print(f"Generated {len(df):,} rows at {args.output}")
    print(df[["actual_orders", "actual_revenue", "actual_roi", "success_label"]].describe())


if __name__ == "__main__":
    main()
