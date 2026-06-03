/**
 * /api/scan — Cloudflare Pages Function (Workers AI Only)
 *
 * Receives one or more base64-encoded financial asset slip images,
 * uses Cloudflare Workers AI (@cf/meta/llama-3.2-11b-vision-instruct)
 * to extract transaction data, and returns the structured results.
 *
 * POST /api/scan
 * Headers:
 *   Authorization: Bearer <userId>
 *   Content-Type:  application/json
 * Body: {
 *   images: [{ base64: string, mime: string }],  // 1–10 images per call
 *   skipSave: boolean                            // true to return results without saving to KV
 * }
 */

// ─── CORS headers ────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type":                 "application/json",
};

// ─── Prompt & Schema Context ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a precise financial transaction data extractor.
Analyze the provided image of a financial trade receipt / slip (typically from the Dime! app by SCB).
Extract the following fields and return ONLY a raw JSON object. Do NOT wrap it in markdown block, do NOT write markdown code blocks, do NOT write explanations.

Schema:
{
  "action": "BUY" or "SELL",
  "symbol": "Asset ticker (e.g. NVDA, AAPL, BTC, SCB-GOLD)",
  "actual_price": number (executed price per share/unit, ignore total value),
  "share_amount": number (number of shares/units/coins traded),
  "timestamp": "ISO 8601 string YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD"
}

Extraction tips:
1. Action: "ซื้อ" -> BUY, "ขาย" -> SELL.
2. Symbol: Look for the ticker near the top after "ซื้อ" or "ขาย".
3. Actual Price: Use the executed price per share (ราคาที่ได้จริง), NOT the set price (ราคาที่คุณตั้ง) and NOT the total payment (ยอดที่ต้องชำระ).
4. Share Amount: Use quantity of shares (จำนวนหุ้น / จำนวนหน่วย / จำนวนเหรียญ).
5. Timestamp: Use the order execution date (วันที่ส่งคำสั่ง). Convert Thai Buddhist Era year (e.g., 68 -> 2025) and Thai months (พ.ค. -> 05).

Return ONLY the raw JSON string. Example output:
{"action":"BUY","symbol":"NVDA","actual_price":130.60,"share_amount":17.5941,"timestamp":"2025-05-23T22:14:00"}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Clean and validate the raw object returned by Workers AI.
 */
function validateSlipData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const action = String(raw.action || "").toUpperCase();
  if (action !== "BUY" && action !== "SELL") return null;

  // Symbol: uppercase alphanumeric + dots/dashes, 1–15 chars
  let symbol = String(raw.symbol || "").trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
  if (!symbol || /^\d+$/.test(symbol)) return null;

  const actual_price  = parseFloat(raw.actual_price)  || 0;
  const share_amount  = parseFloat(raw.share_amount)  || 0;
  if (actual_price <= 0 || share_amount <= 0) return null;

  // Timestamp: ensure it's a plausible ISO string or derive from partial data
  let timestamp = String(raw.timestamp || "").trim();
  if (!/\d{4}/.test(timestamp)) timestamp = "";

  return { action, symbol, actual_price, share_amount, timestamp };
}

/**
 * Parse ISO or partial timestamp into { date: "YYYY-MM-DD", time: "HH:MM" }.
 */
function parseTimestamp(ts) {
  if (!ts) return { date: new Date().toISOString().split("T")[0], time: "" };
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return { date: new Date().toISOString().split("T")[0], time: "" };
    const date = d.toISOString().split("T")[0];
    const hhmm = d.toISOString().split("T")[1].slice(0, 5);
    const time  = hhmm === "00:00" ? "" : hhmm;
    return { date, time };
  } catch {
    return { date: new Date().toISOString().split("T")[0], time: "" };
  }
}

/**
 * Merge a new transaction lot into the portfolio array.
 */
function mergeLotIntoPortfolio(portfolio, slip) {
  const { date, time } = parseTimestamp(slip.timestamp);
  const isSell = slip.action === "SELL";
  const lotQty = isSell ? -Math.abs(slip.share_amount) : Math.abs(slip.share_amount);

  const newLot = {
    id:    `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date,
    time,
    qty:   lotQty,
    price: slip.actual_price,
  };

  const existingIdx = portfolio.findIndex(
    (a) => a.symbol.toUpperCase() === slip.symbol.toUpperCase()
  );

  if (existingIdx >= 0) {
    const existing = portfolio[existingIdx];
    const allLots  = [...(existing.lots || []), newLot];
    const totalQty = allLots.reduce((s, l) => s + l.qty, 0);

    const buyLots  = allLots.filter((l) => l.qty > 0);
    const buyQty   = buyLots.reduce((s, l) => s + l.qty, 0);
    const buyCost  = buyLots.reduce((s, l) => s + l.qty * l.price, 0);
    const avgCost  = buyQty > 0 ? buyCost / buyQty : existing.avgCost || 0;

    portfolio[existingIdx] = { ...existing, lots: allLots, qty: totalQty, avgCost };
  } else {
    portfolio.push({
      id:       `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol:   slip.symbol,
      name:     slip.symbol,
      category: "stock",
      lots:     [newLot],
      qty:      lotQty,
      avgCost:  slip.actual_price,
    });
  }

  return portfolio;
}

