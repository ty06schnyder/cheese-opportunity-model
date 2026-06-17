import React, { useState } from "react";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const defaultCriteria = ["Growth", "Impact", "Ease", "Competition", "Trend"];

export default function App() {
  const [tab, setTab] = useState("input");
  const [criteria, setCriteria] = useState(defaultCriteria);

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

  // ✅ UPDATE SCORE (FIXED - uses ID not index)
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

  // ✅ IMPORT CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target.result;

      const rows = text
        .split("\n")
        .map((r) =>
          r
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map((cell) => cell.replace(/"/g, "").trim())
        )
        .filter((r) => r.length > 1 && r[0]);

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const newOpps = [];

      for (let row of dataRows) {
        let productName = "";

        const metrics = headers
          .map((header, i) => {
            if (header.toLowerCase().includes("product")) {
              productName = row[i];
              return null;
            }

            return {
              name: header,
              value: (row[i] || "").replace(/,/g, ""),
            };
          })
          .filter(Boolean);

        if (!productName) continue;

        try {
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

          let cleaned = data.text
            ?.replace(/```json/g, "")
            .replace(/```/g, "");

          const scores = JSON.parse(cleaned);

          const newOpp = {
            id: Date.now() + Math.random(),
            name: productName,
          };

          criteria.forEach((c) => {
            newOpp[c] = scores[c] || 3;
          });

          if (!newOpps.some((o) => o.name === newOpp.name)) {
            newOpps.push(newOpp);
          }
        } catch {
          console.log("Skipped row");
        }
      }

      setOpps((prev) => [...prev, ...newOpps]);
      setTab("model");
    };

    reader.readAsText(file);
  };

  // ✅ SCORING
  const totalWeight =
    Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const scored = opps.map((opp) => {
    const total = criteria.reduce(
      (sum, c) => sum + (opp[c] * weights[c]) / totalWeight,
      0
    );
    return { ...opp, total };
  });

  const ranked = [...scored].sort((a, b) => b.total - a.total);

  const chartData = {
    labels: ranked.map((o) =>
      o.name.length > 25 ? o.name.substring(0, 25) + "..." : o.name
    ),
    datasets: [
      {
        label: "Score",
        data: ranked.map((o) => o.total),
        backgroundColor: "#2563eb",
      },
    ],
  };

  return (
    <div style={{ padding: 40, background: "#f6f8fb" }}>
      <h1>Opportunity Model</h1>

      <button onClick={() => setTab("input")}>Input</button>
      <button onClick={() => setTab("model")}>Model</button>

      {tab === "input" && (
        <div>
          <input
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </div>
      )}

      {tab === "model" && (
        <>
          <div>
            {opps.map((opp) => (
              <div key={opp.id}>
                <strong>{opp.name}</strong>

                <div style={{ display: "flex", gap: 10 }}>
                  {criteria.map((c) => (
                    <div
                      key={c}
                      onClick={() => {
                        setEditing(`${opp.id}-${c}`);
                        setEditValue(opp[c]);
                      }}
                      style={{
                        background: "#4ade80",
                        padding: 6,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      {editing === `${opp.id}-${c}` ? (
                        <input
                          value={editValue}
                          onChange={(e) =>
                            setEditValue(e.target.value)
                          }
                          onBlur={() => setEditing(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateScore(opp.id, c, editValue);
                              setEditing(null);
                            }
                          }}
                        />
                      ) : (
                        `${c}: ${opp[c]}`
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h2>Chart</h2>
          <Bar data={chartData} />
        </>
      )}
    </div>
  );
}
