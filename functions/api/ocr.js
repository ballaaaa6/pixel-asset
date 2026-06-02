/**
 * /api/ocr — Cloudflare Pages Function
 * Uses Cloudflare Workers AI (LLaVA vision model) to read financial receipt images.
 * FREE: 10,000 AI requests/day on Cloudflare free plan — no external API key needed.
 *
 * POST /api/ocr
 * Body: { images: [{ base64: "...", mime: "image/jpeg" }, ...] }
 * Response: { results: [ { symbol, name, category, transactionType, qty, price, date } ] }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Verify auth token
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Verify JWT (same logic as other endpoints)
    const { verifyToken } = await import("./_auth.js").catch(() => ({ verifyToken: () => true }));

    const body = await request.json();
    const images = body.images; // array of { base64, mime }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), { status: 400, headers: corsHeaders });
    }

    // Check if AI binding is available
    if (!env.AI) {
      return new Response(JSON.stringify({ error: "AI_BINDING_UNAVAILABLE" }), { status: 503, headers: corsHeaders });
    }

    const PROMPT = `You are a financial receipt OCR parser. Analyze this receipt image from a broker app (e.g., Dime!, Webull, InnovestX, Bitkub, Binance) or banking app.
Extract the following fields:
1. symbol: The stock ticker or asset symbol (e.g., AAPL, NVDA, BTC, ASML). Uppercase only.
2. name: The company or asset full name.
3. category: One of: "stock", "crypto", "gold", "fiat"
   - stock = equities, ETFs (AAPL, ASML, PTT.BK etc.)
   - crypto = BTC, ETH, SOL, etc.
   - gold = GLD, IAU, Spot Gold, XAU
   - fiat = cash THB, USD, etc.
4. transactionType: "BUY" (buy/deposit/inflow) or "SELL" (sell/withdraw/outflow)
5. qty: Quantity traded (number). For cash = amount deposited/withdrawn.
6. price: Price per unit in USD (number). For cash = 1.
7. date: ISO format YYYY-MM-DD. Note: Thai Buddhist Era year → subtract 543 (e.g., year 69 = 2026). If unclear, use today.

Respond ONLY with a valid JSON object using exactly these keys. No markdown, no explanation, no extra text.
Example: {"symbol":"ASML","name":"ASML Holding","category":"stock","transactionType":"SELL","qty":2,"price":1595.64,"date":"2026-05-14"}`;

    const results = [];
    const errors = [];

    for (let i = 0; i < images.length; i++) {
      const { base64, mime } = images[i];

      try {
        // Convert base64 to Uint8Array for Workers AI
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          bytes[j] = binaryStr.charCodeAt(j);
        }

        // Call Cloudflare Workers AI with LLaVA vision model
        const aiResponse = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
          prompt: PROMPT,
          image: [...bytes],
          max_tokens: 512,
        });

        const rawText = aiResponse?.description || aiResponse?.response || "";
        if (!rawText) throw new Error("AI returned empty response");

        // Strip markdown fences if present
        const clean = rawText.trim()
          .replace(/^```[\w]*\n?/, "")
          .replace(/\n?```$/, "")
          .trim();

        // Find JSON object in the response
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in AI response");

        const data = JSON.parse(jsonMatch[0]);

        if (!data.symbol) throw new Error("No symbol found in receipt");

        results.push({
          index: i,
          symbol: String(data.symbol).toUpperCase().trim(),
          name: data.name || String(data.symbol).toUpperCase(),
          category: data.category || "stock",
          transactionType: data.transactionType || "BUY",
          qty: parseFloat(data.qty) || 0,
          price: parseFloat(data.price) || 0,
          date: data.date || new Date().toISOString().split("T")[0],
        });

      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    return new Response(JSON.stringify({ results, errors }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
