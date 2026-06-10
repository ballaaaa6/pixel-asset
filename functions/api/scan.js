/**
 * /api/scan — Cloudflare Pages Function (Workers AI Only)
 *
 * Receives one or more base64-encoded financial asset slip images,
 * uses Cloudflare Workers AI (@cf/google/gemma-4-26b-a4b-it)
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
const SYSTEM_PROMPT = `You are an expert OCR transcription tool for Dime! (by SCB) and Webull Thailand trading receipts.
Your task is to transcribe specific text fields from the receipt image.
Extract the data into a JSON object with the following fields. Do not translate the text, just transcribe exactly what is visible on the image:

{
  "header_text": "The transaction type and ticker (e.g. 'ซื้อ NVDA', 'ขาย NVDA' for Dime; or 'ซื้อ RKLB', 'ขาย RKLB' for Webull based on 'คำสั่ง' value)",
  "header_color": "The color of the main header text or transaction badge (either 'green' for buy or 'red/pink/purple' for sell)",
  "status_text": "The status section text near the top (e.g. 'จับคู่แล้ว', 'สำเร็จ', 'Filled')",
  "bold_amount": "The main bold quantity or value (e.g. '11,541.59 USD', '60 หุ้น'). For Webull, use the number next to 'จำนวนทั้งหมด' (e.g. '85')",
  "symbol": "The uppercase stock ticker symbol (e.g. 'NVDA', 'RKLB')",
  "actual_price": "The executed price per share. For Dime: under 'ราคาที่ได้จริง'. For Webull: next to 'ราคาเฉลี่ย' (e.g. 'US$45.70' or '45.70')",
  "stock_value": "The total stock value. For Dime: next to 'มูลค่าหุ้น'. For Webull: calculate as qty * actual_price",
  "qty_table": "For Dime: next to 'จำนวนหุ้น'/'จำนวนหน่วย'. For Webull: the number next to 'จำนวนทั้งหมด' or 'จำนวนที่จับคู่แล้ว' (e.g. '85')",
  "exchange_rate": "The exchange rate if visible (e.g. '1 USD = 32.64 THB' → '32.64', return 'N/A' if not visible)",
  "order_type": "The order type: 'Market' or 'Limit' (For Webull, 'กำหนดราคา' is 'Limit')",
  "raw_date": "The date-time string. For Dime: next to 'วันที่ส่งคำสั่ง'. For Webull: next to 'คำสั่งถูกจับคู่สำเร็จ' (e.g. '11/08/2025 13:36:05 EDT')",
  "broker": "The broker name if visible or identifiable from the receipt layout (e.g. 'Dime!' or 'Webull' or 'Webull Thailand')",
  "webull_order_type": "For Webull slips, transcribe the exact value next to the label 'คำสั่ง' (e.g. 'ซื้อ' or 'ขาย'). Return 'N/A' if not a Webull slip.",
  "has_received_cash_back_label": true or false, indicating if a sell-related label like 'ยอดที่จะได้รับคืน' or 'เงินค่าขายคืน' or a 'ขาย' (sell) order is present,
  "has_payment_amount_label": true or false, indicating if a buy-related label like 'ยอดที่ต้องชำระ' or 'ซื้อ' (buy) order is present
}

CRITICAL TRANSCRIPTION DIRECTIONS:
1. DATE ACCURACY: Look extremely closely at the date and month. For Webull, dates are formatted as DD/MM/YYYY (e.g. 11/08/2025). Transcribe exactly what is visible in the raw_date.
2. NO CALCULATION OR MATH: Do NOT perform any mathematical division or calculation yourself. Transcribe the exact numbers visible in the image.
3. RECEIPT LAYOUT TYPES: Understand both Dime! and Webull Thailand layouts.
4. NO FILLER: Output Raw JSON only. No markdown, no explanation. Start with '{', end with '}'.`;

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

function parseWebullDateTimeToThaiISO(rawStr) {
  if (!rawStr) return null;
  const match = rawStr.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+([A-Z]{3,4})/i);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);
  const tz = match[7].toUpperCase();

  let offsetHours = -5; // Default to EST
  if (tz === "EDT") offsetHours = -4;
  else if (tz === "EST") offsetHours = -5;
  else if (tz === "ICT" || tz === "THA") offsetHours = 7;
  else if (tz === "UTC" || tz === "GMT") offsetHours = 0;

  const utcDate = new Date(Date.UTC(year, month, day, hour - offsetHours, minute, second));
  const thaiDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));

  const yyyy = thaiDate.getUTCFullYear();
  const mm = String(thaiDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(thaiDate.getUTCDate()).padStart(2, "0");
  const hh = String(thaiDate.getUTCHours()).padStart(2, "0");
  const min = String(thaiDate.getUTCMinutes()).padStart(2, "0");
  const sec = String(thaiDate.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
}

/**
 * Parse a raw Thai date string into ISO 8601 (YYYY-MM-DDTHH:MM:SS) format.
 */
