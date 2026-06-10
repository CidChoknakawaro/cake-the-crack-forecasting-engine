import React from "react";
import { BadgeCheck, ChartNoAxesCombined, CircleDollarSign, PackageCheck, TrendingUp } from "lucide-react";

const formatter = new Intl.NumberFormat("en-US");
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

function RecommendationBadge({ value }) {
  const className =
    value === "Launch" ? "rec launch" : value === "Revise" ? "rec revise" : "rec reject";
  return <span className={className}>{value}</span>;
}

export default function ForecastCards({ result }) {
  if (!result) {
    return (
      <section className="panel xl:col-span-7">
        <div className="empty-state">
          <ChartNoAxesCombined size={42} />
          <h2>Ready to forecast</h2>
          <p>
            Select a campaign mix and run the forecast to estimate revenue, ROI, success
            probability, and the recommended decision.
          </p>
        </div>
      </section>
    );
  }

  const cards = [
    ["Predicted Orders", formatter.format(result.predicted_orders), <PackageCheck size={22} />],
    ["Predicted Revenue", money.format(result.predicted_revenue), <CircleDollarSign size={22} />],
    ["Predicted Profit", money.format(result.predicted_profit), <TrendingUp size={22} />],
    ["Predicted ROI", `${result.predicted_roi.toFixed(2)}x`, <ChartNoAxesCombined size={22} />],
    ["Success Probability", `${Math.round(result.success_probability * 100)}%`, <BadgeCheck size={22} />]
  ];

  return (
    <section className="panel xl:col-span-7">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Forecast Result Cards</p>
          <h2>Decision summary</h2>
        </div>
        <RecommendationBadge value={result.recommendation} />
      </div>
      <div className="kpi-grid">
        {cards.map(([label, value, icon]) => (
          <article className="kpi-card" key={label}>
            <div className="kpi-icon">{icon}</div>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <article className={`recommendation-card ${result.recommendation.toLowerCase()}`}>
        <div>
          <span>Recommendation</span>
          <h3>{result.recommendation}</h3>
        </div>
        <p>{result.reason}</p>
        <div className="recommendation-meta">
          <span>Risk: {result.risk_level}</span>
          <span>Break-even: {formatter.format(result.break_even_orders)} orders</span>
          <span>Incremental revenue: {money.format(result.estimated_incremental_revenue)}</span>
        </div>
      </article>
    </section>
  );
}
