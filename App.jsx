import React, { useState } from "react"; //testt

import { Pie } from "react-chartjs-2"; //test
import { ArcElement } from "chart.js"; //test

import { Bar } from "react-chartjs-2"; //test test test test
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

const defaultCriteria = ["Category Growth Potential", "White Space Opportunity", "Retailer Attractiveness",];
// Test
const aggregateOptions = [
  "Gouda",
  "Cheddar",
  "Hispanic",
  "Goat",
  "Snack Cheese",
  "Parmesan",
  "Havarti",
  "Brie",
  "Mozzarella",
  "Feta",
  "Blue Cheese",
  "Other",
];
const holidayMap = {
  Q1: ["Superbowl", "Easter"],
  Q2: ["Memorial Day", "Cinco de Mayo"],
  Q3: ["Back to School", "Labor Day", "July 4th"],
  Q4: ["Halloween", "Thanksgiving", "Christmas", "New Years Eve"],
};

function weekToEvent(week) {

  if (week <= 8) {
    return "Superbowl";
  }

  if (week <= 16) {
    return "Easter";
  }

  if (week <= 19) {
    return "Cinco de Mayo";
  }

  if (week <= 22) {
    return "Memorial Day";
  }

  if (week <= 28) {
    return "July 4th";
  }

  if (week <= 36) {
    return "Back to School";
  }

  if (week <= 38) {
    return "Labor Day";
  }

  if (week <= 44) {
    return "Halloween";
  }

  if (week <= 48) {
    return "Thanksgiving";
  }

  if (week <= 52) {
    return "Christmas";
  }

  return "New Years Eve";
}

export default function App() {
  const [tab, setTab] = useState("input");
  const [promotionData, setPromotionData] = useState([]);
  const [promotionCalendar, setPromotionCalendar] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("total");
  const [chartMetric, setChartMetric] = useState("total");
  const [hiddenProducts, setHiddenProducts] = useState([]);
  const [weights] = useState({
    "Category Growth Potential": 40,
    "White Space Opportunity": 35,
    "Retailer Attractiveness": 25,
  });

  const [opps, setOpps] = useState([]);
  const [aggregates, setAggregates] = useState([]);
  const [showAggregateModal, setShowAggregateModal] = useState(false);
  const [selectedAggregateType, setSelectedAggregateType] = useState("Gouda");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [metrics, setMetrics] = useState([{ name: "", value: "" }]);
  const [name, setName] = useState("");
  const [followup, setFollowup] = useState("");
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("All");
  // ✅ ADD / REMOVE CRITERIA
  
  const refineInsights = async () => {
    if (!followup) return;

    try {
      setLoading(true);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "followup",
          criteria,
          weights,
          opportunities: ranked,
          previousInsights: insights,
          userInput: followup,
        }),
      });

      const data = await res.json();

      // ✅ Replace insights with refined version
      setInsights(data.text);

      // ✅ Clear input
      setFollowup("");

    } catch (e) {
      console.error(e);
      alert("Failed to refine insights");
    } finally {
      setLoading(false);
    }
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
        const classRes = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "classification",
            productName,
            metrics,
          }),
        });

        const classData = await classRes.json();

        console.log("CLASSIFICATION RAW:");
        console.log(classData.text);
        const classification = JSON.parse(
          classData.text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()
        );

        const newOpp = {
          id: Date.now() + Math.random(),
          name: productName,

          // AI Classification
          category: classification.category,
          occasion: classification.occasion,
          priceTier: classification.priceTier,
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
        console.error("ROW FAILED");
        console.error("Product:", productName);
        console.error(err);
      }
    }

    if (newOpps.length > 0) {
      setOpps((prev) => [...prev, ...newOpps]);
      setTab("model");
    } else {
      alert("No valid data was processed. Check your CSV format.");
    }
  };

  reader.readAsText(file);
};

  const handlePromotionUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;

      const rows = text
        .split("\n")
        .map((r) => r.split(","));

      const headers = rows[0];

      const data = rows.slice(1).map((row) => {
        const obj = {};

        headers.forEach((h, i) => {
          obj[h.trim()] = row[i];
        });

        return obj;
      });

      console.log("Promotion rows:", data.length);
      console.log("Headers:", headers);
      console.log("First row:", data[0]);
      
      setPromotionData(data);
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

  const scored = [...opps, ...aggregates].map((opp) => {
    const total = criteria.reduce(
      (sum, c) => sum + (opp[c] * weights[c]) / totalWeight,
      0
    );
    return { ...opp, total: Number((total * criteria.length).toFixed(2)) };
  });

  const filtered = scored.filter((opp) => {
    const categoryMatch =
      categoryFilter === "All" ||
      opp.category === categoryFilter;

    const criteriaMatch =
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return opp[key] >= value;
      });

    return categoryMatch && criteriaMatch;
  });

  const ranked = [...filtered].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    return b[sortBy] - a[sortBy];
  });
  
  const availableCategories = [
    "All",
    ...new Set(
      opps
        .map((o) => o.category)
        .filter(Boolean)
    ),
  ];
  const visibleForChart = ranked.filter(
    (opp) => !hiddenProducts.includes(opp.id)
  );

  
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

