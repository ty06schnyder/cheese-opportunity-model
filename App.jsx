
import React, { useState } from "react";

const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];

const defaultOpp = (criteria) => {
  const base = { name: "" };
  criteria.forEach((c) => (base[c] = 3));
  return base;
};

export default function App() {
  const [criteria, setCriteria] = useState(defaultCriteria);


  // ✅ Default weights now 20%
  const [weights, setWeights] = useState(
    Object.fromEntries(defaultCriteria.map((c) => [c, 20]))
  );

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

    const newWeights = { ...weights };
    newWeights[value] = newWeights[oldKey];
    delete newWeights[oldKey];

    setCriteria(newCriteria);
    setOpps(updatedOpps);
    setWeights(newWeights);
  };

  // ✅ Fix input bug + prevent leading zero issue
  const updateWeight = (key, value) => {
    const clean = value.replace(/^0+(?=\d)/, "");
    setWeights({ ...weights, [key]: Number(clean || 0) });
  };

  const addCriteria = () => {
    const newKey = `Criteria ${criteria.length + 1}`;
    setCriteria([...criteria, newKey]);

    // ✅ new criteria defaults to 20%
    setWeights({ ...weights, [newKey]: 20 });


    const updatedOpps = opps.map((opp) => ({
      ...opp,
      [newKey]: 3,
    }));
    setOpps(updatedOpps);
  };

  const removeCriteria = () => {
    if (criteria.length === 0) return;
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

  // ✅ Normalize weights so total always behaves like % (sums to 1)
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;


  const scoredOpps = opps.map((opp) => {
    const total = criteria.reduce((sum, c) => {
      const weightNormalized = (weights[c] || 0) / totalWeight;
      return sum + (opp[c] || 0) * weightNormalized * criteria.length;
    }, 0);


    return { ...opp, total: Number(total.toFixed(2)) };
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

  const getColor = (value) => {
    if (value >= 5) return "#16a34a";
    if (value >= 4) return "#4ade80";
    if (value >= 3) return "#facc15";
    if (value >= 2) return "#fb923c";
    return "#ef4444";
  };

  return (
    <div style={{ padding: 30, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>
        Opportunity Prioritization Model
      </h1>

      <div
        style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `2fr repeat(${criteria.length}, 1fr 0.8fr) auto`,
            background: "#f7f7f7",
            padding: 10,
            fontWeight: "bold",
          }}
        >
          <div>Opportunity</div>

          {criteria.map((c, i) => (
            <>
              <input
                key={`name-${i}`}
                value={c}
                onChange={(e) => updateCriteria(i, e.target.value)}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="text"
                  value={weights[c]}
                  onChange={(e) => updateWeight(c, e.target.value)}
                  style={{ width: "50px" }}
                />
                %
              </div>
            </>
          ))}

          <div></div>
        </div>

        {/* Rows */}
        {opps.map((opp, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: `2fr repeat(${criteria.length}, 1fr 0.8fr) auto`,
              padding: 10,
              borderTop: "1px solid #eee",
              alignItems: "center",
            }}
          >
            <input
              value={opp.name}
              placeholder="Opportunity"
              onChange={(e) => updateValue(i, "name", e.target.value)}
            />

            {criteria.map((c) => (
              <>
                <input
                  key={`score-${c}`}
                  type="number"
                  min="1"
                  max="5"
                  value={opp[c]}
                  onChange={(e) => updateValue(i, c, e.target.value)}
                  style={{
                    width: "60px",
                    background: getColor(opp[c]),
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: 2,
                  }}
                />
                <div></div>
              </>
            ))}

            <button onClick={() => removeOpportunity(i)}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 15 }}>
        <button onClick={addOpportunity} style={{ marginRight: 10 }}>
          + Add Opportunity
        </button>
        <button onClick={addCriteria} style={{ marginRight: 10 }}>
          + Add Criteria
        </button>
        <button onClick={removeCriteria} style={{ marginRight: 10 }}>
          − Remove Criteria
        </button>
        <button onClick={exportToCSV}>Export to Excel</button>
      </div>

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
              borderLeft: `6px solid ${getColor(Math.round(opp.total))}`,
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
