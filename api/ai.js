export default async function handler(req, res) {
  try {
    // ✅ Safe body parsing
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    let prompt = "";

    // ✅ MAPPING MODE (metrics → scores)
    if (body.type === "mapping") {
      ```js
prompt = `
You are a data processing engine.

Convert these business metrics into scores from 1 to 5.

Metrics:
${JSON.stringify(body.metrics)}

Criteria:
${body.criteria.join(", ")}

Rules:
- Return ONLY raw JSON
- Do NOT include text before or after
- Do NOT use markdown formatting
- Do NOT explain anything


    // ✅ INSIGHTS MODE
    else if (body.type === "insights") {
      prompt = `
You are a strategy consultant.

Analyze these opportunities:

${JSON.stringify(body.opportunities, null, 2)}

Criteria:
${body.criteria.join(", ")}

Weights:
${JSON.stringify(body.weights)}

Output EXACTLY this format:

Top Opportunity:
[Name]

Where to Focus:
[1-2 sentences]

What to Do:
- Action 1
- Action 2
- Action 3

Why It Matters:
[2-3 sentences]

Second Priority:
[Name]

Key Risk:
[1-2 sentences]

Rules:
- No markdown symbols
- Keep concise
`;
    } else {
      return res.status(400).json({
        text: "Missing or invalid request type",
      });
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

    // ✅ Fail safely if API errors
    if (!data || !data.choices) {
      console.error("OpenAI error:", data);
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
