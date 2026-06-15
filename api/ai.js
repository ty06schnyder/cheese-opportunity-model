export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    let prompt = "";  

    // ✅ =========================
    // ✅ MODE 1: METRICS → SCORES
    // ✅ =========================
    if (body.type === "mapping") {
      prompt = `
You are a data processing engine for the U.S. cheese category.

Convert the following business metrics into scores from 1 to 5. Compare all products relative to all the other products on the list as well as just general real world metrics.

Metrics:
${JSON.stringify(body.metrics)}

Criteria:
${body.criteria.join(", ")}

Guidelines:
- ~$15M in sales = strong
- High distribution = high impact AND high competition
- Lower price = easier execution
- High velocity = higher growth
- Use realistic cheese category assumptions
- Use general business rules/best judgement to fill in blanks and match up metrics

Rules:
- Return ONLY raw JSON
- Do NOT explain anything
- Do NOT use markdown

Return ONLY JSON with ALL criteria:

Keys must match exactly:
${body.criteria.join(", ")}

Example:
{
  ${body.criteria.map((c) => `"${c}": number`).join(",")}
}
`;
    }

    // ✅ =========================
    // ✅ MODE 2: INSIGHTS
    // ✅ =========================
    else if (body.type === "insights") {
      prompt = `
You are a strategy consultant.

Analyze these opportunities:

${JSON.stringify(body.opportunities)}

Criteria:
${body.criteria.join(", ")}

Weights:
${JSON.stringify(body.weights)}

IMPORTANT: Format your response EXACTLY like this, with line breaks:

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
- No markdown (** or ###)
- Keep concise and actionable
- Each section must be on its own line
- Add a blank line between sections
- Use bullet points only for "What to Do"
- DO NOT write everything in one paragraph
`;
    }

    // ✅ Safety: missing type
    else {
      return res.status(400).json({
        text: "Invalid request type",
      });
    }

    // ✅ Add timeout protection (prevents hanging forever)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    console.log("AI RESPONSE:", JSON.stringify(data));

    // ✅ Handle API errors safely
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
