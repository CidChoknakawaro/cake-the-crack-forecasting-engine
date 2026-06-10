import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const moneyShort = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);

export default function Charts({ result, form }) {
  if (!result) return null;

  const bars = [
    { name: "Campaign Cost", value: form.campaign_cost, fill: "#5d8cc0" },
    { name: "Predicted Revenue", value: result.predicted_revenue, fill: "#9f1d2b" },
    { name: "Predicted Profit", value: Math.max(result.predicted_profit, 0), fill: "#2f9b67" }
  ];

  const dailyRevenue = Array.from({ length: form.campaign_duration_days }, (_, index) => {
    const day = index + 1;
    const ramp = 0.76 + (day / form.campaign_duration_days) * 0.46;
    return {
      day: `D${day}`,
      revenue: Math.round((result.predicted_revenue / form.campaign_duration_days) * ramp)
    };
  });

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Revenue and ROI Visualization</p>
            <h2>Cost, revenue, profit</h2>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0dfe2" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis tickFormatter={moneyShort} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`THB ${Number(value).toLocaleString()}`, "Value"]} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {bars.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Projected Daily Revenue</p>
            <h2>Campaign pacing</h2>
          </div>
        </div>
        <div className="probability-meter">
          <div>
            <span>Success probability</span>
            <strong>{Math.round(result.success_probability * 100)}%</strong>
          </div>
          <div className="meter-track">
            <div style={{ width: `${Math.round(result.success_probability * 100)}%` }} />
          </div>
        </div>
        <div className="chart-wrap compact">
          <ResponsiveContainer width="100%" height={205}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcebf7" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={moneyShort} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`THB ${Number(value).toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#9f1d2b" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
