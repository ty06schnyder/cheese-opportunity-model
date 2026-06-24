import React, { useState } from "react"; //test test

import { Pie } from "react-chartjs-2"; 
import { ArcElement } from "chart.js";

import { Bar } from "react-chartjs-2"; //test
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement // ✅ ADD THIS
);

const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];
// Test
export default function App() {
  const [tab, setTab] = useState("input");
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("total");
  const [chartMetric, setChartMetric] = useState("total");
  const [hiddenProducts, setHiddenProducts] = useState([]);
  const [weights, setWeights] = useState(
    Object.fromEntries(defaultCriteria.map((c) => [c, 20]))
  );

  const [opps, setOpps] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [metrics, setMetrics] = useState([{ name: "", value: "" }]);
  const [name, setName] = useState("");

  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ ADD / REMOVE CRITERIA
  const addCriteria = () => {
    const newName = prompt("Enter new criteria");
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

  // ✅ METRICS INPUT
  const addMetric = () =>
    setMetrics([...metrics, { name: "", value: "" }]);

  const updateMetric = (i, field, value) => {
    const updated = [...metrics];
    updated[i][field] = value;
    setMetrics(updated);
  };

  // ✅ IMPORT CSV
  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".csv")) {
    alert("Please upload a CSV file");
    return;
  }

  const reader = new FileReader();

  reader.onload = async (event) => {
    const text = event.target.result;

    const rows = text
      .split("\n")
      .map((r) =>
        r
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // ✅ handles commas in numbers
          .map((cell) => cell.replace(/"/g, "").trim())
      )
      .filter((r) => r.length > 1 && r[0]);

    if (rows.length < 2) {
      alert("Invalid CSV format");
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const newOpps = [];

    // ✅ Process each product row
    for (let row of dataRows) {
      let productName = "";

      const metrics = headers
        .map((header, i) => {
          const cleanHeader = header.toLowerCase();

          // ✅ Extract product name
          if (cleanHeader.includes("product")) {
            productName = (row[i] || "").trim();
            return null;
          }

          return {
            name: header,
            value: (row[i] || "").replace(/,/g, "").replace("%", "").trim(), // ✅ fixes 12,731
          };
        })
        .filter(Boolean);

      // ✅ Skip empty rows
      if (!productName) continue;

      try {
        // ✅ Call AI to convert metrics → scores
        const res = await fetch("/api/ai", {
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

        const data = await res.json();

        let cleaned = data.text?.trim() || "";
        cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

        const scores = JSON.parse(cleaned);

        const newOpp = {
          id: Date.now() + Math.random(),
          name: productName,
        };

        criteria.forEach((c) => {
          newOpp[c] = scores[c] || 3;
        });

        metrics.forEach((m) => {
          newOpp[m.name] = Number(m.value);
        });

        // ✅ prevent duplicates (within this upload)
if (!newOpps.some((o) => o.name === newOpp.name)) {
  newOpps.push(newOpp);
}

      } catch (err) {
        console.log("Skipping row due to error:", err);
      }
    }

    // ✅ Add ALL opportunities at once
    setOpps((prev) => [...prev, ...newOpps]);

    // ✅ Go straight to model tab
    setTab("model");
  };

  reader.readAsText(file);
};
  const updateScore = (id, criteriaName, value) => {
    let num = Number(value);

    if (num > 5) num = 5;
    if (num < 1) num = 1;

    setOpps((prev) =>
      prev.map((opp) =>
        opp.id === id
          ? { ...opp, [criteriaName]: num }
          : opp
      )
    );
  };
  // ✅ CONVERT METRICS → AI SCORES
  const convertToOpportunity = async () => {
    if (!name) return;

    try {
      setLoading(true);

      const res = await fetch("/api/ai", {
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

      const data = await res.json();

      let cleaned = data.text?.trim() || "";
      cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

      const scores = JSON.parse(cleaned);

      
      const newOpp = {
        id: Date.now() + Math.random(),
        name,
      };

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

  // ✅ SCORING
  const totalWeight =
    Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const scored = opps.map((opp) => {
    const total = criteria.reduce(
      (sum, c) => sum + (opp[c] * weights[c]) / totalWeight,
      0
    );
    return { ...opp, total: Number((total * criteria.length).toFixed(2)) };
  });

  const filtered = scored.filter((opp) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return opp[key] >= value;
    });
  });

  const ranked = [...filtered].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    return b[sortBy] - a[sortBy];
  });

  const visibleForChart = ranked.filter(
    (opp) => !hiddenProducts.includes(opp.id)
  );
  const dollarShareKey = "Dollar Share of Category- Int Fresh";

  const hasDollarShare =
  ranked.length > 0 &&
  ranked[0][dollarShareKey] !== undefined;
  
  const chartSorted = [...visibleForChart].sort((a, b) => {
    if (chartMetric === "total") return b.total - a.total;
    return b[chartMetric] - a[chartMetric];
  });

  const chartData = {
    labels: chartSorted.map((o) =>
      o.name.length > 25 ? o.name.substring(0, 25) + "..." : o.name
    ),
    datasets: [
      {
        label:
          chartMetric === "total"
            ? "Total Score"
            : chartMetric,
        data: chartSorted.map((o) =>
          chartMetric === "total" ? o.total : o[chartMetric]
        ),
        backgroundColor: "#2563eb",
      },
    ],
  };

let pieData = null;

if (hasDollarShare) {
  const total = ranked.reduce(
    (sum, opp) => sum + Number(opp[dollarShareKey] || 0),
    0
  );

  pieData = {
    labels: ranked.map((o) =>
      o.name.length > 25
        ? o.name.substring(0, 25) + "..."
        : o.name
    ),
    datasets: [
      {
        data: ranked.map((o) => {
          const value = Number(o[dollarShareKey] || 0);
          return total > 0 ? (value / total) * 100 : 0; // ✅ % of total
        }),
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#facc15",
          "#fb923c",
          "#ef4444",
          "#8b5cf6",
          "#14b8a6",
        ],
      },
    ],
  };
}

const pieOptions = {
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          return context.raw.toFixed(1) + "%";
        },
      },
    },
  },
};
  
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
      },
    },
  },
};
  // ✅ EXPORT CSV
  const exportToCSV = () => {
    const headers = ["Product", ...criteria, "Total"];

    const rows = ranked.map((opp) => [
      opp.name,
      ...criteria.map((c) => opp[c]),
      opp.total,
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "opportunities.csv";
    link.click();
  };

  // ✅ INSIGHTS
  const generateInsights = async () => {
    try {
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

      {/* TABS */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("input")}>Data Input</button>
        <button onClick={() => setTab("model")}>Model</button>
      </div>

      {/* ✅ INPUT TAB */}
      {tab === "input" && (
        <div style={{ background: "white", padding: 20 }}>
          <h2>Enter Metrics</h2>

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
              Add to Model
            </button>
          </div>

          <div style={{ marginTop: 15 }}>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
          </div>

          {loading && <p>AI processing metrics...</p>}
        </div>
      )}

      {/* ✅ MODEL TAB */}
      {tab === "model" && (
        <>
          {/* Criteria pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {criteria.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f3f4f6",
                  padding: "5px 10px",
                  borderRadius: 10,
                  fontSize: "12px",
                }}
              >
                {c}
                <button
                  onClick={() => removeCriteria(c)}
                  style={{
                    fontSize: 10,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "none",
                    background: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button onClick={addCriteria}>+ Add</button>
          </div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <h3>Controls</h3>

            {/* SORT */}
            <div style={{ marginBottom: 10 }}>
              <label>Sort by: </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="total">Total Score</option>

                {criteria.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* FILTERS */}
            <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
              {criteria.map((c) => (
                <div key={c}>
                  <div style={{ fontSize: 12 }}>{c} ≥</div>

                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={filters[c] || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        [c]: Number(e.target.value),
                      })
                    }
                    style={{ width: 50 }}
                  />
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setFilters({})}>
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Opps */}
          <div style={{ marginTop: 20, background: "white", padding: 20 }}>
            {ranked.map((opp) => (
              <div key={opp.id}>
                <strong>{opp.name}</strong>

                <div style={{ display: "flex", gap: 10 }}>
                  {criteria.map((c) => (
                    <div
  onClick={() => {
    if (editing === `${opp.id}-${c}`) return;

    setEditing(`${opp.id}-${c}`);
    setEditValue(opp[c]);
  }}
  style={{
    background: getColor(opp[c]),
    color: "white",
    padding: 6,
    borderRadius: 6,
    minWidth: 60,
    textAlign: "center",
    cursor: "pointer",
  }}
>
  {editing === `${opp.id}-${c}` ? (
    <input
  type="number"
  min="1"
  max="5"
  autoFocus
  value={editValue}
  onChange={(e) => setEditValue(e.target.value)}
  onBlur={() => {
    setEditing(null);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      updateScore(opp.id, c, editValue);
      setEditing(null);
    }
  }}
  style={{
    width: "100%",
    border: "none",
    background: "transparent",
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    outline: "none",
  }}
/>
  ) : (
    <span>
      {c}: {opp[c]}
    </span>
  )}
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
            <div style={{ marginTop: 30 }}>
  <h2>Opportunity Comparison</h2>
              
  <div style={{ marginBottom: 15 }}>
    {/* Y AXIS CONTROL */}
    <label>Y-Axis: </label>
    <select
      value={chartMetric}
      onChange={(e) => setChartMetric(e.target.value)}
    >
      <option value="total">Total</option>
      {criteria.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>

    {/* RESET BUTTON */}
    <button
      style={{ marginLeft: 10 }}
      onClick={() => {
        setChartMetric("total");
        setHiddenProducts([]);
      }}
    >
      Reset Chart
    </button>
  </div>
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {ranked.map((opp) => {
      const isHidden = hiddenProducts.includes(opp.id);

      return (
        <div
          key={opp.id}
          onClick={() => {
            if (isHidden) {
              setHiddenProducts(
                hiddenProducts.filter((id) => id !== opp.id)
              );
            } else {
              setHiddenProducts([...hiddenProducts, opp.id]);
            }
          }}
          style={{
            padding: "5px 10px",
            borderRadius: 10,
            background: isHidden ? "#e5e7eb" : "#2563eb",
            color: isHidden ? "black" : "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {opp.name.length > 20
            ? opp.name.substring(0, 20) + "..."
            : opp.name}
        </div>
      );
    })}
  </div>
  <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
    <Bar data={chartData} options={chartOptions} />
  </div>
  {hasDollarShare && pieData && (
  <div
    style={{
      marginTop: 30,
      background: "white",
      padding: 20,
      borderRadius: 10,
    }}
  >
    <h3>Market Share (Dollar Share of Category - Int Fresh)</h3>

    <Pie data={pieData} options={pieOptions} />
  </div>
)}
</div>
          </div>

          {/* Buttons */}
          <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
            <button onClick={generateInsights}>
              Generate AI Insights
            </button>
            <button onClick={exportToCSV}>
              Export to Excel
            </button>
          </div>

          {/* AI Output */}
          <div style={{ marginTop: 20 }}>
            {loading && <p>Generating insights...</p>}
            {insights && (
              <div
  style={{
    background: "white",
    padding: 16,
    whiteSpace: "pre-line", // ✅ THIS FIXES EVERYTHING
    lineHeight: 1.6,
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
