import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const fallback = [
  { feature: "Website visits", importance: 0.96 },
  { feature: "Personalization available", importance: 0.82 },
  { feature: "Branch type", importance: 0.76 },
  { feature: "Season", importance: 0.71 },
  { feature: "Promotion type", importance: 0.65 },
  { feature: "Social media spend", importance: 0.58 },
  { feature: "Campaign cost", importance: 0.46 },
  { feature: "Discount percent", importance: 0.40 }
];

function normalizeLabel(label) {
  return label
    .replaceAll("_", " ")
    .replace("branch type", "Branch type")
    .replace("website visits", "Website visits")
    .replace("social media spend", "Social media spend");
}

export default function ModelInsights({ modelInfo }) {
  const source = modelInfo?.feature_importance?.length
    ? modelInfo.feature_importance.slice(0, 8).map((item) => ({
        feature: normalizeLabel(item.feature),
        importance: Math.round(item.importance * 100)
      }))
    : fallback.map((item) => ({ ...item, importance: Math.round(item.importance * 100) }));

  return (
    <section className="grid gap-5 xl:grid-cols-5">
      <div className="panel xl:col-span-3">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Feature Importance / Model Insight</p>
            <h2>Top demand drivers</h2>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={source} margin={{ left: 28 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0dfe2" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="feature" width={145} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}%`, "Relative importance"]} />
              <Bar dataKey="importance" fill="#5d8cc0" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel xl:col-span-2">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Admin / About Model</p>
            <h2>Training summary</h2>
          </div>
        </div>
        <dl className="model-list">
          <div>
            <dt>Model type used</dt>
            <dd>{modelInfo?.model_type || "Random forest and gradient boosting regressors"}</dd>
          </div>
          <div>
            <dt>Training data size</dt>
            <dd>{modelInfo?.training_data_size?.toLocaleString?.() || "2,500"} campaigns</dd>
          </div>
          <div>
            <dt>Revenue test R2</dt>
            <dd>{modelInfo?.revenue_r2 ?? "Pending"}</dd>
          </div>
          <div>
            <dt>ROI test R2</dt>
            <dd>{modelInfo?.roi_r2 ?? "Pending"}</dd>
          </div>
          <div>
            <dt>Last trained</dt>
            <dd>{modelInfo?.last_trained_date || "After running train_model.py"}</dd>
          </div>
        </dl>
        <p className="disclaimer">
          This is an MVP using simulated data for business case demonstration.
        </p>
      </div>
    </section>
  );
}
