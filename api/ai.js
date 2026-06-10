export default async function handler(req, res) {
  try {
    // ✅ Parse request safely (Vercel sometimes needs this)
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { opportunities, criteria, weights } = body;

    // ✅ Build prompt
    const prompt = `
You are a strategy consultant.

Analyze these business opportunities:

${JSON.stringify(opportunities, null, 2)}

Criteria:
${criteria.join(", ")}

Weights:
${JSON.stringify(weights)}

Provide:
1. Top recommendation (and why)
2. Key risk
3. Strategic insight

Keep it concise, structured, and business-focused.
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
