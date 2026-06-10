import React from "react";
import { GitCompareArrows } from "lucide-react";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function ScenarioComparison({ rows, loading, onRun }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Scenario Comparison</p>
          <h2>Compare three go-to-market choices</h2>
        </div>
        <button className="secondary-action" type="button" onClick={onRun} disabled={loading}>
          <GitCompareArrows size={17} />
          {loading ? "Comparing..." : "Run Compare"}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Predicted Revenue</th>
              <th>Predicted ROI</th>
              <th>Success Probability</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.result ? money.format(row.result.predicted_revenue) : "-"}</td>
                <td>{row.result ? `${row.result.predicted_roi.toFixed(2)}x` : "-"}</td>
                <td>{row.result ? `${Math.round(row.result.success_probability * 100)}%` : "-"}</td>
                <td>
                  {row.result ? (
                    <span className={`rec small ${row.result.recommendation.toLowerCase()}`}>
                      {row.result.recommendation}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
