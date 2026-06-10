import React from "react";
import { Calculator, Sparkles } from "lucide-react";

const fieldLabels = {
  branch_type: "Branch Type",
  region: "Region",
  season: "Season",
  occasion: "Occasion",
  cake_type: "Cake Type",
  promotion_type: "Promotion Type",
  day_of_week: "Day of Week"
};

const numberFields = [
  ["discount_percent", "Discount %", 0, 60, 1],
  ["social_media_spend", "Social Media Spend", 0, 180000, 1000],
  ["campaign_duration_days", "Campaign Duration", 1, 30, 1],
  ["estimated_foot_traffic", "Estimated Foot Traffic", 500, 25000, 100],
  ["website_visits", "Website Visits", 500, 30000, 100],
  ["branch_capacity", "Branch Capacity", 80, 1200, 10],
  ["base_price", "Base Price", 350, 1800, 10],
  ["gross_margin_percent", "Gross Margin %", 20, 80, 1],
  ["campaign_cost", "Campaign Cost", 0, 250000, 1000]
];

function SelectField({ name, value, options, onChange }) {
  return (
    <label className="field">
      <span>{fieldLabels[name]}</span>
      <select value={value} onChange={(event) => onChange(name, event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ name, label, min, max, step, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(name, Number(event.target.value))}
      />
    </label>
  );
}

function Toggle({ name, label, value, onChange }) {
  return (
    <button
      type="button"
      className={`toggle ${value ? "toggle-on" : ""}`}
      onClick={() => onChange(name, value ? 0 : 1)}
      aria-pressed={Boolean(value)}
    >
      <span>{label}</span>
      <strong>{value ? "On" : "Off"}</strong>
    </button>
  );
}

export default function InputPanel({ form, options, loading, onChange, onSubmit }) {
  return (
    <section className="panel xl:col-span-5">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Promotion Plan Input</p>
          <h2>Configure the campaign before launch</h2>
        </div>
        <Sparkles className="heading-icon" size={22} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(options).map(([name, values]) => (
          <SelectField
            key={name}
            name={name}
            value={form[name]}
            options={values}
            onChange={onChange}
          />
        ))}
      </div>

      <div className="my-5 grid gap-3 md:grid-cols-3">
        <Toggle
          name="influencer_support"
          label="Influencer Support"
          value={form.influencer_support}
          onChange={onChange}
        />
        <Toggle
          name="customization_available"
          label="Customization"
          value={form.customization_available}
          onChange={onChange}
        />
        <Toggle
          name="personalized_bundle"
          label="Bundle"
          value={form.personalized_bundle}
          onChange={onChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {numberFields.map(([name, label, min, max, step]) => (
          <NumberField
            key={name}
            name={name}
            label={label}
            min={min}
            max={max}
            step={step}
            value={form[name]}
            onChange={onChange}
          />
        ))}
      </div>

      <button className="primary-action" type="button" onClick={onSubmit} disabled={loading}>
        <Calculator size={19} />
        {loading ? "Forecasting..." : "Forecast Promotion"}
      </button>
    </section>
  );
}