function parseThaiDateToISO(rawStr) {
  if (!rawStr || typeof rawStr !== "string") return "";

  const webullISO = parseWebullDateTimeToThaiISO(rawStr);
  if (webullISO) return webullISO;

  // 1. Try to match Thai Date layout with explicit months: e.g. "22 ก.ค. 68" or "22 ก.ค. 2025" or "22ก.ค.68"
  const dayMatch = rawStr.match(/(?:ณ\s+|ส่งคำสั่ง\s+|สำเร็จ\s+)?(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|ม\.ค|ก\.พ|มี\.ค|เม\.ย|พ\.ค|มิ\.ย|ก\.ค|ส\.ค|ก\.ย|ต\.ค|พ\.ย|ธ\.ค|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{2,4})/);
  const timeMatch = rawStr.match(/(\d{1,2}):(\d{2})/);

  let year = "";
  let month = "";
  let dStr = "";

  if (dayMatch) {
    dStr = dayMatch[1].padStart(2, "0");
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

    month = monthMap[mStr] || monthMap[mStr + "."] || "";
    if (month) {
      let yr = parseInt(yStr, 10);
      if (yr < 100) {
        // Assume BE year e.g. 68 -> BE 2568 -> CE 2025
        yr = yr + 2500;
        year = String(yr - 543);
      } else if (yr > 2400) {
        // 4-digit BE year (e.g. 2568 -> CE 2025)
        year = String(yr - 543);
      } else {
        // Already 4-digit CE year (e.g. 2025)
        year = String(yr);
      }
    }
  }

  // Fallbacks: If Thai parsing didn't work, try standard date-time string regex matching
  if (!year || !month || !dStr) {
    // Check YYYY-MM-DD
    const isoMatch = rawStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      year = isoMatch[1];
      month = isoMatch[2].padStart(2, "0");
      dStr = isoMatch[3].padStart(2, "0");
    } else {
      // Check DD/MM/YYYY (CE or BE)
      const ddmmMatch = rawStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
      if (ddmmMatch) {
        dStr = ddmmMatch[1].padStart(2, "0");
        month = ddmmMatch[2].padStart(2, "0");
        let yr = parseInt(ddmmMatch[3], 10);
        if (yr < 100) yr += 2000;
        if (yr > 2400) yr -= 543;
        year = String(yr);
      }
    }
  }

  if (!year || !month || !dStr) return "";

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

  // 1. Determine Action (BUY or SELL) using a voting/heuristic system
  let action = "";
  const header = String(raw.header_text || "").toLowerCase();
  const status = String(raw.status_text || "").toLowerCase();
  const bold = String(raw.bold_amount || "").toLowerCase();
  const color = String(raw.header_color || "").toLowerCase();
  const allText = JSON.stringify(raw).toLowerCase();

  // Heuristic 1.0: Check Webull explicit order type
  const webullOrder = String(raw.webull_order_type || "").toLowerCase();
  if (webullOrder.includes("ซื้อ") || webullOrder.includes("buy")) {
    action = "BUY";
  } else if (webullOrder.includes("ขาย") || webullOrder.includes("sell")) {
    action = "SELL";
  }

  // Heuristic 1.1: Check the explicit boolean labels from receipt contents (highly reliable)
  const hasCashBack = raw.has_received_cash_back_label === true || raw.has_received_cash_back_label === "true";
  const hasPayment = raw.has_payment_amount_label === true || raw.has_payment_amount_label === "true";

  if (hasCashBack && !hasPayment) {
    action = "SELL";
  } else if (hasPayment && !hasCashBack) {
    action = "BUY";
  }

  // Heuristic 1.2: Check header_color (very reliable indicator of green vs red/pink)
  if (!action) {
    if (color.includes("red") || color.includes("pink") || color.includes("purple")) {
      action = "SELL";
    } else if (color.includes("green")) {
      action = "BUY";
    }
  }

  // Heuristic 1.3: Check header_text
  if (!action) {
    if (header.includes("ซื้อ") || header.includes("buy")) {
      action = "BUY";
    } else if (header.includes("ขาย") || header.includes("sell")) {
      action = "SELL";
    }
  }

  // Heuristic 1.4: Check status_text
  if (!action) {
    if (status.includes("ขายคืน") || status.includes("รับเงินค่าขาย")) {
      action = "SELL";
    } else if (status.includes("ซื้อ") || status.includes("รับหุ้น") || status.includes("จับคู่")) {
      action = "BUY";
    }
  }

  // Heuristic 1.5: Check bold_amount format
  if (!action) {
    if (bold.includes("หุ้น") || bold.includes("หน่วย")) {
      action = "SELL";
    } else if (bold.includes("usd") || bold.includes("฿") || bold.includes("thb")) {
      action = "BUY";
    }
  }

  // Heuristic 1.6: Check general text fallback
  if (!action) {
    if (allText.includes("ขายคืน") || allText.includes("ขาย") || allText.includes("sell") || allText.includes("ยอดที่จะได้รับคืน")) {
      action = "SELL";
    } else if (allText.includes("ซื้อ") || allText.includes("buy") || allText.includes("จับคู่") || allText.includes("ยอดที่ต้องชำระ")) {
      action = "BUY";
    } else {
      action = "BUY"; // Default
    }
  }

  // Heuristic 1.7: Explicit Webull Thailand check
  let broker = String(raw.broker || "").trim();
  const isWebull = broker.toLowerCase().includes("webull") || allText.includes("webull");
  if (isWebull) {
    broker = "Webull";
  } else {
    broker = "Dime!";
  }

  // 2. Parse Symbol
  let symbol = String(raw.symbol || "").trim().toUpperCase();
  if (!symbol && header) {
    const match = header.match(/(?:ซื้อ|ขาย|buy|sell)\s*([A-Z0-9.\-]+)/i);
    if (match) {
      symbol = match[1].toUpperCase();
    }
  }
  symbol = symbol.replace(/[^A-Z0-9.\-]/g, "");
  if (!symbol || /^\d+$/.test(symbol)) return null;

  // 3. Clean and parse numbers
  const price = parseNumeric(raw.actual_price);
  const stockValue = parseNumeric(raw.stock_value);
  const qtyTable = parseNumeric(raw.qty_table);
  const boldNum = parseNumeric(raw.bold_amount);
  const boldText = String(raw.bold_amount || "").toLowerCase();

  // Resolve exchange rate if available (from AI or fallback)
  let exchangeRate = 0;
  if (raw.exchange_rate && raw.exchange_rate !== "N/A") {
    const rateMatch = String(raw.exchange_rate).match(/(\d{2,3}(?:\.\d+)?)/);
    if (rateMatch) {
      exchangeRate = parseFloat(rateMatch[1]);
    }
  }

  // Check currency in bold_amount, stock_value, header_text, and status_text
  const boldStr = String(raw.bold_amount || "").toLowerCase();
  const valueStr = String(raw.stock_value || "").toLowerCase();
  const headerStr = String(raw.header_text || "").toLowerCase();
  const statusStr = String(raw.status_text || "").toLowerCase();
  const hasTHBUnit = boldStr.includes("บาท") || boldStr.includes("thb") || boldStr.includes("฿") ||
                     valueStr.includes("บาท") || valueStr.includes("thb") || valueStr.includes("฿") ||
                     headerStr.includes("บาท") || headerStr.includes("thb") ||
                     statusStr.includes("บาท") || statusStr.includes("thb") ||
                     exchangeRate > 0;

  if (price <= 0) return null;

  // ─── 4. Resolve Quantity (share_amount) ───
  let share_amount = 0;

  if (isWebull) {
    // Webull slips explicitly list qty in qty_table or bold_amount
    share_amount = qtyTable > 0 ? qtyTable : (boldNum > 0 ? boldNum : 0);
  } else {
    // Dime! fractional/whole logic
    const isBoldUnitCount = boldText.includes("หุ้น") || boldText.includes("หน่วย") || boldText.includes("share") || boldText.includes("unit");

    if (isBoldUnitCount && boldNum > 0) {
      share_amount = boldNum;
    } else {
      const rate = exchangeRate > 0 ? exchangeRate : 35.0;
      const stockValueUsd = stockValue > 0 ? (hasTHBUnit ? stockValue / rate : stockValue) : 0;

      let expectedQty = 0;
      if (price > 0 && stockValueUsd > 0) {
        expectedQty = stockValueUsd / price;
      }

      const rawQtyStr = String(raw.qty_table || "").trim();
      const decimalPart = rawQtyStr.split(".")[1] || "";
      const decimalCount = decimalPart.length;

      if (qtyTable > 0 && decimalCount >= 5) {
        share_amount = qtyTable;
      } else if (qtyTable > 0 && expectedQty > 0) {
        const diffPercent = Math.abs(qtyTable - expectedQty) / expectedQty;
        if (diffPercent < 0.15) {
          share_amount = qtyTable;
        } else {
          share_amount = expectedQty;
        }
      } else if (expectedQty > 0) {
        share_amount = expectedQty;
      } else if (qtyTable > 0) {
        share_amount = qtyTable;
      } else if (boldNum > 0 && price > 0) {
        const computedBoldUsd = hasTHBUnit ? boldNum / rate : boldNum;
        share_amount = computedBoldUsd / price;
      }
    }

    // Final safety cross-check for Dime!
    if (share_amount > 0 && price > 0) {
      const impliedTotal = share_amount * price;
      const rate = exchangeRate > 0 ? exchangeRate : 35.0;
      const stockValueUsd = stockValue > 0 ? (hasTHBUnit ? stockValue / rate : stockValue) : 0;

      if (stockValueUsd > 0) {
        if (impliedTotal > stockValueUsd * 3) {
          const corrected = stockValueUsd / price;
          if (corrected > 0.0001) {
            share_amount = corrected;
          }
        }
      } else if (impliedTotal > 500000) {
        const corrected = share_amount / price;
        if (corrected > 0.0001) {
          share_amount = corrected;
        }
      }
    }
  }

  if (share_amount > 0) {
    share_amount = parseFloat(share_amount.toFixed(8));
  }

  if (share_amount <= 0) return null;

  // 5. Parse Date / Timestamp
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

  return { action, symbol, actual_price: price, share_amount, timestamp, broker };
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
 * Call Cloudflare Workers AI Vision google/gemma-4-26b-a4b-it model with fallback and model-specific image formatting.
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

  const primaryModel = "@cf/google/gemma-4-26b-a4b-it";
  const backupModel = "@cf/meta/llama-3.2-11b-vision-instruct";

  // Helper to run a model with its correct signature
  async function runModel(modelName, maxTokens) {
    if (modelName === "@cf/google/gemma-4-26b-a4b-it") {
      // Gemma 4 uses OpenAI-compatible multimodal messages array format
      return await ai.run(modelName, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the transaction data from this receipt image. Your response MUST be ONLY a raw JSON object matching the schema, with no conversational filler or markdown blocks. Start directly with '{'." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
            ]
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.0,
        thinking: false,
        chat_template_kwargs: {
          enable_thinking: false
        },
        response_format: {
          type: "json_object"
        }
      });
    } else {
      // Llama 3.2 Vision uses the top-level image property (Uint8Array)
      return await ai.run(modelName, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Extract the transaction data from this receipt image. Your response MUST be ONLY a raw JSON object matching the schema, with no conversational filler or markdown blocks. Start directly with '{'." }
        ],
        image: imageBytes,
        max_tokens: maxTokens,
        temperature: 0.0,
        response_format: {
          type: "json_object"
        }
      });
    }
  }

  // Parse text response, supporting both OpenAI choices array and legacy formats
  function parseTextResponse(res) {
    let resultText = "";
    if (typeof res === "string") {
      resultText = res;
    } else if (res && typeof res === "object") {
      // Check for OpenAI compatible chat completion format choices
      if (Array.isArray(res.choices) && res.choices.length > 0) {
        const choice = res.choices[0];
        if (choice.message && typeof choice.message.content === "string") {
          resultText = choice.message.content;
        } else if (typeof choice.text === "string") {
          resultText = choice.text;
        }
      }
      
      // Legacy or custom formats fallback
      if (!resultText) {
        if (typeof res.response === "string") {
          resultText = res.response;
        } else if (res.response && typeof res.response === "object") {
          resultText = res.response.text || JSON.stringify(res.response);
        } else if (typeof res.text === "string") {
          resultText = res.text;
        } else {
          resultText = JSON.stringify(res);
        }
      }
    }
    return resultText;
  }

  let response;
  let usedModel = primaryModel;
  let parsedJson = null;

  // 1. Try Primary Model (Gemma 4)
  try {
    console.log(`Trying primary model: ${primaryModel}`);
    response = await runModel(primaryModel, 2048);
  } catch (err) {
    // If license agreement error
    if (err.message && (err.message.includes("5016") || err.message.includes("license") || err.message.includes("agree") || err.message.includes("Acceptable Use Policy"))) {
      try {
        console.log(`Agreeing to terms for model: ${primaryModel}`);
        try {
          await ai.run(primaryModel, { prompt: "agree" });
        } catch (agreeErr) {
          if (!agreeErr.message.includes("Thank you for agreeing")) {
            throw agreeErr;
          }
        }
        await new Promise(r => setTimeout(r, 1200));
        response = await runModel(primaryModel, 2048);
      } catch (retryErr) {
        console.warn(`Primary model failed after license agreement: ${retryErr.message}. Falling back to backup.`);
        response = null;
      }
    } else {
      console.warn(`Primary model failed with error: ${err.message}. Falling back to backup.`);
      response = null;
    }
  }

  // 2. Parse Primary Model Response
  if (response) {
    try {
      const txt = parseTextResponse(response);
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        parsedJson = JSON.parse(match[0]);
        // Schema check: verify that this is not a wrapper object and contains expected fields
        if (!parsedJson.bold_amount && !parsedJson.symbol && !parsedJson.actual_price) {
          console.warn("Primary model returned JSON but it doesn't match expected receipt schema fields. Falling back.");
          parsedJson = null;
        }
      }
    } catch (parseErr) {
      console.warn(`Failed to parse or validate JSON from primary model: ${parseErr.message}. Falling back.`);
      parsedJson = null;
    }
  }

  // 3. Fallback to Backup Model (Llama 3.2 Vision)
  if (!parsedJson) {
    console.log(`Primary model failed or returned invalid data. Running backup model: ${backupModel}`);
    usedModel = backupModel;
    try {
      response = await runModel(backupModel, 512);
    } catch (err) {
      if (err.message && (err.message.includes("5016") || err.message.includes("license") || err.message.includes("agree") || err.message.includes("Acceptable Use Policy"))) {
        try {
          console.log(`Agreeing to terms for model: ${backupModel}`);
          try {
            await ai.run(backupModel, { prompt: "agree" });
          } catch (agreeErr) {
            if (!agreeErr.message.includes("Thank you for agreeing")) {
              throw agreeErr;
            }
          }
          await new Promise(r => setTimeout(r, 1200));
          response = await runModel(backupModel, 512);
        } catch (retryErr) {
          throw new Error(`Backup model run failed after license agreement: ${retryErr.message}`);
        }
      } else {
        throw new Error(`Backup model run failed: ${err.message}`);
      }
    }

    const txt = parseTextResponse(response);
    const match = txt.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Backup model did not return a valid JSON object block: ${txt.slice(0, 150)}`);
    }

    try {
      parsedJson = JSON.parse(match[0]);
    } catch (parseErr) {
      throw new Error(`Failed to parse extracted JSON from backup model text: ${parseErr.message}`);
    }
  }

  // Add metadata for debugging/logging
  if (parsedJson) {
    parsedJson._debug_model = usedModel;
  }

  return parsedJson;
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