/**
 * Call Cloudflare Workers AI Vision Llama-3.2-11b-vision-instruct model.
 */
async function callWorkersAIVision(ai, base64, mime) {
  let binaryString;
  try {
    binaryString = atob(base64);
  } catch (e) {
    throw new Error("Invalid base64 image data");
  }

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const imageBytes = Array.from(bytes);

  const model = "@cf/meta/llama-3.2-11b-vision-instruct";

  let response;
  try {
    response = await ai.run(model, {
      prompt: SYSTEM_PROMPT,
      image: imageBytes,
      max_tokens: 256,
      temperature: 0.0,
      response_format: {
        type: "json_object"
      }
    });
  } catch (err) {
    // If terms of service code 5016, or license consent is required
    if (err.message && (err.message.includes("5016") || err.message.includes("license") || err.message.includes("agree") || err.message.includes("Acceptable Use Policy"))) {
      try {
        console.log("Agreeing to Meta license terms for llama-3.2...");
        try {
          await ai.run(model, { prompt: "agree" });
        } catch (agreeErr) {
          // If the error message is confirmation of agreement, ignore the throw
          if (!agreeErr.message.includes("Thank you for agreeing")) {
            throw agreeErr;
          }
        }
        
        // Wait 1.2 seconds for propagation on Cloudflare global edge
        await new Promise(r => setTimeout(r, 1200));

        // Retry vision generation with JSON mode
        response = await ai.run(model, {
          prompt: SYSTEM_PROMPT,
          image: imageBytes,
          max_tokens: 256,
          temperature: 0.0,
          response_format: {
            type: "json_object"
          }
        });
      } catch (retryErr) {
        throw new Error(`Workers AI run failed after license agreement: ${retryErr.message}`);
      }
    } else {
      throw new Error(`Workers AI run failed: ${err.message}`);
    }
  }

  // Safe resultText string resolution
  let resultText = "";
  if (typeof response === "string") {
    resultText = response;
  } else if (response && typeof response === "object") {
    if (typeof response.response === "string") {
      resultText = response.response;
    } else if (response.response && typeof response.response === "object") {
      resultText = response.response.text || JSON.stringify(response.response);
    } else if (typeof response.text === "string") {
      resultText = response.text;
    } else {
      resultText = JSON.stringify(response);
    }
  }

  if (!resultText) {
    throw new Error("Empty response from Cloudflare Workers AI");
  }

  const jsonMatch = resultText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Cloudflare AI did not return a valid JSON object block: ${resultText.slice(0, 150)}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    throw new Error(`Failed to parse extracted JSON from text: ${parseErr.message} (raw match: ${jsonMatch[0].slice(0, 120)})`);
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const auth = request.headers.get("Authorization") || "";
    const userId = auth.replace("Bearer ", "").trim();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await request.json();
    const { images, skipSave } = body;

    const hasWorkersAI = !!env.AI;
    if (!hasWorkersAI) {
      return new Response(
        JSON.stringify({ error: "Cloudflare Workers AI binding [env.AI] is missing in this project" }),
        { status: 500, headers: CORS }
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "images array is required and must not be empty" }),
        { status: 400, headers: CORS }
      );
    }
    if (images.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 images per request" }),
        { status: 400, headers: CORS }
      );
    }

    // ── Load existing portfolio from KV ───────────────────────────────────────
    const PORTFOLIOS = env.PORTFOLIOS;
    let portfolio = [];
    try {
      const raw = await PORTFOLIOS.get(`portfolio:${userId}`);
      if (raw) portfolio = JSON.parse(raw);
      if (!Array.isArray(portfolio)) portfolio = [];
    } catch {
      portfolio = [];
    }

    // ── Process each image via Workers AI ─────────────────────────────────────
    const results = [];
    const errors  = [];

    for (let i = 0; i < images.length; i++) {
      const { base64, mime } = images[i];
      if (!base64 || !mime) {
        errors.push({ index: i, error: "Missing base64 or mime for image" });
        continue;
      }

      try {
        const parsed = await callWorkersAIVision(env.AI, base64, mime);
        if (!parsed) {
          throw new Error("Failed to extract data using Workers AI.");
        }

        const validated = validateSlipData(parsed);
        if (!validated) {
          throw new Error(
            `Extracted data is incomplete or invalid: ${JSON.stringify(parsed).slice(0, 120)}`
          );
        }

        // Merge into portfolio if not skipping save
        if (!skipSave) {
          portfolio = mergeLotIntoPortfolio(portfolio, validated);
        }

        results.push({ index: i, ...validated, saved: !skipSave, engine: "Cloudflare Workers AI" });

      } catch (imgErr) {
        errors.push({ index: i, error: imgErr.message });
      }
    }

    // ── Persist updated portfolio to KV ───────────────────────────────────────
    if (results.length > 0 && !skipSave) {
      await PORTFOLIOS.put(`portfolio:${userId}`, JSON.stringify(portfolio));
    }

    return new Response(
      JSON.stringify({ results, errors }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: CORS }
    );
  }
}

// ─── CORS preflight ───────────────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
