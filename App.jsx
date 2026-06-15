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

  // ✅ Add/remove criteria
  const addCriteria = () => {
    const newName = prompt("Enter new criteria name");
    if (!newName) return;

    setCriteria([...criteria, newName]);
    setWeights({ ...weights, [newName]: 20 });

    setOpps(opps.map((o) => ({ ...o, [newName]: 3 })));
  };

  const removeCriteria = (name) => {
    setCriteria(criteria.filter((c) => c !== name));

    const newWeights = { ...weights };
    delete newWeights[name];
    setWeights(newWeights);

    setOpps(
      opps.map((o) => {
        const copy = { ...o };
        delete copy[name];
        return copy;
      })
    );
  };

  // ✅ Metrics input
  const addMetric = () =>
    setMetrics([...metrics, { name: "", value: "" }]);

  const updateMetric = (i, field, value) => {
    const updated = [...metrics];
    updated[i][field] = value;
    setMetrics(updated);
  };

  // ✅ Convert metrics → scores via AI
  const convertToOpportunity = async () => {
    if (!name) return;

    try {
      setLoading(true);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mapping",
          metrics,
          criteria,
        }),
      });

      const data = await res.json();

      let cleaned = data.text?.trim() || "";
      cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

      const scores = JSON.parse(cleaned);

      const newOpp = { name };

      criteria.forEach((c) => {
        newOpp[c] = scores[c] || 3;
      });

      setOpps([...opps, newOpp]);
      setTab("model");
      setMetrics([{ name: "", value: "" }]);
      setName("");

    } catch (e) {
      console.error(e);
      alert("AI parsing failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Scoring
  const totalWeight =
    Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const scored = opps.map((opp) => {
    const total = criteria.reduce(
      (sum, c) => sum + (opp[c] * weights[c]) / totalWeight,
      0
    );
    return { ...opp, total: Number((total * criteria.length).toFixed(2)) };
  });

  const ranked = [...scored].sort((a, b) => b.total - a.total);

  // ✅ AI Insights
  const generateInsights = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "insights",
          criteria,
          weights,
          opportunities: ranked,
        }),
      });

      const data = await res.json();
      setInsights(data.text);

    } catch (e) {
      console.error(e);
      alert("Failed to generate insights");
    } finally {
      setLoading(false);
    }
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
    <div style={{ padding: 40, background: "#f6f8fb" }}>
      <h1>Opportunity Prioritization Model</h1>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("input")}>Data Input</button>
        <button onClick={() => setTab("model")}>Model</button>
      </div>

      {/* ================= INPUT TAB ================= */}
      {tab === "input" && (
        <div style={{ background: "white", padding: 20 }}>
          <h2>Enter Products</h2>

          <input
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {metrics.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="Metric"
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

          <div style={{ marginTop: 10 }}>
            <button onClick={convertToOpportunity}>
              Convert to Opportunity
            </button>
          </div>

          {loading && <p>AI processing metrics...</p>}
        </div>
      )}

      {/* ================= MODEL TAB ================= */}
      {tab === "model" && (
        <>
          {/* Criteria controls */}
          <div style={{ marginBottom: 10 }}>
            {criteria.map((c) => (
              <span key={c} style={{ marginRight: 8 }}>
                {c}
                <button onClick={() => removeCriteria(c)}>✕</button>
              </span>
            ))}
            <button onClick={addCriteria}>+ Add</button>
          </div>

          {/* Opportunities */}
          <div style={{ background: "white", padding: 20 }}>
            {opps.map((opp, i) => (
              <div key={i}>
                <strong>{opp.name}</strong>
                <div style={{ display: "flex", gap: 10 }}>
                  {criteria.map((c) => (
                    <div
                      key={c}
                      style={{
                        background: getColor(opp[c]),
                        color: "white",
                        padding: 5,
                        borderRadius: 6,
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
          <div style={{ marginTop: 20 }}>
            <h2>Ranked</h2>

            {ranked.map((opp, i) => (
              <div key={i}>
                {opp.name} - {opp.total}
              </div>
            ))}
          </div>

          {/* AI */}
          <button onClick={generateInsights}>
            Generate AI Insights
          </button>

          <div style={{ marginTop: 20 }}>
            {loading && <p>Generating insights...</p>}

            {insights && (
              <div style={{ background: "white", padding: 16 }}>
                {insights}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
