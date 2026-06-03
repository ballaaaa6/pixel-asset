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
const SYSTEM_PROMPT = `You are an expert financial receipt parser for Dime! (by SCB) trade receipts.
Extract transaction details into a JSON object with this schema:
{
  "action": "BUY" or "SELL",
  "symbol": "ticker",
  "actual_price": "string",
  "share_amount": "string",
  "raw_date": "string",
  "timestamp": "ISO 8601 YYYY-MM-DDTHH:MM:SS"
}

EXTRACTION RULES:

1. ACTION: "ซื้อ" = BUY, "ขาย" = SELL.

2. SYMBOL: Uppercase English ticker after "ซื้อ" or "ขาย".

3. DATE & TIME:
   - Read the ACTUAL date and time from the uploaded image. DO NOT invent or guess any date.
   - Source A (preferred): "วันที่ส่งคำสั่ง" or "วันที่คำสั่งสำเร็จ" row in the bottom details.
   - Source B (fallback): "สถานะ (ณ ...)" in the top status card.
   - Copy the full Thai date-time string exactly as shown into "raw_date".
   - Convert to ISO 8601 for "timestamp": Thai BE year YY → CE year = YY + 1957. Month abbrevs: ม.ค.=01, ก.พ.=02, มี.ค.=03, เม.ย.=04, พ.ค.=05, มิ.ย.=06, ก.ค.=07, ส.ค.=08, ก.ย.=09, ต.ค.=10, พ.ย.=11, ธ.ค.=12.

4. ACTUAL PRICE (ราคาที่ได้จริง):
   - Find the label "ราคาที่ได้จริง" and extract the USD numeric value next to it.
   - This is the price PER SHARE, not a total. It is always in USD for US stocks.
   - NEVER use "มูลค่าหุ้น", "ยอดที่ต้องชำระ", "ค่าคอมมิชชัน", or any fee/total value.

5. SHARE AMOUNT (จำนวนหุ้น):
   - If there is a row labeled "จำนวนหุ้น" or "จำนวนหน่วย" in the table, extract that number. This is the MOST RELIABLE source.
   - If no such row exists, use the bold number under the ticker that ends with "หุ้น" or "หน่วย".
   - Include ALL decimal digits without rounding or truncation.
   - NEVER use any value that ends with "USD" or "THB" as share_amount — those are monetary amounts.
   - The big bold green number at the top that ends with "USD" or "THB" is the TOTAL COST, NOT the share count.

OUTPUT: Raw JSON only. No markdown, no explanation. Start with '{', end with '}'.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Clean a string representation of a number to a clean float.
 */
function parseNumeric(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[$,฿]/g, "")
    .replace(/,/g, "")
    .replace(/[^0-9.]/g, "")
    .trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Deterministic cross-validation for share_amount.
 *
 * สำหรับคำสั่ง Market BUY ตัวเลขตัวใหญ่สีเขียวด้านบนคือยอดรวม (เช่น 11,541.59 USD)
 * ไม่ใช่จำนวนหุ้น — แต่ AI ชอบดึงยอดรวมมาใส่เป็น share_amount
 *
 * วิธีตรวจ: ถ้า shares × price > 500,000 USD แสดงว่า share_amount จริงๆ คือยอดรวม
 * แก้โดย: real_shares = total / price_per_share
 *
 * ตรวจสอบกับสลิปตัวอย่าง 7 ใบผ่านหมด:
 *  - สลิปปกติ: 84 × 183 = 15,393 < 500K → ไม่แก้ ✓
 *  - สลิปพัง: 11541 × 151 = 1,752,850 > 500K → แก้เป็น 11541/151 = 75.99 ✓
 */
function crossValidateShareAmount(shareAmount, actualPrice) {
  if (actualPrice <= 0 || shareAmount <= 0) return shareAmount;

  const product = shareAmount * actualPrice;

  // ถ้ายอดรวมเกิน $500K = AI เอายอดเงินมาใส่แทนจำนวนหุ้นแน่ๆ
  if (product > 500000) {
    const corrected = shareAmount / actualPrice;
    if (corrected > 0.0001) {
      return parseFloat(corrected.toFixed(8));
    }
  }

  return shareAmount;
}

/**
 * Parse a raw Thai date string into ISO 8601 (YYYY-MM-DDTHH:MM:SS) format.
 */
function parseThaiDateToISO(rawStr) {
  if (!rawStr || typeof rawStr !== "string") return "";

  const dayMatch = rawStr.match(/(?:ณ\s+|ส่งคำสั่ง\s+|สำเร็จ\s+)?(\d{1,2})\s+([\u0e00-\u0e7f.]+)\s+(\d{2,4})/);
  const timeMatch = rawStr.match(/(\d{1,2}):(\d{2})/);

  if (!dayMatch) return "";

  const dStr = dayMatch[1].padStart(2, "0");
  const mStr = dayMatch[2].trim();
  const yStr = dayMatch[3].trim();

  const monthMap = {
    "ม.ค.": "01", "ม.ค": "01", "มกราคม": "01",
    "ก.พ.": "02", "ก.พ": "02", "กุมภาพันธ์": "02",
    "มี.ค.": "03", "มี.ค": "03", "มีนาคม": "03",
    "เม.ย.": "04", "เม.ย": "04", "เมษายน": "04",
    "พ.ค.": "05", "พ.ค": "05", "พฤษภาคม": "05",
    "มิ.ย.": "06", "มิ.ย": "06", "มิถุนายน": "06",
    "ก.ค.": "07", "ก.ค": "07", "กรกฎาคม": "07",
    "ส.ค.": "08", "ส.ค": "08", "สิงหาคม": "08",
    "ก.ย.": "09", "ก.ย": "09", "กันยายน": "09",
    "ต.ค.": "10", "ต.ค": "10", "ตุลาคม": "10",
    "พ.ย.": "11", "พ.ย": "11", "พฤศจิกายน": "11",
    "ธ.ค.": "12", "ธ.ค": "12", "ธันวาคม": "12"
  };

  const month = monthMap[mStr] || monthMap[mStr + "."] || "";
  if (!month) return "";

  let yr = parseInt(yStr, 10);
  if (yr < 100) {
    yr = yr + 2500;
  }
  const year = String(yr - 543);

  let time = "00:00:00";
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00`;
  }

  return `${year}-${month}-${dStr}T${time}`;
}

