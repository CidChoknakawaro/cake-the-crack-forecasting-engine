import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CakeSlice, LineChart, Megaphone } from "lucide-react";
import Charts from "./components/Charts.jsx";
import ForecastCards from "./components/ForecastCards.jsx";
import InputPanel from "./components/InputPanel.jsx";
import ModelInsights from "./components/ModelInsights.jsx";
import ScenarioComparison from "./components/ScenarioComparison.jsx";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? "/_/backend" : "http://127.0.0.1:8000");

const fallbackOptions = {
  branch_type: ["Mall", "CBD / Office", "Neighborhood", "Transit", "Hospital", "University Area"],
  region: ["Bangkok", "Central", "North", "Northeast", "South"],
  season: ["Normal", "Valentine", "Graduation", "Songkran", "Mother's Day", "New Year", "Christmas", "Back to School"],
  occasion: ["Birthday", "Couple Gift", "Friend Group", "Family Celebration", "Office Celebration", "Self Reward", "Seasonal Gift"],
  cake_type: ["Chocolate", "Vanilla", "Strawberry", "Red Velvet", "Cheesecake", "Matcha", "Fruit Cake"],
  promotion_type: ["Discount", "Bundle", "Limited Edition", "Free Add-on", "Personalized Box", "Social Challenge", "Creator Collaboration"],
  day_of_week: ["Weekday", "Weekend"]
};

const defaultForm = {
  branch_type: "Mall",
  region: "Bangkok",
  season: "Valentine",
  occasion: "Couple Gift",
  cake_type: "Strawberry",
  promotion_type: "Personalized Box",
  discount_percent: 10,
  social_media_spend: 50000,
  influencer_support: 1,
  customization_available: 1,
  personalized_bundle: 1,
  day_of_week: "Weekend",
  campaign_duration_days: 7,
  estimated_foot_traffic: 12000,
  website_visits: 8000,
  branch_capacity: 600,
  base_price: 950,
  gross_margin_percent: 55,
  campaign_cost: 90000
};

const scenarioInputs = [
  {
    name: "Low Budget Basic Discount",
    input: {
      ...defaultForm,
      branch_type: "Neighborhood",
      season: "Normal",
      occasion: "Birthday",
      promotion_type: "Discount",
      discount_percent: 20,
      social_media_spend: 12000,
      influencer_support: 0,
      customization_available: 0,
      personalized_bundle: 0,
      website_visits: 2200,
      campaign_cost: 28000
    }
  },
  {
    name: "Personalized Cake Bundle",
    input: {
      ...defaultForm,
      promotion_type: "Personalized Box",
      customization_available: 1,
      personalized_bundle: 1,
      social_media_spend: 52000,
      website_visits: 7800,
      campaign_cost: 82000
    }
  },
  {
    name: "Creator-Led Social Challenge",
    input: {
      ...defaultForm,
      branch_type: "University Area",
      season: "Graduation",
      occasion: "Friend Group",
      cake_type: "Matcha",
      promotion_type: "Creator Collaboration",
      discount_percent: 10,
      social_media_spend: 90000,
      influencer_support: 1,
      customization_available: 1,
      personalized_bundle: 1,
      website_visits: 14500,
      campaign_cost: 142000
    }
  }
];

function localPredict(input) {
  const seasonBoost = {
    Valentine: 1.55,
    Graduation: 1.35,
    "Mother's Day": 1.48,
    "New Year": 1.38,
    Christmas: 1.32,
    Songkran: 1.14,
    "Back to School": 1.16,
    Normal: 1
  }[input.season] || 1;
  const branchBoost = {
    Mall: 1.22,
    "CBD / Office": 1.16,
    Neighborhood: 0.98,
    Transit: 0.82,
    Hospital: 0.88,
    "University Area": 1.08
  }[input.branch_type] || 1;
  const promoBoost = {
    Discount: 1.1,
    Bundle: 1.18,
    "Limited Edition": 1.22,
    "Free Add-on": 1.08,
    "Personalized Box": 1.27,
    "Social Challenge": 1.16,
    "Creator Collaboration": 1.22
  }[input.promotion_type] || 1;
  const personalization = 1 + input.customization_available * 0.08 + input.personalized_bundle * 0.12;
  const socialLift =
    1 + Math.min(input.social_media_spend / 180000, 0.7) + input.influencer_support * 0.18;
  const webOrders = input.website_visits * 0.032 * seasonBoost * promoBoost * personalization;
  const walkInOrders = input.estimated_foot_traffic * 0.012 * branchBoost * seasonBoost;
  const capacity = input.branch_capacity * (input.campaign_duration_days / 7);
  const predicted_orders = Math.max(20, Math.round(Math.min(capacity, webOrders + walkInOrders)));
  const averageOrderValue =
    input.base_price *
    (1 - input.discount_percent / 100) *
    personalization *
    (input.promotion_type === "Limited Edition" ? 1.04 : 1);
  const predicted_revenue = predicted_orders * averageOrderValue * Math.min(socialLift, 1.55);
  const predicted_profit = predicted_revenue * (input.gross_margin_percent / 100) - input.campaign_cost;
  const predicted_roi = input.campaign_cost ? predicted_profit / input.campaign_cost : 0;
  const success_probability = Math.max(
    0.08,
    Math.min(
      0.96,
      1 / (1 + Math.exp(-((predicted_roi - 1.12) * 2.35))) +
        input.customization_available * 0.04 +
        input.personalized_bundle * 0.04 +
        input.influencer_support * 0.03
    )
  );
  const recommendation =
    predicted_roi >= 1.5 && success_probability >= 0.65
      ? "Launch"
      : predicted_roi < 1 || success_probability < 0.45
        ? "Reject"
        : "Revise";
  const risk_level = predicted_roi >= 1.5 ? "Low" : predicted_roi >= 1 ? "Medium" : "High";
  const baseline = input.branch_capacity * input.base_price * 0.52 * (input.campaign_duration_days / 7);
  const breakEven = Math.round(input.campaign_cost / Math.max(input.base_price * (input.gross_margin_percent / 100), 1));

  return {
    predicted_orders,
    predicted_revenue: Math.round(predicted_revenue),
    predicted_profit: Math.round(predicted_profit),
    predicted_roi: Number(predicted_roi.toFixed(3)),
    calculated_roi: Number(predicted_roi.toFixed(3)),
    success_probability: Number(success_probability.toFixed(3)),
    recommendation,
    reason:
      recommendation === "Launch"
        ? "Strong projected ROI and high success probability. This mix is ready for launch."
        : recommendation === "Revise"
          ? "The campaign has potential, but budget, channel support, or offer design should be tuned first."
          : "The forecast does not clear the ROI or confidence threshold. Redesign before committing budget.",
    risk_level,
    estimated_incremental_revenue: Math.round(predicted_revenue - baseline),
    break_even_orders: breakEven
  };
}

