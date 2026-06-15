export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    let prompt = "";

    // ✅ MODE 1 — METRICS → SCORES
    if (body.type === "mapping") {
      prompt = `
You are a category strategy expert focused on the U.S. cheese market.

Your task is to convert raw business metrics into 1–5 scores.

Metrics:
${JSON.stringify(body.metrics, null, 2)}

Scoring Criteria:
${body.criteria.join(", ")}

Guidelines:
- Use realistic cheese category context
- Example benchmarks:
  - ~$10M in sales = strong
  - High distribution = higher impact AND higher competition
  - Lower price = easier execution
  - High velocity = strong growth signal

Instructions:
- Assign each criterion a score from 1–5
- Be logical and consistent
- Do not explain anything

Return ONLY valid JSON in this exact format:

{
  "Growth": number,
  "Impact": number,
  "Ease": number,
  "Competition": number,
  "Trend": number
}
`;
    }

    // ✅ MODE 2 — SCORED OPPORTUNITIES → INSIGHTS
    if (body.type === "insights") {
      prompt = `
You are a strategy consultant preparing a recommendation for business leadership.

Analyze the following opportunities:

${JSON.stringify(body.opportunities, null, 2)}

Scoring Criteria:
${body.criteria.join(", ")}

Weights:
${JSON.stringify(body.weights)}

Your output must follow this EXACT format:

Top Opportunity:
[Name]

Where to Focus:
[1–2 sentences]

What to Do:
- Action 1
- Action 2
- Action 3

Why It Matters:
[2–3 sentences explaining business impact]

Second Priority:
[Name]

Key Risk:
[1–2 sentences]

Rules:
- Do NOT use markdown formatting (**, #, etc.)
- Keep it concise and executive-ready
- Focus on actions, not descriptions
`;
    }

    // ✅ Call OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();

    console.log("OPENAI RESPONSE:", JSON.stringify(data, null, 2));

    // ✅ Error handling
    if (!data || !data.choices) {
      return res.status(500).json({
        text: "AI ERROR: " + JSON.stringify(data),
      });
    }

    return res.status(200).json({
      text: data.choices[0].message.content,
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      text: "SERVER ERROR: " + error.message,
    });
  }
}
