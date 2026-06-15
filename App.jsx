import React, { useState } from "react";

const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];

const defaultOpp = (criteria) => {
  const base = { name: "" };
  criteria.forEach((c) => (base[c] = 3));
  return base;
};

// ⚡ Conversion Logic
const convertToScores = ({ stores, price, sales }) => {
  // Growth (Dollar Sales)
  let growth =
    sales < 1e6
      ? 1
      : sales < 5e6
      ? 2
      : sales < 10e6
      ? 3
      : sales < 25e6
      ? 4
      : 5;

  // Impact (# Stores)
  let impact =
    stores < 500
      ? 1
      : stores < 2000
      ? 2
      : stores < 5000
      ? 3
      : stores < 10000
      ? 4
      : 5;

  // Ease (Price)
  let ease =
    price > 9 ? 1 :
    price > 7 ? 2 :
    price > 5 ? 3 :
    price > 3 ? 4 : 5;

  let competition = 6 - impact;
  let trend = 3;

  return { growth, impact, ease, competition, trend };
};

export default function App() {
  const [activeTab, setActiveTab] = useState("circana");

  const [criteria, setCriteria] = useState(defaultCriteria);

  const [weights, setWeights] = useState(
    Object.fromEntries(defaultCriteria.map((c) => [c, 20]))
  );

  const [opps, setOpps] = useState([]);

  const [circanaInput, setCircanaInput] = useState({
    name: "",
    stores: "",
    price: "",
    sales: "",
  });

  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Add from Circana
  const addFromCircana = () => {
    const { name, stores, price, sales } = circanaInput;

    if (!name || !stores || !price || !sales) return;

    const scores = convertToScores({
      stores: Number(stores),
      price: Number(price),
      sales: Number(sales),
    });

    const newOpp = { name };

    criteria.forEach((c) => {
      newOpp[c] = scores[c.toLowerCase()] || 3;
    });

    setOpps([...opps, newOpp]);

    setCircanaInput({ name: "", stores: "", price: "", sales: "" });
    setActiveTab("model");
  };

  const updateValue = (i, field, value) => {
    const updated = [...opps];
    updated[i][field] =
      field === "name" ? value : Number(value);
    setOpps(updated);
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const scored = opps.map((opp) => {
    const total = criteria.reduce((sum, c) => {
      return sum + ((opp[c] || 0) * weights[c]) / totalWeight;
    }, 0);
    return { ...opp, total: Number((total * criteria.length).toFixed(2)) };
  });

  const ranked = [...scored].sort((a, b) => b.total - a.total);

  const generateInsights = async () => {
    setLoading(true);

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteria, weights, opportunities: ranked }),
    });

    const data = await res.json();
    setInsights(data.text);
    setLoading(false);
  };

  const getColor = (v) =>
    v >= 5 ? "#16a34a" :
    v >= 4 ? "#4ade80" :
    v >= 3 ? "#facc15" :
    v >= 2 ? "#fb923c" : "#ef4444";

  return (
    <div style={{ padding: 40, background: "#f6f8fb", minHeight: "100vh" }}>
      <h1>Opportunity Prioritization Model</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("circana")}>Circana Input</button>
        <button onClick={() => setActiveTab("model")}>Model</button>
      </div>

      {/* CIRCANA TAB */}
      {activeTab === "circana" && (
        <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
          <h2>Enter Circana Data</h2>

          <input placeholder="Product Name"
            value={circanaInput.name}
            onChange={(e) =>
              setCircanaInput({ ...circanaInput, name: e.target.value })}
          />

          <input placeholder="# Stores"
            value={circanaInput.stores}
            onChange={(e) =>
              setCircanaInput({ ...circanaInput, stores: e.target.value })}
          />

          <input placeholder="Price ($)"
            value={circanaInput.price}
            onChange={(e) =>
              setCircanaInput({ ...circanaInput, price: e.target.value })}
          />

          <input placeholder="Dollar Sales ($)"
            value={circanaInput.sales}
            onChange={(e) =>
              setCircanaInput({ ...circanaInput, sales: e.target.value })}
          />

          <button onClick={addFromCircana}>
            Add Opportunity
          </button>
        </div>
      )}

      {/* MODEL TAB */}
      {activeTab === "model" && (
        <>
          {ranked.map((opp, i) => (
            <div key={i}>
              {opp.name} - {opp.total}
            </div>
          ))}

          <button onClick={generateInsights}>
            Generate AI Insights
          </button>

          {loading && <p>Loading...</p>}
          {insights && <pre>{insights}</pre>}
        </>
      )}
    </div>
  );
}
