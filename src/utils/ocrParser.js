/**
 * ocrParser.js — Tesseract.js + Dime! receipt regex parser
 *
 * Strategy:
 * 1. Use Tesseract.js to extract raw text from the image (tha+eng language pack)
 * 2. Apply regex patterns specific to Dime! receipt format to extract fields
 * 3. Return structured transaction data (no AI interpretation needed!)
 *
 * This approach is 100% free, offline-capable, and has no quota limits.
 */

import { createWorker } from "tesseract.js";

// Thai month name → zero-padded month number
const THAI_MONTH_MAP = {
  "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
  "พ.ค.":  "05", "มิ.ย.": "06", "ก.ค.":  "07", "ส.ค.":  "08",
  "ก.ย.":  "09", "ต.ค.":  "10", "พ.ย.":  "11", "ธ.ค.":  "12",
  // Full forms
  "มกราคม":  "01", "กุมภาพันธ์": "02", "มีนาคม":   "03",
  "เมษายน":  "04", "พฤษภาคม":   "05", "มิถุนายน": "06",
  "กรกฎาคม": "07", "สิงหาคม":   "08", "กันยายน":  "09",
  "ตุลาคม":  "10", "พฤศจิกายน": "11", "ธันวาคม":  "12",
};

/**
 * Parse Thai/Buddhist Era date string → ISO date string
 * e.g. "19 พ.ค. 69" → "2026-05-19"
 *      "14 พ.ค. 2569" → "2026-05-14"
 */
function parseThaiDate(text) {
  for (const [thMonth, numMonth] of Object.entries(THAI_MONTH_MAP)) {
    const escaped = thMonth.replace(/\./g, "\\.").replace(/[()]/g, "\\$&");
    const re = new RegExp(`(\\d{1,2})\\s*${escaped}\\s*(\\d{2,4})`);
    const m = text.match(re);
    if (m) {
      const day = String(parseInt(m[1])).padStart(2, "0");
      let year = parseInt(m[2]);
      if (year < 100) year = year + 1957;       // 2-digit BE (e.g. 69 → 2026)
      else if (year > 2400) year = year - 543;  // 4-digit BE (e.g. 2569 → 2026)
      // If still looks like BE (2500-2600 range), subtract
      if (year > 2100) year = year - 543;
      return `${year}-${numMonth}-${day}`;
    }
  }
  return null;
}

/**
 * Parse raw OCR text from a Dime! receipt and extract transaction fields.
 * Returns null if the text doesn't look like a valid receipt.
 */
