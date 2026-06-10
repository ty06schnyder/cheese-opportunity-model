

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // ✅ CSV Export Function (works like Excel when opened)
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


    const csvContent =
      [headers, ...rows]
        .map((row) => row.join(","))
        .join("
");


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
    <div className="p-6 grid gap-6">
      <h1 className="text-2xl font-bold">AI Opportunity Scoring Model</h1>

      <Card>
        <CardContent className="p-4 grid gap-4">
          {opps.map((opp, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 items-center">
              <Input
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
                    onChange={(e) =>
                      updateValue(i, field, e.target.value)
                    }
                  />
                )
              )}

              <Button variant="destructive" onClick={() => removeOpportunity(i)}>
                X
              </Button>
            </div>
          ))}

          <div className="flex gap-3">
            <Button onClick={addOpportunity}>Add Opportunity</Button>
            <Button onClick={exportToCSV}>Export to Excel</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Ranked Opportunities</h2>
          <div className="grid gap-2">
            {ranked.map((opp, i) => (
              <div
                key={i}
                className="flex justify-between bg-gray-100 p-2 rounded-xl"
              >
                <span>{opp.name || "Unnamed"}</span>
                <span className="font-bold">{opp.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