const dollarShareKey = Object.keys(opps[0] || {}).find((key) =>
  key.toLowerCase().includes("dollar share")
);

const hasDollarShare = !!dollarShareKey;

let pieData = null;

if (hasDollarShare) {
  const total = visibleForChart.reduce(
    (sum, opp) => sum + Number(opp[dollarShareKey] || 0),
    0
  );

  pieData = {
    labels: visibleForChart.map((o) =>
      o.name.length > 25
        ? o.name.substring(0, 25) + "..."
        : o.name
    ),
    datasets: [
      {
        data: visibleForChart.map((o) => {
          const value = Number(o[dollarShareKey] || 0);
          return total > 0 ? (value / total) * 100 : 0;
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
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top", // stays on top
      align: "center",
      labels: {
        boxWidth: 12,
      },
    },
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

  const generatePromotions = async () => { //test
    if (!promotionData.length) {
      alert(
        "Please upload IRI promotion data before generating recommendations."
      );
      return;
    }
    try {
      setLoading(true);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "promotion",
          data: promotionData,
        }),
      });

      const data = await res.json();

      let cleaned = data.text || "";

      cleaned = cleaned
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const calendar = JSON.parse(cleaned);

      setPromotionCalendar(calendar);

    } catch (e) {
      console.error(e);
      alert("Failed to generate promotion recommendations");
    } finally {
      setLoading(false);
    }
  };

  const createAggregate = () => {

    const productsToAggregate =
      opps.filter((o) =>
        selectedProducts.includes(o.id)
      );

    if (!productsToAggregate.length) return;

    const aggregate = {
      id: Date.now(),

      name: selectedAggregateType,

      isAggregate: true,

      members: productsToAggregate.map(
        (p) => p.name
      ),
    };

    criteria.forEach((c) => {

      aggregate[c] =
        productsToAggregate.reduce(
          (sum, p) => sum + (p[c] || 0),
          0
        ) / productsToAggregate.length;

    });

    const dollarShareKey =
      Object.keys(productsToAggregate[0] || {})
        .find((key) =>
          key.toLowerCase().includes("dollar share")
        );

    if (dollarShareKey) {

      aggregate[dollarShareKey] =
        productsToAggregate.reduce(
          (sum, p) =>
            sum +
            Number(p[dollarShareKey] || 0),
          0
        );
    }

    setAggregates([
      ...aggregates,
      aggregate,
    ]);

    setOpps(
      opps.filter(
        (o) =>
          !selectedProducts.includes(o.id)
      )
    );

    setSelectedProducts([]);

    setShowAggregateModal(false);
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

/* ===========================
   PROMOTION OPPORTUNITY SCORING
=========================== */

  const promotionScores = promotionData.map((item) => {

    const seasonality =
      Number(item.SeasonalityIndex || 0);

    const promoLift =
      Number(item.PromoLift || 0);

    const velocity =
      Number(item.Velocity || 0);

    const distributionGap =
      Number(item.DistributionGap || 0);

    const score =
      seasonality * 0.4 +
      promoLift * 0.3 +
      velocity * 0.2 +
      distributionGap * 0.1;

    return {
      ...item,
      promotionScore: Number(score.toFixed(2))
    };
  });

  const getMatchingPrograms = (
    recommendation
  ) => {

    if (
      !recommendation ||
      !promotionData.length
    ) {
      return [];
    }

    const text = JSON.stringify(
      recommendation
    ).toLowerCase();

    return promotionData.filter(
      (program) => {

        const retailer =
          JSON.stringify(program)
            .toLowerCase();

        return (
          text.includes("awareness")
            ? retailer.includes("awareness")
            : true
        );

      }
    );

  };
  
  return (
    <div style={{ padding: 40, background: "#f6f8fb" }}>
      <h1>Opportunity Prioritization Model</h1>

      {/* TABS */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("input")}>Data Input</button>
        <button onClick={() => setTab("model")}>Model</button>
        <button onClick={() => setTab("promotion")}>
          Promotion Optimizer
        </button>
      </div>
      
      {/* ✅ INPUT TAB */}
      {tab === "input" && (
        <div style={{ background: "white", padding: 20 }}>
          <h2>Enter Products</h2>
          <div
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 15,
    marginTop: 10,
  }}
>
  {criteria.map((c) => {

    const tooltipMap = {
      "Category Growth Potential":
        "Required Metrics:\n• Dollar Sales Growth %\n• Unit Sales Growth %\n• Volume Growth %",

      "White Space Opportunity":
        "Required Metrics:\n• Market Share\n• Share Gap vs Category Leader\n• Distribution (%ACV)\n• Assortment Gaps",

      "Retailer Attractiveness":
        "Required Metrics:\n• Category Size ($)\n• Category Growth %\n• Segment Growth %\n• Current Share Position",
    };

    return (
      <div
        key={c}
        title={tooltipMap[c]}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#f3f4f6",
          padding: "5px 10px",
          borderRadius: 10,
          fontSize: "12px",
          cursor: "help",
        }}
      >
        {c}
      </div>
    );
  })}
</div>
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

          <button onClick={addMetric}>+ Add Product</button>

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
        <div>
          {/* Criteria pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {criteria.map((c) => {

              const tooltipMap = {
                "Category Growth Potential":
                "Required Metrics:\n• Dollar Sales Growth %\n• Unit Sales Growth %\n• Volume Growth %",

                "White Space Opportunity":
                "Required Metrics:\n• Market Share\n• Share Gap vs Category Leader\n• Distribution (%ACV)\n• Assortment Gaps",

                "Retailer Attractiveness":
                "Required Metrics:\n• Category Size ($)\n• Category Growth %\n• Segment Growth %\n• Current Share Position",
              };

              return (
                <div
                  key={c}
                  title={tooltipMap[c]}
                  style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f3f4f6",
                  padding: "5px 10px",
                  borderRadius: 10,
                  fontSize: "12px",
                  cursor: "help",
                }}
              >
                {c}
              </div>
            );
          })}

          </div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <h3>Controls</h3>

            
            <div style={{ marginBottom: 10 }}>
              <label>Category: </label>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
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

            <button
              onClick={() =>
                setShowAggregateModal(true)
              }
            >
              Create Aggregate
            </button>
            
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

    <div
      style={{
        width: 1000,
        height: 500,   // ✅ ADD THIS (CRITICAL)
        margin: "0 auto",
      }}
    >
      <Pie data={pieData} options={pieOptions} />
    </div>
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

{showAggregateModal && (
  <div
    style={{
      position: "fixed",
      top: 50,
      left: "50%",
      transform: "translateX(-50%)",
      background: "white",
      padding: 20,
      borderRadius: 10,
      width: 500,
      maxHeight: "70vh",
      overflowY: "auto",
      zIndex: 1000,
      boxShadow: "0 4px 20px rgba(0,0,0,.2)",
    }}
  >
    <h2>Create Aggregate</h2>

    <select
      value={selectedAggregateType}
      onChange={(e) =>
        setSelectedAggregateType(e.target.value)
      }
    >
      {aggregateOptions.map((option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}
    </select>

    <div style={{ marginTop: 15 }}>
      {opps.map((opp) => (
        <div key={opp.id}>
          <label>
            <input
              type="checkbox"
              checked={selectedProducts.includes(opp.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedProducts([
                    ...selectedProducts,
                    opp.id,
                  ]);
                } else {
                  setSelectedProducts(
                    selectedProducts.filter(
                      (id) => id !== opp.id
                    )
                  );
                }
              }}
            />

            {opp.name}
          </label>
        </div>
      ))}
    </div>

    <div
      style={{
        marginTop: 15,
        display: "flex",
        gap: 10,
      }}
    >
      <button onClick={createAggregate}>
        Create Aggregate
      </button>

      <button
        onClick={() =>
          setShowAggregateModal(false)
        }
      >
        Cancel
      </button>
    </div>
  </div>
)}
          {/* AI Output */}
<div style={{ marginTop: 20 }}>
  {loading && <p>Generating insights...</p>}

  {insights && (
    <div>
      {/* ✅ INSIGHTS BOX */}
      <div
        style={{
          background: "white",
          padding: 16,
          whiteSpace: "pre-line",
          lineHeight: 1.6,
        }}
      >
        {insights}
      </div>

      {/* ✅ FOLLOW-UP INPUT (ADD THIS BELOW) */}
      <div style={{ marginTop: 15 }}>
        <textarea
          placeholder="Add more context (pricing, brand constraints, goals, etc.)"
          value={followup}
          onChange={(e) => setFollowup(e.target.value)}
          style={{
            width: "100%",
            height: 80,
            padding: 10,
          }}
        />

        <button
          style={{ marginTop: 10 }}
          onClick={refineInsights}
        >
          Refine Insights
        </button>
      </div>
    </div>
  )}
          </div>
        </div>
      )}
  {tab === "promotion" && (
    <div>
      <h2>Promotion Optimizer</h2>
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid #e5e7eb",
        }}
      >
        <h3>Required IRI Inputs</h3>

        <div style={{ marginBottom: 15 }}>
          <strong>Minimum Required</strong>
          <ul>
            <li>Week Ending</li>
            <li>Product Name</li>
            <li>Dollar Sales ($)</li>
            <li>Unit Sales</li>
            <li>Average Price</li>
          </ul>
        </div>

        <div style={{ marginBottom: 15 }}>
          <strong>Recommended</strong>
          <ul>
            <li>Feature %</li>
            <li>Display %</li>
            <li>Feature & Display %</li>
            <li>TDP / Distribution</li>
            <li>Velocity</li>
            <li>Promo Volume %</li>
          </ul>
        </div>

  <div>
          <strong>Ideal (Best Results)</strong>
          <ul>
            <li>Promo Lift</li>
            <li>Incremental Volume</li>
            <li>Incremental Sales</li>
            <li>Competitive Promotion Activity</li>
            <li>Share of Category</li>
            <li>ACV Distribution</li>
          </ul>
        </div>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handlePromotionUpload}
      />

      {promotionData.length > 0 && (
        <div style={{ marginTop: 10 }}>
          Loaded {promotionData.length} IRI records
        </div>
      )}
      
      <button
        style={{ marginTop: 15 }}
        onClick={generatePromotions}
        disabled={!promotionData.length}
      >
        Generate Promotion Recommendations
      </button>

      {loading && <p>Analyzing promotion opportunities...</p>}

      {promotionCalendar.length > 0 && (
        <div
          style={{
            marginTop: 30,
            background: "white",
            padding: 20,
            borderRadius: 10,
          }}
        >
          <h2>Promotion Calendar</h2>

          {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
            <div
              key={quarter}
              style={{
                marginBottom: 30,
              }}
            >
              <h3>{quarter}</h3>

              {promotionCalendar
                .filter((item) => {
                  if (quarter === "Q1") {
                    return [
                      "Superbowl",
                      "Easter",
                    ].includes(item.event);
                  }

                  if (quarter === "Q2") {
                    return [
                      "Memorial Day",
                      "Cinco de Mayo",
                    ].includes(item.event);
                  }

                  if (quarter === "Q3") {
                    return [
                      "Back to School",
                      "Labor Day",
                      "July 4th",
                    ].includes(item.event);
                  }

                  return [
                    "Halloween",
                    "Christmas",
                    "Thanksgiving",
                    "New Years Eve",
                  ].includes(item.event);
                })
                .map((item, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      setSelectedPromotion(item)
                    }
                    style={{
                      background: "#f3f4f6",
                      padding: 15,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <strong>Event:</strong> {item.event}
                    </div>

                    <div>
                      <strong>Category:</strong> {item.category}
                    </div>

                    <div>
                      <strong>Brand:</strong> {item.brand}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <strong>Why:</strong>
                    </div>

                    <div>{item.reason}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {selectedPromotion && (

        <div
          style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            marginTop: 20,
            border: "1px solid #e5e7eb",
          }}
        >

          <h2>
            Promotion Playbook
          </h2>

          <h3>
            {selectedPromotion.event}
          </h3>

          <div>
            <strong>Category:</strong>
            {" "}
            {selectedPromotion.category}
          </div>

          <div>
            <strong>Brand:</strong>
            {" "}
            {selectedPromotion.brand}
          </div>

          <div
            style={{
              marginTop: 15
            }}
          >
            <strong>Reason:</strong>
          </div>

          <div>
            {selectedPromotion.reason}
          </div>

          <h3
            style={{
              marginTop: 20
            }}
          >
            Matching Retail Programs
          </h3>

          {getMatchingPrograms(
            selectedPromotion
          ).slice(0, 15)
            .map((program, i) => (

            <div
              key={i}
              style={{
                padding: 10,
                border:
                  "1px solid #e5e7eb",
                borderRadius: 8,
                marginBottom: 10,
              }}
            >

              {Object.entries(program)
                .map(([key, value]) => (

                <div key={key}>

                  <strong>
                    {key}:
                  </strong>

                  {" "}
                  {value}

                </div>

              ))}

            </div>

          ))}

        </div>

      )}
      {insights && (
        <div
          style={{
            background: "white",
            padding: 20,
            marginTop: 20,
            whiteSpace: "pre-line",
            borderRadius: 10,
          }}
        >
          {insights}
        </div>
      )}
    </div>
  )}
  </div>
  );
}
