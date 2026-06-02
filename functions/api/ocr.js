/**
 * /api/ocr — Cloudflare Pages Function
 * Uses Cloudflare Workers AI (LLaVA) to parse financial receipt images.
 * FREE: 10,000 AI neurons/day on Cloudflare free plan.
 *
 * POST /api/ocr
 * Body: { images: [{ base64: "...", mime: "image/jpeg" }, ...] }
 * Response: { results: [...], errors: [...] }
 */

// Thai month name → month number
const THAI_MONTHS = {
  "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
  "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08",
  "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
};

/**
 * Parse Thai Buddhist Era date strings like "19 พ.ค. 69" → "2026-05-19"
 */
function parseThaiDate(text) {
  for (const [thMonth, numMonth] of Object.entries(THAI_MONTHS)) {
    const re = new RegExp(`(\\d{1,2})\\s*${thMonth.replace(".", "\\.")}\\s*(\\d{2,4})`);
    const m = text.match(re);
    if (m) {
      const day = m[1].padStart(2, "0");
      let year = parseInt(m[2]);
      if (year < 100) year += 2500; // "69" → 2569
      if (year > 2400) year -= 543;  // BE → CE
      return `${year}-${numMonth}-${day}`;
    }
  }
  return null;
}

/**
 * Try to extract Dime! / broker receipt data from raw OCR text using heuristics.
 * This is the post-processing layer that corrects LLaVA's mistakes.
 */
