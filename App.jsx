
import React, { useState } from "react";

// Default scoring criteria (editable)
const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];


const defaultOpp = (criteria) => {
  const base = { name: "" };
  criteria.forEach((c) => (base[c] = 3));
  return base;
};

export default function App() {
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [opps, setOpps] = useState([
    { ...defaultOpp(defaultCriteria), name: "Hispanic Cheese @ Walmart" },
    { ...defaultOpp(defaultCriteria), name: "Value Gouda (<$5)" },
  ]);

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


    setCriteria(newCriteria);
    setOpps(updatedOpps);
  };


  const addOpportunity = () => {
    setOpps([...opps, defaultOpp(criteria)]);
  };

  const removeOpportunity = (index) => {
    setOpps(opps.filter((_, i) => i !== index));
  };

  const scoredOpps = opps.map((opp) => {
    const total = criteria.reduce((sum, c) => sum + (opp[c] || 0), 0);
    return { ...opp, total };
  });
  const ranked = [...scoredOpps].sort((a, b) => b.total - a.total);

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

  return (
    <div style={{ padding: 30, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>AI Opportunity Model</h1>
      {/* Table */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        {/* Header Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `2fr repeat(${criteria.length}, 1fr) auto`,
            background: "#f7f7f7",
            padding: 10,
            fontWeight: "bold",
          }}
        >
          <div>Opportunity</div>
          {criteria.map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={(e) => updateCriteria(i, e.target.value)}
              style={{ fontWeight: "bold" }}
            />
          ))}
          <div></div>
        </div>


        {/* Data Rows */}
        {opps.map((opp, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: `2fr repeat(${criteria.length}, 1fr) auto`,
              padding: 10,
              borderTop: "1px solid #eee",
              alignItems: "center",
            }}
          >
            <input
              value={opp.name}
              placeholder="Opportunity name"
              onChange={(e) => updateValue(i, "name", e.target.value)}
            />

            {criteria.map((c) => (
              <input
                key={c}
                type="number"
                min="1"
                max="5"
                value={opp[c]}
                onChange={(e) => updateValue(i, c, e.target.value)}
                style={{ width: "60px" }}
              />
            ))}


            <button onClick={() => removeOpportunity(i)}>✕</button>
          </div>
        ))}
      </div>
      {/* Controls */}
      <div style={{ marginTop: 15 }}>
        <button onClick={addOpportunity} style={{ marginRight: 10 }}>
          + Add Opportunity
        </button>
        <button onClick={exportToCSV}>Export to Excel</button>
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
              padding: 10,
              background: "#f2f4f7",
              marginBottom: 6,
              borderRadius: 6,
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