export function parseDimeReceipt(rawText) {
  if (!rawText || rawText.trim().length < 20) return null;

  const text = rawText;

  // ─── Transaction type ───────────────────────────────────────────────────────
  // Dime! header: "ซื้อ MU" or "ขาย ASML"
  let transactionType = null;
  if (/^ซื้อ|ซื้อ\s+[A-Z]/m.test(text)) transactionType = "BUY";
  else if (/^ขาย|ขาย\s+[A-Z]/m.test(text)) transactionType = "SELL";
  else if (/\bBuy\b|\bBUY\b/i.test(text)) transactionType = "BUY";
  else if (/\bSell\b|\bSELL\b/i.test(text)) transactionType = "SELL";
  if (!transactionType) transactionType = "BUY";

  // ─── Symbol ─────────────────────────────────────────────────────────────────
  // Pattern 1: right after ซื้อ or ขาย
  let symbol = null;
  const buyPat  = text.match(/(?:^|(?<=\n))ซื้อ\s+([A-Z]{1,8}(?:\.[A-Z]{1,4})?)/m);
  const sellPat = text.match(/(?:^|(?<=\n))ขาย\s+([A-Z]{1,8}(?:\.[A-Z]{1,4})?)/m);
  if (buyPat)  symbol = buyPat[1];
  if (sellPat) symbol = sellPat[1];

  // Pattern 2: looser — ซื้อ/ขาย anywhere before a capital ticker
  if (!symbol) {
    const loose = text.match(/(?:ซื้อ|ขาย)\s+([A-Z]{1,8}(?:\.[A-Z]{1,4})?)/);
    if (loose) symbol = loose[1];
  }

  // Pattern 3: ticker + exchange label nearby
  if (!symbol) {
    const withExchange = text.match(/\b([A-Z]{2,8})\b\s*(?:NASDAQ|NYSE|SET|ASX)/);
    if (withExchange) symbol = withExchange[1];
  }

  // Reject obviously invalid symbols (pure numbers, single chars, common Thai abbrev)
  if (symbol && (/^\d+$/.test(symbol) || symbol.length === 1)) symbol = null;
  if (!symbol) return null; // can't continue without symbol

  // ─── Category ────────────────────────────────────────────────────────────────
  const CRYPTO_TICKERS = new Set(["BTC","ETH","SOL","XRP","ADA","DOT","MATIC","AVAX","LINK","UNI","BNB","USDT","DOGE"]);
  let category = "stock";
  if (CRYPTO_TICKERS.has(symbol)) category = "crypto";
  if (/Bitkub|Binance|คริปโต|crypto/i.test(text)) category = "crypto";
  if (/ทอง|Gold|GLD|XAU|gold/i.test(text) && !CRYPTO_TICKERS.has(symbol)) category = "gold";

  // ─── Quantity ────────────────────────────────────────────────────────────────
  // Dime!: "3 หุ้น" / "2 หุ้น"
  let qty = null;
  const qtyMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:หุ้น|share|unit|coin|shares)/i);
  if (qtyMatch) qty = parseFloat(qtyMatch[1].replace(/,/g, ""));

  // ─── Price per share ─────────────────────────────────────────────────────────
  // Dime! has two labels: "ราคาที่คุณตั้ง" and "ราคาที่ได้จริง"
  // We want "ราคาที่ได้จริง" (executed price = per-unit price, NOT the total)
  let price = null;

  // Try to find "ราคาที่ได้จริง" line and the USD number after it
  const execPriceSection = text.match(/ราคาที่ได้จริง[\s\S]{0,60}?([\d,]+\.?\d*)\s*USD/i);
  if (execPriceSection) price = parseFloat(execPriceSection[1].replace(/,/g, ""));

  // Fallback: "ราคาที่คุณตั้ง" (limit price you set)
  if (!price) {
    const limitSection = text.match(/ราคาที่คุณตั้ง[\s\S]{0,60}?([\d,]+\.?\d*)\s*USD/i);
    if (limitSection) price = parseFloat(limitSection[1].replace(/,/g, ""));
  }

  // Fallback: first USD number that's NOT the total (total is after ยอดที่...)
  if (!price && qty) {
    // Find total then calculate per-unit
    const totalMatch = text.match(/(?:ยอดที่ต้องชำระ|ยอดที่จะได้รับคืน|Total paid|Total received)[\s\S]{0,80}?([\d,]+\.?\d*)\s*USD/i);
    if (totalMatch) {
      const total = parseFloat(totalMatch[1].replace(/,/g, ""));
      if (qty > 0) price = total / qty;
    }
  }

  // ─── Date ────────────────────────────────────────────────────────────────────
  // Dime!: "วันที่ส่งคำสั่ง   19 พ.ค. 69 - 02:22 น."
  let date = null;

  const dateSectionMatch = text.match(/วันที่ส่งคำสั่ง[\s\S]{0,80}/);
  if (dateSectionMatch) date = parseThaiDate(dateSectionMatch[0]);
  if (!date) date = parseThaiDate(text); // try entire text
  if (!date) date = new Date().toISOString().split("T")[0];

  // ─── Company name ─────────────────────────────────────────────────────────────
  // Try to find exchange label as a proxy for identifying it's a stock
  const exchangeMatch = text.match(/\b(NASDAQ|NYSE|SET|ASX|LSE|HKEX)\b/);
  const exchangeLabel = exchangeMatch ? exchangeMatch[1] : "";

  return {
    symbol:          symbol.toUpperCase(),
    name:            symbol.toUpperCase(), // ticker only — name will be fetched by the app
    category,
    transactionType,
    qty:             qty ?? 1,
    price:           price ?? 0,
    date,
    _rawText:        rawText, // keep for debugging
    _exchange:       exchangeLabel,
  };
}

/**
 * Run Tesseract.js OCR on a File/Blob and return the extracted text.
 * Downloads language packs from CDN on first use (~6 MB), cached by browser.
 */
let _tesseractWorker = null;

async function getTesseractWorker() {
  if (_tesseractWorker) return _tesseractWorker;
  _tesseractWorker = await createWorker("tha+eng", 1, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js",
    langPath:   "https://tessdata.projectnaptha.com/4.0.0",
    corePath:   "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js",
    logger:     () => {}, // suppress logs
  });
  await _tesseractWorker.setParameters({
    tessedit_char_whitelist: "",  // allow all chars
    preserve_interword_spaces: "1",
  });
  return _tesseractWorker;
}

/**
 * Main entry point: OCR a single image file and parse the Dime! receipt.
 * Returns the same shape as the Cloudflare /api/ocr endpoint result.
 */
export async function ocrReceiptFile(file, onProgress) {
  try {
    const worker = await getTesseractWorker();
    onProgress?.("reading");

    const { data: { text } } = await worker.recognize(file);
    onProgress?.("parsing");

    const parsed = parseDimeReceipt(text);
    if (!parsed) {
      return { success: false, error: "ไม่พบข้อมูลรายการในภาพ (อาจไม่ใช่สลิป Dime!)", rawText: text };
    }

    return { success: true, ...parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Terminate the Tesseract worker (call when component unmounts).
 */
export async function terminateTesseract() {
  if (_tesseractWorker) {
    await _tesseractWorker.terminate();
    _tesseractWorker = null;
  }
}
