

import React, { useState } from "react";

const defaultOpp = {
  name: "",
  growth: 3,
  impact: 3,
  ease: 3,
  competition: 3,
  trend: 3,
};

export default function App() {
  const [opps, setOpps] = useState([
    { ...defaultOpp, name: "Hispanic Cheese @ Walmart" },
    { ...defaultOpp, name: "Value Gouda (<$5)" },
  ]);

  const updateValue = (index, field, value) => {
    const updated = [...opps];
    updated[index][field] = field === "name" ? value : Number(value);
    setOpps(updated);
  };

  const addOpportunity = () => {
    setOpps([...opps, { ...defaultOpp }]);
  };

  const removeOpportunity = (index) => {
    const updated = opps.filter((_, i) => i !== index);
    setOpps(updated);
  };

  const scoredOpps = opps.map((opp) => ({
    ...opp,
    total:
      opp.growth +
      opp.impact +
      opp.ease +
      opp.competition +
      opp.trend,
  }));

  const ranked = [...scoredOpps].sort((a, b) => b.total - a.total);

  const exportToCSV = () => {
    const headers = [
      "Opportunity",
      "Growth",
      "Impact",
      "Ease",
      "Competition",
      "Trend",
      "Total",
    ];

    const rows = ranked.map((opp) => [
      opp.name,
      opp.growth,
      opp.impact,
      opp.ease,
      opp.competition,
      opp.trend,
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>AI Opportunity Scoring Model</h1>

      <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 20 }}>
        {opps.map((opp, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr repeat(5, 1fr) auto",
              gap: 8,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <input
              placeholder="Opportunity name"
              value={opp.name}
              onChange={(e) => updateValue(i, "name", e.target.value)}
            />
            {["growth", "impact", "ease", "competition", "trend"].map(
              (field) => (
                <input
                  key={field}
                  type="range"
                  min="1"
                  max="5"
                  value={opp[field]}
                  onChange={(e) => updateValue(i, field, e.target.value)}
                />
              )
            )}

            <button onClick={() => removeOpportunity(i)}>Delete</button>
          </div>
        ))}

        <div style={{ marginTop: 10 }}>
          <button onClick={addOpportunity} style={{ marginRight: 10 }}>
            Add Opportunity
          </button>
          <button onClick={exportToCSV}>Export to Excel</button>
        </div>
      </div>


      <div style={{ border: "1px solid #ccc", padding: 16 }}>
        <h2>Ranked Opportunities</h2>
        {ranked.map((opp, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "#f3f3f3",
              padding: 8,
              marginBottom: 6,
            }}
          >
            <span>{opp.name || "Unnamed"}</span>
            <strong>{opp.total}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
