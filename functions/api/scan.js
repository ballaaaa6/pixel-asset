/**
 * /api/scan — Cloudflare Pages Function
 *
 * Receives one or more base64-encoded financial asset slip images,
 * uses Google Gemini 1.5 Flash with Structured Output (JSON Schema)
 * to extract transaction data, then merges each result as a new lot
 * into the user's portfolio stored in Cloudflare KV (env.PORTFOLIOS).
 *
 * POST /api/scan
 * Headers:
 *   Authorization: Bearer <userId>
 *   Content-Type:  application/json
 * Body: {
 *   images: [{ base64: string, mime: string }],  // 1–10 images per call
 *   geminiKey: string                             // user's Gemini API key
 * }
 *
 * Response: {
 *   results:  [{ index, action, symbol, actual_price, share_amount, timestamp, saved: bool }],
 *   errors:   [{ index, error }]
 * }
 */

// ─── CORS headers ────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type":                 "application/json",
};

// ─── Embedded fallbacks ───
const EMBEDDED_KEYS = [];

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite-preview-06-17",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite"
];

async function callGeminiServerSide(keys, bodyObj, keyIdx = 0, modelIdx = 0) {
  if (keys.length === 0) {
    throw new Error("No Gemini API key is configured.");
  }
  if (keyIdx >= keys.length) {
    throw new Error("Gemini: ทุก API Key และ Model ใช้งานไม่ได้ — กรุณาตรวจสอบ API Key หรือโควตาหมดทุกคีย์");
  }
  if (modelIdx >= GEMINI_MODELS.length) {
    // If all models fail for this key, move to the next key (start with first model)
    return callGeminiServerSide(keys, bodyObj, keyIdx + 1, 0);
  }

  const currentKey = keys[keyIdx];
  const model = GEMINI_MODELS[modelIdx];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(bodyObj),
    });

    if (res.ok) {
      return await res.json();
    }

    const errText = await res.text();
    console.warn(`Gemini API key [index ${keyIdx}] failed for ${model} with status ${res.status}: ${errText}`);

    if (res.status === 429) {
      // Quota / Rate limit exceeded: immediately try next key for the same model
      return callGeminiServerSide(keys, bodyObj, keyIdx + 1, modelIdx);
    }

    // For other errors (like 404), try the next model on the same key
    return callGeminiServerSide(keys, bodyObj, keyIdx, modelIdx + 1);
  } catch (err) {
    console.error(`Gemini fetch error for key [index ${keyIdx}] on ${model}:`, err);
    // On network error, immediately rotate to the next key
    return callGeminiServerSide(keys, bodyObj, keyIdx + 1, modelIdx);
  }
}

