import React, { useState } from "react";

const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];

const defaultOpp = (criteria) => {
  const base = { name: "" };
  criteria.forEach((c) => (base[c] = 3));
  return base;
};

export default function App() {
  const [tab, setTab] = useState("input");
  const [criteria, setCriteria] = useState(defaultCriteria);

  const [weights, setWeights] = useState(
    Object.fromEntries(defaultCriteria.map((c) => [c, 20]))
  );

  const [opps, setOpps] = useState([]);

  const [metrics, setMetrics] = useState([{ name: "", value: "" }]);
  const [name, setName] = useState("");

  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Add metric row
  const addMetric = () => {
    setMetrics([...metrics, { name: "", value: "" }]);
  };

  // ✅ Update metric
  const updateMetric = (i, field, value) => {
    const updated = [...metrics];
    updated[i][field] = value;
    setMetrics(updated);
  };

  // ✅ AI mapping METRICS → SCORES
  const convertToOpportunity = async () => {
    if (!name) return;

    setLoading(true);

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "mapping",
        metrics,
        criteria,
      }),
    });

    const data = await response.json();
    setLoading(false);

    try {
      const scores = JSON.parse(data.text);

      const newOpp = { name };

      criteria.forEach((c) => {
        newOpp[c] = scores[c] || 3;
      });

      setOpps([...opps, newOpp]);
      setTab("model");

      setMetrics([{ name: "", value: "" }]);
      setName("");
    } catch (e) {
      alert("AI parsing failed. Try again.");
    }
  };

  // ✅ scoring logic
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const scored = opps.map((opp) => {
    const total = criteria.reduce(
      (sum, c) => sum + (opp[c] * weights[c]) / totalWeight,
      0
    );
    return { ...opp, total: Number((total * criteria.length).toFixed(2)) };
  });

  const ranked = [...scored].sort((a, b) => b.total - a.total);

  // ✅ AI insights
  const generateInsights = async () => {
    setLoading(true);

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "insights",
        criteria,
        weights,
        opportunities: ranked,
      }),
    });

    const data = await res.json();
    setInsights(data.text);
    setLoading(false);
  };

  const getColor = (v) =>
    v >= 5
      ? "#16a34a"
      : v >= 4
      ? "#4ade80"
      : v >= 3
      ? "#facc15"
      : v >= 2
      ? "#fb923c"
      : "#ef4444";

  return (
    <div style={{ padding: 40, background: "#f6f8fb", minHeight: "100vh" }}>
      <h1>Opportunity Prioritization Model</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab("input")}>Data Input</button>
        <button onClick={() => setTab("model")}>Model</button>
      </div>

      {/* INPUT TAB */}
      {tab === "input" && (
        <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
          <h2>Enter Metrics</h2>

          <input
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", marginBottom: 10 }}
          />

          {metrics.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <input
                placeholder="Metric Name"
                value={m.name}
                onChange={(e) => updateMetric(i, "name", e.target.value)}
              />
              <input
                placeholder="Value"
                value={m.value}
                onChange={(e) => updateMetric(i, "value", e.target.value)}
              />
            </div>
          ))}

          <button onClick={addMetric}>+ Add Metric</button>

          <div style={{ marginTop: 20 }}>
            <button onClick={convertToOpportunity}>
              Convert to Opportunity
            </button>
          </div>

          {loading && <p>AI processing metrics...</p>}
        </div>
      )}

      {/* MODEL TAB */}
{tab === "model" && (
  <>
    {/* Table (restored full view) */}
    <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
      {opps.map((opp, i) => (
        <div key={i} style={{ marginBottom: 15 }}>
          <strong>{opp.name}</strong>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {criteria.map((c) => (
              <div
                key={c}
                style={{
                  background: getColor(opp[c]),
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "13px",
                }}
              >
                {c}: {opp[c]}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Ranking */}
    <div style={{ marginTop: 25 }}>
      <h2>Ranked Opportunities</h2>

      {ranked.map((opp, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: 12,
            background: "white",
            marginBottom: 8,
            borderRadius: 8,
            borderLeft: `6px solid ${getColor(Math.round(opp.total))}`,
          }}
        >
          <span>{opp.name}</span>
          <strong>{opp.total}</strong>
        </div>
      ))}
    </div>

    {/* AI INSIGHTS BUTTON */}
    <div style={{ marginTop: 20 }}>
      <button
        onClick={generateInsights}
        style={{
          background: "#2563eb",
          color: "white",
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
        }}
      >
        Generate AI Insights
      </button>
    </div>

    {/* AI OUTPUT */}
      <div style={{ marginTop: 20 }}>
        {loading && <p>Generating insights...</p>}

        {insights && (
          <div
            style={{
              background: "white",
              padding: 16,
              borderRadius: 10,
              lineHeight: 1.6,
              border: "1px solid #e5e7eb",
            }}
          >
            {insights}
          </div>
        )}
      </div>
    </>
  )}
</div>
);
}
