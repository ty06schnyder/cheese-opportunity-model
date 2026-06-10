export default async function handler(req, res) {
  try {
    const { opportunities, criteria, weights } = req.body;

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

Keep it concise, professional, and business-focused.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    res.status(200).json({
      text: data.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong", details: error });
  }
}