// ─── JSON Schema for Structured Output ──────────────────────────────────────
// Gemini will be forced to return EXACTLY these 5 fields — nothing more.
const SLIP_SCHEMA = {
  type: "OBJECT",
  description: "Extracted transaction data from a single financial asset slip.",
  properties: {
    action: {
      type:        "STRING",
      enum:        ["BUY", "SELL"],
      description:
        "Transaction direction. BUY if the user acquired assets (bought, deposited, subscribed). " +
        "SELL if the user disposed of assets (sold, redeemed, withdrew). " +
        "Infer from context: the word/color at the top of the slip, total direction, or balance change.",
    },
    symbol: {
      type:        "STRING",
      description:
        "The ticker / short code of the asset. " +
        "For equities: uppercase Latin letters, e.g. NVDA, AAPL, MSFT, 700, SCB. " +
        "For crypto: uppercase coin code, e.g. BTC, ETH, SOL. " +
        "For mutual funds: fund code as printed. " +
        "Return ONLY the ticker — no exchange suffix, no currency symbol.",
    },
    actual_price: {
      type:        "NUMBER",
      description:
        "Executed price PER UNIT of the asset in the original currency shown on the slip. " +
        "Look for labels such as: Execution Price, Match Price, ราคาที่ได้จริง, ราคาจริง, " +
        "Avg Price, Fill Price, NAV, หน่วยละ, per unit, per share. " +
        "Do NOT use: total value, commission, fee, tax, exchange rate, or net payable amount.",
    },
    share_amount: {
      type:        "NUMBER",
      description:
        "Number of units / shares / coins actually received or sold. " +
        "Look for labels such as: จำนวนหุ้น, จำนวนหน่วย, จำนวนเหรียญ, Volume, Amount, Quantity, Units, Shares. " +
        "May be a long decimal (e.g. 17.5941041). " +
        "Do NOT use monetary amounts (THB/USD totals).",
    },
    timestamp: {
      type:        "STRING",
      description:
        "Date and time when the transaction was COMPLETED / EXECUTED, in ISO 8601 format " +
        "YYYY-MM-DDTHH:MM:SS. " +
        "Look for labels: วันที่สำเร็จ, วันที่ได้จริง, Execution Date, Trade Date, Fill Time, วันที่ส่งคำสั่ง. " +
        "Thai Buddhist Era (BE) year conversion: subtract 543 (e.g. 2568 → 2025, 68 → 2025). " +
        "Thai month abbreviations: ม.ค.=01 ก.พ.=02 มี.ค.=03 เม.ย.=04 พ.ค.=05 มิ.ย.=06 " +
        "ก.ค.=07 ส.ค.=08 ก.ย.=09 ต.ค.=10 พ.ย.=11 ธ.ค.=12. " +
        "If only a date is visible (no time), use T00:00:00. " +
        "Return an empty string if no date information is found at all.",
    },
  },
  required: ["action", "symbol", "actual_price", "share_amount", "timestamp"],
};

