import React, { useState } from "react";

const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];

const defaultOpp = (criteria) => {
  const base = { name: "" };
  criteria.forEach((c) => (base[c] = 3));
  return base;
};

export default function App() {
  const [criteria, setCriteria] = useState(defaultCriteria);

  const [weights, setWeights] = useState(
    Object.fromEntries(defaultCriteria.map((c) => [c, 20]))
  );

  const [opps, setOpps] = useState([
    { ...defaultOpp(defaultCriteria), name: "Hispanic Cheese @ Walmart" },
    { ...defaultOpp(defaultCriteria), name: "Value Gouda (<$5)" },
  ]);

  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  const updateValue = (index, field, value) => {
    const updated = [...opps];
    updated[index][field] = field === "name" ? value : Number(value);
    setOpps(updated);
  };

  const updateCriteria = (index, value) => {
    const newCriteria = [...criteria];
    const oldKey = newCriteria[index];
    newCriteria[index] = value;

    const updatedOpps = opps.map((opp) => {
      const newOpp = { ...opp };
      newOpp[value] = newOpp[oldKey] || 3;
      delete newOpp[oldKey];
      return newOpp;
    });

    const newWeights = { ...weights };
    newWeights[value] = newWeights[oldKey];
    delete newWeights[oldKey];

    setCriteria(newCriteria);
    setOpps(updatedOpps);
    setWeights(newWeights);
  };

  const updateWeight = (key, value) => {
    const clean = value.replace(/^0+(?=\d)/, "");
    setWeights({ ...weights, [key]: Number(clean || 0) });
  };

  const addCriteria = () => {
    const newKey = `Criteria ${criteria.length + 1}`;
    setCriteria([...criteria, newKey]);
    setWeights({ ...weights, [newKey]: 20 });

    const updatedOpps = opps.map((opp) => ({
      ...opp,
      [newKey]: 3,
    }));
    setOpps(updatedOpps);
  };

  const removeCriteria = () => {
    const last = criteria[criteria.length - 1];
    setCriteria(criteria.slice(0, -1));

    const newWeights = { ...weights };
    delete newWeights[last];
    setWeights(newWeights);

    const updatedOpps = opps.map((opp) => {
      const newOpp = { ...opp };
      delete newOpp[last];
      return newOpp;
    });

    setOpps(updatedOpps);
  };

  const addOpportunity = () => {
    setOpps([...opps, defaultOpp(criteria)]);
  };

  const removeOpportunity = (index) => {
    setOpps(opps.filter((_, i) => i !== index));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const scoredOpps = opps.map((opp) => {
    const total = criteria.reduce((sum, c) => {
      const w = (weights[c] || 0) / totalWeight;
      return sum + (opp[c] || 0) * w * criteria.length;
    }, 0);
    return { ...opp, total: Number(total.toFixed(2)) };
  });

  const ranked = [...scoredOpps].sort((a, b) => b.total - a.total);

  const generateInsights = async () => {
    setLoading(true);

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ criteria, weights, opportunities: ranked }),
    });

    const data = await response.json();
    setInsights(data.text);
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ["Opportunity", ...criteria, "Total"];
    const rows = ranked.map((opp) => [
      opp.name,
      ...criteria.map((c) => opp[c]),
      opp.total,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "opportunity_model.csv";
    link.click();
  };

  const getColor = (value) => {
    if (value >= 5) return "#16a34a";
    if (value >= 4) return "#4ade80";
    if (value >= 3) return "#facc15";
    if (value >= 2) return "#fb923c";
    return "#ef4444";
  };

  return (
    <div
      style={{
        padding: 40,
        fontFamily: "Inter, Arial",
        background: "#f6f8fb",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1f2937" }}>
        Opportunity Prioritization Model
      </h1>

      <div
        style={{
          marginTop: 20,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `2fr repeat(${criteria.length}, 1fr 0.8fr) auto`,
            background: "#f9fafb",
            padding: 12,
            fontWeight: "bold",
          }}
        >
          <div>Opportunity</div>

          {criteria.map((c, i) => (
            <React.Fragment key={i}>
              <input
                value={c}
                onChange={(e) => updateCriteria(i, e.target.value)}
                style={{ border: "1px solid #ddd", borderRadius: 6 }}
              />
              <div>
                <input
                  value={weights[c]}
                  onChange={(e) => updateWeight(c, e.target.value)}
                  style={{ width: 50 }}
                />
                %
              </div>
            </React.Fragment>
          ))}
          <div />
        </div>

        {/* Rows */}
        {opps.map((opp, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: `2fr repeat(${criteria.length}, 1fr 0.8fr) auto`,
              padding: 12,
              borderTop: "1px solid #eee",
            }}
          >
            <input
              value={opp.name}
              onChange={(e) => updateValue(i, "name", e.target.value)}
            />

            {criteria.map((c) => (
              <React.Fragment key={c}>
                <input
                  type="number"
                  value={opp[c]}
                  min="1"
                  max="5"
                  onChange={(e) => updateValue(i, c, e.target.value)}
                  style={{
                    background: getColor(opp[c]),
                    color: "white",
                    borderRadius: 6,
                  }}
                />
                <div />
              </React.Fragment>
            ))}

            <button onClick={() => removeOpportunity(i)}>✕</button>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={addOpportunity}>+ Opportunity</button>
        <button onClick={addCriteria}>+ Criteria</button>
        <button onClick={removeCriteria}>− Criteria</button>
        <button onClick={exportToCSV}>Export</button>
        <button
          onClick={generateInsights}
          style={{ background: "#2563eb", color: "white" }}
        >
          AI Insights
        </button>
      </div>

      {/* Ranking */}
      <div style={{ marginTop: 30 }}>
        <h2>Ranked Opportunities</h2>
        {ranked.map((opp, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "white",
              borderRadius: 8,
              marginBottom: 6,
              borderLeft: `6px solid ${getColor(opp.total)}`,
            }}
          >
            <span>{opp.name}</span>
            <strong>{opp.total}</strong>
          </div>
        ))}
      </div>

      {/* AI */}
      <div style={{ marginTop: 30 }}>
        <h2>AI Insights</h2>
        {loading && <p>Generating...</p>}
        {insights && (
          <div
            style={{
              background: "white",
              padding: 16,
              borderRadius: 10,
              lineHeight: 1.6,
            }}
          >
            {insights}
          </div>
        )}
      </div>
    </div>
  );
}
