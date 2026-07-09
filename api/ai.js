export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string" //test
        ? JSON.parse(req.body)
        : req.body || {};
    const type = body.type;
    let prompt = "";  

    // ✅ MODE 1: METRICS → SCORES
    // ✅ =========================
    if (body.type === "mapping") {
      prompt = `
You are a data processing engine for the U.S. cheese category.

Convert the following business metrics into scores from 1 to 5. Compare all products relative to all the other products on the list as well as just general real world metrics.

Metrics:
${JSON.stringify(body.metrics, null, 2)}

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

    else if (body.type === "classification") {
      prompt = `
    You are a cheese category classification engine.

    Classify this product into ONE category.
  
    Product:
    ${body.productName}

    Metrics:
    ${JSON.stringify(body.metrics)}

    Possible categories:
    - Gouda
    - Cheddar
    - Parmesan
    - Hispanic
    - Goat
    - Snack Cheese
    - Specialty
    - Other

    Rules:
    - Return ONLY raw JSON
    - No markdown
    - No explanation

    Example:
    {
      "category": "Gouda"
    }
    `;
    }
      
    else if (body.type === "insights") {
      prompt = `

You are a strategy and commercial insights analyst specializing in dairy, cheese, and snacking products.

You may be given a mix of:
- FrieslandCampina products
- Competitor products
- Or both

First, determine what type of analysis is required:

1. If the dataset includes ONLY FrieslandCampina products:
→ Focus on INTERNAL optimization
→ Recommend how Friesland can prioritize, expand, or improve its own portfolio

2. If the dataset includes competitors:
→ Focus on COMPETITIVE advantage
→ Recommend how Friesland can win against competitors

3. If the dataset includes BOTH:
→ Combine both perspectives:
   - how Friesland products compare
   - where Friesland can gain share
   - where to invest or defend

Reference Data:
You are given:
1. A set of cheese products with quantitative performance scores across key criteria (e.g., Growth, Impact, Ease, Competition, Trend).

${JSON.stringify(body.opportunities)}

Criteria:
${body.criteria.join(", ")}

Weights:
${JSON.stringify(body.weights)}

2. A structured overview of FrieslandCampina’s priority brands, including their positioning, heritage, product range, formats, role in the portfolio, and competitive lens.

1. Royal Hollandia®
Positioning: Modern, snackable Dutch cheese brand
Target use cases:
On-the-go snacking
Lunchboxes
Entertaining boards
Formats:
Cubes, snack packs, resealable packs
Recent strategy:
Expansion into entry-price packs to drive trial and accessibility
Role in portfolio:
Key growth engine in snacking/convenience segment
Designed to capture share from:
Babybel (Bel Group)
Sargento Balanced Breaks
Private-label snack cheeses

2. Rembrandt® (formerly “A Dutch Masterpiece”)
Positioning: Premium, artisanal Dutch cheese line
Rebrand: 2026 repositioning to strengthen emotional and premium appeal
Core SKUs:
6-Month Aged Gouda
12-Month PDO Gouda
Robusto (firmer, aged profile)
Goat Gouda
Quality signal:
Award-winning at global cheese competitions
Role in portfolio:
Margin-accretive premium tier
Targets:
Specialty cheese shoppers
Charcuterie/entertaining occasions
Competitive lens:
Directly competes with:
Murray’s / specialty counters
Imported European premium cheeses (Comté, Parmigiano Reggiano)

3. Parrano®
Positioning: Hybrid innovation cheese (Gouda texture × Parmesan flavor)
Product characteristics:
Aged ~5 months
Nutty, savory flavor profile
Easier slicing/melting vs Parmesan
Role in portfolio:
Differentiation platform
Enables FrieslandCampina to:
Compete in Italian-cheese usage occasions
Create a unique subcategory (not purely substitutable)
Competitive lens:
Competes with:
Parmesan, Asiago, Pecorino
Blended grated cheeses

4. Gayo Azul®
Positioning: Hispanic/Latin American cheese line
Key products:
Cotija-style cheese
Fresh and crumbly applications
Strategic importance:
Targets the fast-growing Hispanic dairy segment in the U.S.
Role in portfolio:
Core demographic-driven growth lever
Expands FrieslandCampina beyond European cheese heritage
Competitive lens:
Competes with:
Cacique
El Mexicano
Regional/private-label Hispanic cheeses

5. Melkbus® Truffle
Positioning: Ultra-premium, flavor-forward specialty cheese
Product focus:
Gouda-style cheese infused with truffle
Consumer target:
Foodies
Specialty retail and charcuterie occasions
Key attributes:
High perceived indulgence
Strong differentiation via flavor innovation
Role in portfolio:
Top-tier premium / niche luxury segment
Used to:
Elevate brand perception
Capture high-margin specialty sales
Compete in gourmet retail environments
Competitive lens:
Competes with:
Truffle cheeses from specialty importers
High-end private label gourmet cheeses
European artisanal brands

6. Private Label / Retailer Brands
Scope: FrieslandCampina supplies cheeses sold under retailer-owned brands across the U.S.
Products include:
Gouda (young/aged/flavored)
Edam, Maasdam
Goat and specialty cheeses
Channels:
Grocery chains, club stores, and mass retailers
Role in portfolio:
Critical volume engine
Strengthens retailer partnerships and shelf access
Enables participation across value price tiers
Strategic implications:
Provides hidden market share not visible in branded scans
Balances portfolio economics (volume vs margin)
Defends against competitors owning retailer assortments

Your job is NOT just to describe competitors — your job is to identify how FrieslandCampina can WIN.
You must analyze everything through this lens:
“How can FrieslandCampina use this information to drive growth, win share, or exploit gaps?”
Instructions:

1. Identify where competitors are succeeding (growth, pricing, positioning, format)
2. Detect gaps, weaknesses, or inefficiencies in the market
3. Highlight opportunities that FrieslandCampina can realistically exploit
4. Recommend specific commercial or product actions
5. Connect all insights about competitor's back to Friesland Campina and it's respective brands

Focus on:
- price positioning advantages
- unmet consumer needs
- whitespace in formats (snacking, premium, protein, etc.)
- distribution or accessibility gaps
- over-indexed competition areas to avoid

IMPORTANT: Format your response EXACTLY like this, make sure to follow the rules to a tee:

Output format:

Top Opportunity:
[Describe the most concrete, actionable opportunity for FrieslandCampina]

What We See in the Market:
[Explain what competitors are doing successfully — be specific]

Where Friesland Can Win:
[Explain the strategic advantage FrieslandCampina has]

Recommended Action:
- [Specific action 1]
- [Specific action 2]
- [Specific action 3]

Why This Works:
[Connect back to metrics + market dynamics]

Key Risk:
[What could go wrong or limit success]

Rules:
- Use exact percentages or numbers when discussing the growth of a specific metric
- No markdown (** or ###)
- Keep concise and actionable
- Each section must be on its own line
- Add a blank line between sections
- Use bullet points only for "What to Do"
- DO NOT write everything in one paragraph
`;
    }

else if (body.type === "classification") {
  prompt = `
  Classify the cheese product.

  Product:
  ${body.productName}

  Return JSON:

  {
    "category":"",
    "occasion":"",
    "priceTier":""
  }

Allowed categories:
Gouda
Cheddar
Hispanic (broken into cotija, queso fresco, queso blanco)
Goat
Snack Cheese
Parmesan
Havarti
Brie
Mozzarella
Feta
Blue Cheese
Specialty
Other

Allowed occasions:
Everyday
Snacking
Hosting
Cooking
Holiday

Allowed price tiers:
Value
Mainstream
Premium
Luxury

Return JSON only.
`;
}

else if (body.type === "promotion") {
  if (!body.data || body.data.length === 0) {
    return res.status(400).json({
      text: "No promotion data uploaded.",
    });
  }
  prompt = `
You are a dairy promotion planning expert.

Analyze the following IRI data:

${JSON.stringify(body.data)}

Use ONLY the following events:

Q1
- New Year
- Superbowl
- Easter

Q2
- Memorial Day
- July 4th

Q3
- Back to School
- Labor Day
- Halloween

Q4
- Black Friday
- Christmas

Use FrieslandCampina brands:

- Royal Hollandia (Premium Dutch cheese, known for Gouda and everyday Dutch cheeses. Good for snacking or less fancy events.)
- Rembrandt (Super-premium Dutch brand; known for aged Gouda and specialty cheeses)
- Parrano (Parmesean and gouda mix, not a great melting cheese but known for snacking & charcuterie cheese)
- Gayo Azul (Mainstream Hispanic brand; known for Hispanic cooking cheeses (Queso Blanco, Cotija, etc.), also has a gouda slices product that makes for a great melting cheese)
- Melkbus Truffle (Premium gourmet brand; known for truffle specialty cheese and entertaining occasions.

Determine:

1. Which cheese category should be promoted
2. Which Friesland brand should lead
3. Which event should be targeted
4. Why it is the best opportunity (Cite specific data from the Excel upload when explaining why promoting a certain brand is the best opportunity during that time period.
If no data for any Friesland brands has been uploaded, use the data that has been uploaded, identify what categories the uploaded brands or products fall under, and
compare them to the Friesland brand that best fits that category to eventually form your recomendations for our brands.)

Return ONLY valid JSON.

Format:

[
  {
    "event":"Superbowl",
    "category":"Snack Cheese",
    "brand":"Royal Hollandia",
    "reason":"Strong snack consumption and entertaining occasions drive demand before the Superbowl."
  },
  {
    "event":"Easter",
    "category":"Gouda",
    "brand":"Rembrandt",
    "reason":"Premium entertaining occasions naturally align with aged gouda offerings."
  }
]

Rules:

- Cite specific data from the Excel upload when explaining why promoting a certain brand is the best opportunity during that time period.
  If no data for any Friesland brands has been uploaded, use the data that has been uploaded, identify what categories the uploaded brands or products fall under, and
  compare them to the Friesland brand that best fits that category to eventually form your recomendations for our brands.
- Output ONLY JSON
- No markdown
- No explanation outside JSON
- Use only events listed above
`;
}
  
else if (body.type === "followup") {
  prompt = `
You are a strategic advisor helping analyze CPG product opportunities.

You previously generated the following insights:
${body.previousInsights}

The user has now added more context:
${body.userInput}

Update and refine your recommendations based on this new information.

Instructions:
- Use exact percentages or numbers when discussing the growth of a specific metric
- No markdown (** or ###), don't try to bold text either (do not use asterisk's anywhere in your response)
- Do NOT repeat the original insights word for word
- Modify or improve recommendations based on the new input
- Be specific and actionable
- Consider pricing, positioning, competition, and strategy

Return a refined set of recommendations.
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

    console.log(
      "PROMOTION RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    console.log("AI RESPONSE:", JSON.stringify(data));

    // ✅ Handle API errors safely
    if (!data || !data.choices) {

      console.log(
        "OPENAI RESPONSE:",
        JSON.stringify(data, null, 2)
      );

      return res.status(500).json({
        text: "AI ERROR: " + JSON.stringify(data),
      });
    }

    return res.status(200).json({
      text: data.choices[0].message.content,
    });

  } catch (error) {
    console.error("SERVER ERROR FULL:", error);

    return res.status(500).json({
      text: "SERVER ERROR: " + error.message,
    });
  }
}
