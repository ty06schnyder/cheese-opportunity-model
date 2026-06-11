export default async function handler(req, res) {
  try {
    // ✅ Parse request safely (Vercel sometimes needs this)
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { opportunities, criteria, weights } = body;

    // ✅ Build prompt
    const prompt = `
You are a strategy consultant preparing a recommendation for business leadership.

Analyze the following opportunities:

${JSON.stringify(opportunities, null, 2)}

Scoring criteria:
${criteria.join(", ")}

Weights:
${JSON.stringify(weights)}

Your output must follow this EXACT format:

Top Opportunity:
[Name of top opportunity]

Where to Focus:
[1–2 sentences on where to prioritize effort]

What to Do:
- Action 1
- Action 2
- Action 3

Why It Matters:
[2–3 sentences explaining the business impact and reasoning]

Second Priority:
[Name of second best opportunity]

Key Risk:
[1–2 sentences]

Rules:
- Do NOT use any markdown symbols (**, #, etc.)
- Do NOT include headings formatting
- Keep it concise, clear, and executive-ready
- Focus on actionable insights, not descriptions
`;

    // ✅ Call OpenAI (stable + working model)
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o", // 🔥 IMPORTANT FIX (do not change)
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    // ✅ Debug logging (shows in Vercel logs)
    console.log("OPENAI RESPONSE:", JSON.stringify(data, null, 2));

    // ✅ Handle errors gracefully
    if (!data || !data.choices) {
      return res.status(500).json({
        text: "AI ERROR: " + JSON.stringify(data),
      });
    }

    // ✅ Return clean response
    return res.status(200).json({
      text: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("FULL ERROR:", error);

    return res.status(500).json({
      text: "SERVER ERROR: " + error.message,
    });
  }
}
``
