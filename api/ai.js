export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    let prompt = "";

    if (body.type === "mapping") {
      prompt =
        "Convert these metrics into 1-5 scores for Growth, Impact, Ease, Competition, Trend. Return ONLY JSON: " +
        JSON.stringify(body.metrics);
    } else if (body.type === "insights") {
      prompt =
        "Analyze these opportunities and give top recommendation, actions, and risk: " +
        JSON.stringify(body.opportunities);
    } else {
      return res.status(400).json({ text: "Invalid type" });
    }

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
        }),
      }
    );

    const data = await response.json();

    if (!data.choices) {
      return res.status(500).json({
        text: "AI ERROR: " + JSON.stringify(data),
      });
    }

    res.status(200).json({ text: data.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ text: "Server error: " + e.message });
  }
}