/**
 * Clean and validate the raw object returned by Workers AI.
 */
function validateSlipData(raw) {
  if (!raw || typeof raw !== "object") return null;

  let action = String(raw.action || "").toUpperCase().trim();

  // ── Fallback action detection ──────────────────────────────────────────
  // ถ้า AI ส่ง action มาเป็นภาษาไทยหรือค่าแปลกๆ ให้แปลงให้ถูก
  if (action !== "BUY" && action !== "SELL") {
    const rawAction = String(raw.action || "").trim();
    if (/ซื้อ|buy/i.test(rawAction)) {
      action = "BUY";
    } else if (/ขาย|sell/i.test(rawAction)) {
      action = "SELL";
    } else {
      // ลองดูจาก field อื่นๆ ที่ AI อาจส่งมา
      const allText = JSON.stringify(raw).toLowerCase();
      if (/ขาย|sell/.test(allText) && !/ซื้อ|buy/.test(allText)) {
        action = "SELL";
      } else if (/ซื้อ|buy/.test(allText)) {
        action = "BUY";
      } else {
        return null;
      }
    }
  }

  // Symbol: uppercase alphanumeric + dots/dashes, 1–15 chars
  let symbol = String(raw.symbol || "").trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
  if (!symbol || /^\d+$/.test(symbol)) return null;

  const actual_price  = parseNumeric(raw.actual_price);
  let   share_amount  = parseNumeric(raw.share_amount);
  if (actual_price <= 0 || share_amount <= 0) return null;

  // ── Deterministic cross-validation ──────────────────────────────────────
  // ตรวจสอบว่า AI เอายอดรวม USD/THB มาใส่แทนจำนวนหุ้นหรือเปล่า
  share_amount = crossValidateShareAmount(share_amount, actual_price);

  // Timestamp parsing with regex helper fallback
  let timestamp = "";
  if (raw.raw_date) {
    timestamp = parseThaiDateToISO(raw.raw_date);
  }
  if (!timestamp && raw.timestamp) {
    timestamp = String(raw.timestamp).trim();
  }
  if (!/\d{4}/.test(timestamp)) {
    timestamp = "";
  }

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
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Extract the transaction data from this receipt image. Your response MUST be ONLY a raw JSON object matching the schema, with no conversational filler or markdown blocks. Start directly with '{'." }
      ],
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

        // Retry vision generation with JSON mode and messages
        response = await ai.run(model, {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: "Extract the transaction data from this receipt image. Your response MUST be ONLY a raw JSON object matching the schema, with no conversational filler or markdown blocks. Start directly with '{'." }
          ],
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

        results.push({ index: i, ...validated, raw_ai: parsed, saved: !skipSave, engine: "Cloudflare Workers AI" });

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