// ─── Prompt (broker-agnostic, language-agnostic) ─────────────────────────────
const SYSTEM_PROMPT = `You are a financial data extraction assistant.
You will be shown an image of a financial transaction slip — this could be from any broker, exchange, fund, or platform, in any language.
Your task is to extract exactly the 5 fields defined in the response schema.
Be precise. Do not guess or hallucinate values. If a field cannot be determined from the image, use 0 for numbers and "" for strings.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Clean and validate the raw object returned by Gemini structured output.
 */
function validateSlipData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const action = String(raw.action || "").toUpperCase();
  if (action !== "BUY" && action !== "SELL") return null;

  // Symbol: uppercase alphanumeric + dots/dashes, 1–10 chars
  let symbol = String(raw.symbol || "").trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
  if (!symbol || /^\d+$/.test(symbol)) return null;

  const actual_price  = parseFloat(raw.actual_price)  || 0;
  const share_amount  = parseFloat(raw.share_amount)  || 0;
  if (actual_price <= 0 || share_amount <= 0) return null;

  // Timestamp: ensure it's a plausible ISO string or derive from partial data
  let timestamp = String(raw.timestamp || "").trim();
  // Basic sanity: must contain 4-digit year between 1990–2100
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
 * Matches by symbol (case-insensitive).
 * Recomputes qty and avgCost from all buy lots.
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

    // avgCost = weighted average of positive (BUY) lots only
    const buyLots  = allLots.filter((l) => l.qty > 0);
    const buyQty   = buyLots.reduce((s, l) => s + l.qty, 0);
    const buyCost  = buyLots.reduce((s, l) => s + l.qty * l.price, 0);
    const avgCost  = buyQty > 0 ? buyCost / buyQty : existing.avgCost || 0;

    portfolio[existingIdx] = { ...existing, lots: allLots, qty: totalQty, avgCost };
  } else {
    // New asset entry
    portfolio.push({
      id:       `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol:   slip.symbol,
      name:     slip.symbol,        // caller can enrich later via /api/prices
      category: "stock",            // default; caller can override
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

  const prompt = `You are a precise financial transaction data extractor.
Analyze this financial trade receipt image (typically from the Dime! trading app).
Extract the following fields and return ONLY a raw JSON object matching this schema:
{
  "action": "BUY" or "SELL",
  "symbol": "ticker code (e.g. NVDA, AAPL, BTC, SCB-GOLD)",
  "actual_price": number (executed price per unit/share),
  "share_amount": number (quantity of shares/units/coins traded),
  "timestamp": "ISO 8601 string YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD"
}
Do NOT return markdown (no \`\`\`json), no explanation, and no extra text. Only return raw JSON.`;

  const model = "@cf/meta/llama-3.2-11b-vision-instruct";

  let response;
  try {
    response = await ai.run(model, {
      prompt,
      image: imageBytes,
      max_tokens: 256,
      temperature: 0.0,
    });
  } catch (err) {
    if (err.message && (err.message.includes("license") || err.message.includes("agree") || err.message.includes("Acceptable Use Policy"))) {
      try {
        console.log("Agreeing to Meta license terms for llama-3.2...");
        await ai.run(model, { prompt: "agree" });
        response = await ai.run(model, {
          prompt,
          image: imageBytes,
          max_tokens: 256,
          temperature: 0.0,
        });
      } catch (retryErr) {
        throw new Error(`Workers AI run failed after license agreement: ${retryErr.message}`);
      }
    } else {
      throw new Error(`Workers AI run failed: ${err.message}`);
    }
  }

  const resultText = response?.response || response?.text || "";
  if (!resultText) {
    throw new Error("Empty response from Cloudflare Workers AI");
  }

  try {
    return JSON.parse(resultText.trim());
  } catch (_) {
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_2) {
        throw new Error(`Failed to parse extracted JSON from text: ${resultText.slice(0, 150)}`);
      }
    }
    throw new Error(`Cloudflare AI did not return a valid JSON object: ${resultText.slice(0, 150)}`);
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
    const { images, geminiKey, skipSave } = body;

    const configKeys = String(env.GEMINI_KEYS || "")
      .split(/[\s,;\n\r]+/)
      .map(k => k.trim())
      .filter(Boolean);
    const userKeys = String(geminiKey || "")
      .split(/[\s,;\n\r]+/)
      .map(k => k.trim())
      .filter(Boolean);
    const keys = [...userKeys, ...configKeys, ...EMBEDDED_KEYS];

    const hasWorkersAI = !!env.AI;

    if (keys.length === 0 && !hasWorkersAI) {
      return new Response(
        JSON.stringify({ error: "Gemini API key or Cloudflare Workers AI binding is required" }),
        { status: 400, headers: CORS }
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

    // ── Process each image via Gemini Vision ──────────────────────────────────
    const results = [];
    const errors  = [];

    for (let i = 0; i < images.length; i++) {
      const { base64, mime } = images[i];
      if (!base64 || !mime) {
        errors.push({ index: i, error: "Missing base64 or mime for image" });
        continue;
      }

      try {
        let parsed = null;
        let usedAI = "Gemini Server-Side";

        // Try Gemini first if keys are available
        if (keys.length > 0) {
          try {
            // Build Gemini request with Structured Output (JSON Schema)
            const geminiBody = {
              system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [
                {
                  parts: [
                    { text: "Extract the transaction data from this financial asset slip image." },
                    { inline_data: { mime_type: mime, data: base64 } },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: "application/json",
                response_schema:    SLIP_SCHEMA,
                temperature:        0.0,
                max_output_tokens:  256,
              },
            };

            const geminiData = await callGeminiServerSide(keys, geminiBody);
            const rawText    = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            parsed = JSON.parse(rawText);
          } catch (geminiErr) {
            console.warn(`Server-side Gemini failed, trying Workers AI fallback: ${geminiErr.message}`);
            if (!hasWorkersAI) throw geminiErr;
          }
        }

        // If Gemini was not used or failed, fallback to Workers AI
        if (!parsed && hasWorkersAI) {
          usedAI = "Cloudflare Workers AI (Llama 3.2 Vision)";
          parsed = await callWorkersAIVision(env.AI, base64, mime);
        }

        if (!parsed) {
          throw new Error("Failed to extract data using all available AI engines.");
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

        results.push({ index: i, ...validated, saved: !skipSave, engine: usedAI });

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