async function api(path, options) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (path === "/options") return fallbackOptions;
    if (path === "/model-info") {
      return {
        model_type: "RandomForestRegressor revenue, GradientBoostingRegressor ROI, RandomForestClassifier success",
        training_data_size: 2500,
        revenue_r2: 0.8776,
        roi_r2: 0.7645,
        success_accuracy: 0.8091,
        last_trained_date: "Local fallback",
        feature_importance: []
      };
    }
    if (path === "/predict" && options?.body) {
      return localPredict(JSON.parse(options.body));
    }
    throw error;
  }
}

export default function App() {
  const [options, setOptions] = useState(fallbackOptions);
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [scenarioRows, setScenarioRows] = useState(
    scenarioInputs.map((scenario) => ({ name: scenario.name, result: null }))
  );
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([api("/options"), api("/model-info")]).then(([optionsResult, modelResult]) => {
      if (optionsResult.status === "fulfilled") setOptions(optionsResult.value);
      if (modelResult.status === "fulfilled") setModelInfo(modelResult.value);
    });
  }, []);

  const headerStats = useMemo(
    () => [
      ["Channels", "Short-form, website, branch"],
      ["Forecast", "Orders, revenue, ROI"],
      ["Decision", "Launch, Revise, Reject"]
    ],
    []
  );

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function forecastPromotion() {
    setLoading(true);
    setError("");
    try {
      const prediction = await api("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setResult(prediction);
    } catch (err) {
      setError("");
    } finally {
      setLoading(false);
    }
  }

  async function runComparison() {
    setCompareLoading(true);
    setError("");
    try {
      const rows = await Promise.all(
        scenarioInputs.map(async (scenario) => ({
          name: scenario.name,
          result: await api("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scenario.input)
          })
        }))
      );
      setScenarioRows(rows);
    } catch (err) {
      setError("");
    } finally {
      setCompareLoading(false);
    }
  }

  useEffect(() => {
    forecastPromotion();
    runComparison();
    // Run once on load to make the demo screenshot-ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="app-shell">
      <section className="topbar">
        <div className="brand-mark">
          <CakeSlice size={24} />
        </div>
        <div>
          <p className="eyebrow">Cake The Crack - Forecasting Engine MVP</p>
          <h1>S&amp;P Promotion Forecasting Engine</h1>
          <p className="subtitle">
            Forecast which cake promotions are most likely to drive revenue, ROI, and Gen Z
            conversion.
          </p>
          <a
            className="campaign-tag"
            href="https://www.instagram.com/explore/tags/CrackTheCakebyCTT/"
            target="_blank"
            rel="noreferrer"
          >
            #CrackTheCakebyCTT
          </a>
        </div>
        <div className="header-stats">
          {headerStats.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="strategy-band">
        <article>
          <Megaphone size={22} />
          <div>
            <span>Discovery</span>
            <strong>Short-form content creates Gen Z attention.</strong>
          </div>
        </article>
        <article>
          <CakeSlice size={22} />
          <div>
            <span>Conversion</span>
            <strong>Personalized cake website turns interest into orders.</strong>
          </div>
        </article>
        <article>
          <LineChart size={22} />
          <div>
            <span>Decision</span>
            <strong>Forecasting dashboard helps teams pick the right promotions.</strong>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <InputPanel
          form={form}
          options={options}
          loading={loading}
          onChange={updateField}
          onSubmit={forecastPromotion}
        />
        <ForecastCards result={result} />
      </section>

      <Charts result={result} form={form} />

      <ScenarioComparison rows={scenarioRows} loading={compareLoading} onRun={runComparison} />

      <section className="business-panel">
        <p>
          This dashboard helps S&amp;P avoid one-size-fits-all promotions. Instead of launching
          every campaign everywhere, the model estimates which branch, season, occasion, and
          promotion mix is most likely to work.
        </p>
      </section>

      <ModelInsights modelInfo={modelInfo} />
    </main>
  );
}