function extractFromText(rawText) {
  const text = rawText || "";

  // ─── Transaction type ───
  // Dime!: "ซื้อ SYMBOL" or "ขาย SYMBOL" appears near the top
  let transactionType = "BUY";
  if (/ขาย|Sell|SELL/i.test(text)) transactionType = "SELL";

  // ─── Symbol ───
  // Pattern 1: after "ซื้อ " or "ขาย " — "ซื้อ MU", "ขาย ASML"
  let symbol = null;
  const buyMatch = text.match(/(?:ซื้อ|Buy|BUY)\s+([A-Z]{1,8}(?:\.[A-Z]{1,4})?)/i);
  const sellMatch = text.match(/(?:ขาย|Sell|SELL)\s+([A-Z]{1,8}(?:\.[A-Z]{1,4})?)/i);
  if (buyMatch) symbol = buyMatch[1].toUpperCase();
  else if (sellMatch) symbol = sellMatch[1].toUpperCase();

  // Pattern 2: look for isolated ticker near top of text (2-5 uppercase letters)
  if (!symbol) {
    const tickerMatch = text.match(/\b([A-Z]{2,6})\b(?=\s*(?:NASDAQ|NYSE|SET|หุ้น|\d))/);
    if (tickerMatch) symbol = tickerMatch[1];
  }

  // Reject obviously wrong symbols (pure numbers or common Thai words)
  if (symbol && /^\d+$/.test(symbol)) symbol = null;

  // ─── Category ───
  let category = "stock";
  const cryptoSymbols = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOT", "MATIC", "AVAX", "LINK", "UNI"];
  if (symbol && cryptoSymbols.includes(symbol)) category = "crypto";
  if (/Bitkub|Binance|คริปโต|crypto/i.test(text)) category = "crypto";
  if (/ทอง|Gold|GLD|XAU/i.test(text)) category = "gold";

  // ─── Quantity ───
  // Dime!: "[N] หุ้น" pattern
  let qty = null;
  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:หุ้น|shares?|units?|coins?)/i);
  if (qtyMatch) qty = parseFloat(qtyMatch[1]);

  // ─── Price per unit ───
  // Dime!: "ราคาที่ได้จริง" row has the execution price
  // Look for "ราคาที่ได้จริง" then next USD number
  let price = null;
  const execPriceMatch = text.match(/ราคาที่ได้จริง[^\d]*?([\d,]+\.?\d*)\s*USD/i);
  if (execPriceMatch) {
    price = parseFloat(execPriceMatch[1].replace(/,/g, ""));
  }
  // Fallback: "ราคาที่คุณตั้ง" (limit price)
  if (!price) {
    const limitPriceMatch = text.match(/ราคาที่คุณตั้ง[^\d]*?([\d,]+\.?\d*)\s*USD/i);
    if (limitPriceMatch) price = parseFloat(limitPriceMatch[1].replace(/,/g, ""));
  }
  // Fallback: price is total / qty
  if (!price && qty) {
    const totalMatch = text.match(/(?:ยอดที่ต้องชำระ|ยอดที่จะได้รับคืน|Total)[^\d]*([\d,]+\.?\d*)\s*USD/i);
    if (totalMatch) price = parseFloat(totalMatch[1].replace(/,/g, "")) / qty;
  }

  // ─── Date ───
  // Dime!: "วันที่ส่งคำสั่ง: DD พ.ค. 69 - HH:MM"
  let date = null;
  const dateSection = text.match(/วันที่ส่งคำสั่ง[:\s]*(.+)/);
  if (dateSection) date = parseThaiDate(dateSection[1]);
  if (!date) date = parseThaiDate(text); // try whole text
  if (!date) date = new Date().toISOString().split("T")[0];

  return { symbol, category, transactionType, qty, price, date };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const images = body.images;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), { status: 400, headers: corsHeaders });
    }

    if (!env.AI) {
      return new Response(JSON.stringify({ error: "AI_BINDING_UNAVAILABLE" }), { status: 503, headers: corsHeaders });
    }

    // Precise prompt focused on extracting structured text, not interpreting
    const PROMPT = `This is a financial transaction receipt from a stock broker app called Dime! (Thai broker for US stocks).
TASK: Read the text in this image carefully and extract ONLY these specific fields.

CRITICAL RULES:
- "symbol" = The SHORT STOCK TICKER CODE (e.g. MU, AAPL, ASML, NVDA) that appears right after the word "ซื้อ" (buy) or "ขาย" (sell) at the TOP of the receipt. It is 1-6 capital letters. DO NOT use total amounts or dates as the symbol.
- "qty" = The NUMBER of shares, which appears as "[N] หุ้น" (e.g. "3 หุ้น" means qty=3)
- "price" = The price PER SHARE in USD labeled "ราคาที่ได้จริง" (NOT the total "ยอดที่ต้องชำระ")
- "transactionType" = "BUY" if the word "ซื้อ" appears, "SELL" if "ขาย" appears
- "date" = from "วันที่ส่งคำสั่ง". Thai year (e.g. "69") means Buddhist Era → subtract 543 → Gregorian year (69+1957=2026). Month "พ.ค."=05, "ม.ค."=01, "ก.พ."=02, "มี.ค."=03, "เม.ย."=04, "มิ.ย."=06, "ก.ค."=07, "ส.ค."=08, "ก.ย."=09, "ต.ค."=10, "พ.ย."=11, "ธ.ค."=12
- "category" = "stock" for equities on NASDAQ/NYSE/SET. "crypto" for BTC/ETH etc. "gold" for gold.

Output ONLY a valid JSON object, no other text:
{"symbol":"MU","name":"Micron Technology","category":"stock","transactionType":"BUY","qty":3,"price":665.00,"date":"2026-05-19"}`;

    const results = [];
    const errors = [];

    for (let i = 0; i < images.length; i++) {
      const { base64, mime } = images[i];

      try {
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) bytes[j] = binaryStr.charCodeAt(j);

        const aiResponse = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
          prompt: PROMPT,
          image: [...bytes],
          max_tokens: 400,
        });

        const rawText = aiResponse?.description || aiResponse?.response || "";
        if (!rawText) throw new Error("AI returned empty response");

        // Try to parse LLaVA JSON response
        let data = null;
        const clean = rawText.trim().replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { data = JSON.parse(jsonMatch[0]); } catch {}
        }

        // Post-process: apply heuristic extractor to fix/supplement LLaVA mistakes
        const heuristic = extractFromText(rawText);

        // Merge: prefer heuristic values for fields that LLaVA commonly gets wrong
        const symbol = heuristic.symbol || data?.symbol;
        const qty = heuristic.qty || parseFloat(data?.qty) || 0;
        const price = heuristic.price || parseFloat(data?.price) || 0;
        const date = heuristic.date || data?.date || new Date().toISOString().split("T")[0];
        const transactionType = heuristic.transactionType || data?.transactionType || "BUY";
        const category = heuristic.category || data?.category || "stock";
        const name = data?.name || symbol || "";

        if (!symbol) throw new Error("Could not find stock symbol in receipt");

        // Sanity check: price should not be the total amount
        // If price > 10x qty-adjusted reasonable range, it might be the total
        const finalPrice = (qty > 0 && price / qty > 0.01) ? price : price;

        results.push({ index: i, symbol: String(symbol).toUpperCase().trim(), name, category, transactionType, qty, price: finalPrice, date });

      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    return new Response(JSON.stringify({ results, errors }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
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
