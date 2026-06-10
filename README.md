# Cake The Crack - Forecasting Engine MVP

A full-stack MVP web app that simulates how S&P marketing and branch teams can forecast whether a cake promotion is likely to work before launch.

The demo uses generated mock historical promotion data, trains scikit-learn models, exposes a FastAPI prediction API, and renders a polished React dashboard for promotion planning, KPI forecasting, scenario comparison, and model insight.

## What It Does

Users enter a planned cake promotion, including branch type, region, season, occasion, cake type, promotion type, discount, social support, personalization, campaign cost, traffic, website visits, capacity, price, and margin.

The forecasting engine returns:

- Predicted orders
- Predicted revenue
- Predicted profit
- Predicted ROI
- Success probability
- Launch / Revise / Reject recommendation
- Risk level
- Estimated incremental revenue
- Break-even orders

This is designed as an internal-facing S&P marketing strategy tool for a business case competition demo.

## Project Structure

```text
Cake Forecast/
  README.md
  data/
    promotions_mock.csv
  models/
    revenue_model.pkl
    roi_model.pkl
    success_model.pkl
    metrics.json
  scripts/
    generate_mock_data.py
    train_model.py
  backend/
    main.py
    requirements.txt
  frontend/
    package.json
    src/
      App.jsx
      components/
      styles/
```

## Setup

From the project root:

```powershell
cd "C:\Users\Z2\Downloads\Cake Forecast"
pip install -r backend\requirements.txt
```

Install the frontend packages:

```powershell
cd frontend
npm install
```

## Generate Mock Data

From the project root:

```powershell
python scripts\generate_mock_data.py --rows 2500
```

This creates `data/promotions_mock.csv` with realistic simulated campaign records.

The mock logic reflects business rules such as:

- Mall and CBD branches tend to outperform Transit branches.
- University Area branches respond better to Gen Z-oriented campaigns.
- Social Challenge and Creator Collaboration campaigns perform better with higher social spend.
- Personalization and bundles lift conversion and average order value.
- Valentine, Graduation, Mother's Day, New Year, and Christmas increase demand.
- Discounts increase orders but reduce gross margin.
- Website visits strongly influence order volume.
- Campaign cost includes social spend, influencer support, duration, and bundle support.

## Train Models

From the project root:

```powershell
python scripts\train_model.py
```

The training script fits:

- Revenue regression model
- ROI regression model
- Success classification model

It prints metrics and saves:

- `models/revenue_model.pkl`
- `models/roi_model.pkl`
- `models/success_model.pkl`
- `models/metrics.json`

Current verified metrics from the included generated data:

- Revenue MAE: 43,410.05
- Revenue R2: 0.8776
- ROI MAE: 0.372
- ROI R2: 0.7645
- Success classifier accuracy: 0.8091

## Run Backend

From the project root:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Useful endpoints:

- `GET http://127.0.0.1:8000/`
- `GET http://127.0.0.1:8000/options`
- `GET http://127.0.0.1:8000/model-info`
- `POST http://127.0.0.1:8000/predict`

## Run Frontend

In a second terminal:

```powershell
cd "C:\Users\Z2\Downloads\Cake Forecast\frontend"
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Build check:

```powershell
npm run build
```

## Example Input

```json
{
  "branch_type": "Mall",
  "region": "Bangkok",
  "season": "Valentine",
  "occasion": "Couple Gift",
  "cake_type": "Strawberry",
  "promotion_type": "Personalized Box",
  "discount_percent": 10,
  "social_media_spend": 50000,
  "influencer_support": 1,
  "customization_available": 1,
  "personalized_bundle": 1,
  "day_of_week": "Weekend",
  "campaign_duration_days": 7,
  "estimated_foot_traffic": 12000,
  "website_visits": 8000,
  "branch_capacity": 600,
  "base_price": 950,
  "gross_margin_percent": 55,
  "campaign_cost": 90000
}
```

## Recommendation Logic

The backend combines model-predicted ROI, calculated ROI, and success confidence.

- Launch: predicted ROI >= 1.5 and success probability >= 0.65
- Revise: ROI between 1.0 and 1.5 or success probability between 0.45 and 0.65
- Reject: predicted ROI < 1.0 or success probability < 0.45

Risk level is based on ROI:

- Low: predicted ROI >= 1.5
- Medium: 1.0 <= predicted ROI < 1.5
- High: predicted ROI < 1.0

## Business Context

The S&P cake marketing strategy has three connected parts:

1. Short-form social media content creates Gen Z discovery.
2. A personalized cake website converts interest into cake orders.
3. The forecasting dashboard helps decide which promotions to run by branch, season, occasion, customer segment, and campaign design.

The point of the MVP is to show how S&P could avoid one-size-fits-all promotions and forecast campaign fit before spending budget.

## Disclaimer

This MVP uses simulated data only. It does not use real S&P confidential data, paid APIs, or external databases. The model outputs are intended for business case demonstration, not production decision-making.
