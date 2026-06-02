/**
 * ocrParser.js — Tesseract.js + Dime! receipt regex parser
 *
 * Strategy:
 * 1. Tesseract.js extracts raw text from image (tha+eng)
 * 2. Regex patterns specific to Dime! format extract fields
 * 3. No AI interpretation = deterministic, no quota, always free
 */

import { createWorker } from "tesseract.js";

// Thai month → zero-padded month number (various OCR outputs)
const THAI_MONTH_MAP = {
  // Short dotted form
  "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
  "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.":  "07", "ส.ค.":  "08",
  "ก.ย.": "09", "ต.ค.":  "10", "พ.ย.":  "11", "ธ.ค.":  "12",
  // Full forms
  "มกราคม": "01", "กุมภาพันธ์": "02", "มีนาคม":   "03",
  "เมษายน": "04", "พฤษภาคม":   "05", "มิถุนายน": "06",
  "กรกฎาคม":"07", "สิงหาคม":   "08", "กันยายน":  "09",
  "ตุลาคม": "10", "พฤศจิกายน": "11", "ธันวาคม":  "12",
};

function parseThaiDate(text) {
  for (const [thMonth, numMonth] of Object.entries(THAI_MONTH_MAP)) {
    const escaped = thMonth.replace(/\./g, "\\.").replace(/[()]/g, "\\$&");
    const re = new RegExp(`(\\d{1,2})\\s*${escaped}\\s*(\\d{2,4})`);
    const m = text.match(re);
    if (m) {
      const day  = String(parseInt(m[1])).padStart(2, "0");
      let year   = parseInt(m[2]);
      if (year < 100)  year = year + 1957;   // "69" → 2026
      if (year > 2400) year = year - 543;    // 4-digit BE → CE
      if (year > 2100) year = year - 543;    // double-check
      return `${year}-${numMonth}-${day}`;
    }
  }
  return null;
}

/** Remove thousand-comma separators and parse float */
function parseAmt(str) {
  return parseFloat(String(str).replace(/,/g, "")) || 0;
}

/**
 * Extract all USD amounts from a text block as an array of numbers.
 * e.g. "665.00 USD  665.00 USD" → [665, 665]
 */
function extractAllUSD(block) {
  const found = [];
  const re = /([\d,]+\.?\d*)\s*USD/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    const val = parseAmt(m[1]);
    if (val > 0) found.push(val);
  }
  return found;
}

/**
 * Parse raw OCR text from a Dime! receipt.
 */
export function parseDimeReceipt(rawText) {
  if (!rawText || rawText.trim().length < 20) return null;
  const text = rawText;

  // ──────────────────────────────────────────────────────────────────────────
  // Transaction type
  // ──────────────────────────────────────────────────────────────────────────
  let transactionType = "BUY";
  if (/ขาย|Sell|SELL/i.test(text)) transactionType = "SELL";

  // ──────────────────────────────────────────────────────────────────────────
  // Symbol — look for ticker right after ซื้อ/ขาย
  // ──────────────────────────────────────────────────────────────────────────
  let symbol = null;
  // Match any word of 1-8 letters/chars right after ซื้อ or ขาย (allowing Thai garbles)
  const txMatch = text.match(/(?:ซื้อ|ขาย)\s+([A-Za-zก-๙0-9]{1,8}(?:\.[A-Z]{1,4})?)/);
  if (txMatch) symbol = txMatch[1];

  if (!symbol) {
    // Fallback: ticker adjacent to exchange name
    const exMatch = text.match(/\b([A-Za-zก-๙0-9]{2,8})\b\s*(?:NASDAQ|NYSE|SET|ASX)/);
    if (exMatch) symbol = exMatch[1];
  }

  // Map common garbled Thai characters back to English symbols
  if (symbol) {
    const symUpper = symbol.trim().toUpperCase();
    if (symUpper === "เบ" || symUpper === "เน" || symUpper === "เม" || symUpper === "เU") {
      symbol = "MU";
    } else if (symUpper === "กอ" || symUpper === "กO") {
      symbol = "KO";
    } else {
      // Clean symbol to only allow uppercase English letters and dots
      symbol = symUpper.replace(/[^A-Z.]/g, "");
    }
  }

  if (!symbol || /^\d+$/.test(symbol)) return null;

  // ──────────────────────────────────────────────────────────────────────────
  // Category
  // ──────────────────────────────────────────────────────────────────────────
  const CRYPTO = new Set(["BTC","ETH","SOL","XRP","ADA","DOT","MATIC","AVAX","LINK","UNI","BNB","USDT","DOGE"]);
  let category = "stock";
  if (CRYPTO.has(symbol)) category = "crypto";
  if (/Bitkub|Binance|คริปโต/i.test(text)) category = "crypto";
  if (/ทอง|Gold|XAU/i.test(text) && !CRYPTO.has(symbol)) category = "gold";

  // ──────────────────────────────────────────────────────────────────────────
  // Quantity — หุ้น may be garbled by Tesseract (missing tone marks, read as Au, iu, etc.)
  // ──────────────────────────────────────────────────────────────────────────
  let qty = null;

  // Extract the text section between the Exchange/Header and the Price Table Header
  const headerMatch = text.match(/(?:NASDAQ|NYSE|SET|ASX|ซื้อ|ขาย)[\s\S]*?(?=ราคา|ธาศา|ราค|คุณตั้ง|ตั้ง|ได้จริง)/i);
  if (headerMatch) {
    const sectionText = headerMatch[0];
    const unitPattern = /(?:หุ้น|หุน|ห[ุูu][้o]?[นn]|[Aa][uu]|[Ii][uu]|[Uu][uu]|[Hh][uu][nN]|[Aa][nN]|[Uu][nN]|shares?|หน่วย|หนวย|หน[วว][ยย]|units?|เหรียญ|เหรียณ|coins?)/i;
    const qtyUnitMatch = sectionText.match(new RegExp(`(\\d+(?:,\\d{3})*(?:\\.\\d+)?)\\s*${unitPattern.source}`, "i"));
    if (qtyUnitMatch) {
      qty = parseFloat(qtyUnitMatch[1].replace(/,/g, ""));
    } else {
      // Fallback: pick the last non-zero number in the section if no unit matched
      const numRe = /(\d+(?:\.\d+)?)/g;
      const numMatches = [];
      let nm;
      while ((nm = numRe.exec(sectionText)) !== null) {
        const val = parseFloat(nm[1]);
        if (val > 0) numMatches.push(val);
      }
      if (numMatches.length > 0) {
        const candidates = numMatches.filter(n => n < 10000);
        if (candidates.length > 0) {
          qty = candidates[candidates.length - 1];
        }
      }
    }
  }

  // Final fallback using a global search in case header matching failed
  if (!qty) {
    const unitPattern = /(?:หุ้น|หุน|ห[ุูu][้o]?[นn]|[Aa][uu]|[Ii][uu]|[Uu][uu]|[Hh][uu][nN]|[Aa][nN]|[Uu][nN]|shares?|หน่วย|หนวย|หน[วว][ยย]|units?|เหรียญ|เหรียณ|coins?)/i;
    const globalMatch = text.match(new RegExp(`(\\d+(?:,\\d{3})*(?:\\.\\d+)?)\\s*${unitPattern.source}`, "i"));
    if (globalMatch) {
      qty = parseFloat(globalMatch[1].replace(/,/g, ""));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Price — "ราคาที่ได้จริง" is the SECOND column in a two-column table.
  // ──────────────────────────────────────────────────────────────────────────
  let price = null;

  // Find the block between the price-label row and the total row
  // Support garbled labels like "ธาศาที่คุณตั้ง" or "ราคาที่ได้959"
  const priceBlockMatch = text.match(
    /(?:ราคา|ธาศา|ราค|คุณตั้ง|ได้จริง|ได้จ|ได้959|ได้จ5)[\s\S]*?(?=ยอดที่|ยอด|มูลค่า|ค่าคอม|คุณได้รับ|$)/i
  );
  if (priceBlockMatch) {
    const allUSD = extractAllUSD(priceBlockMatch[0]);
    // ราคาที่ได้จริง is the LAST price before the total row (usually the second column)
    if (allUSD.length >= 2) {
      price = allUSD[allUSD.length - 1]; // rightmost = executed price
    } else if (allUSD.length === 1) {
      price = allUSD[0];
    }
  }

  // Fallback: look for the executed price section directly
  if (!price) {
    const execSection = text.match(/(?:ราคาที่ได้จริง|ราคาที่ได้|ได้จริง|ราคาที่ได้959|ราคที่ได้จ5)[\s\S]{0,150}/i);
    if (execSection) {
      const allUSD = extractAllUSD(execSection[0]);
      if (allUSD.length > 0) price = allUSD[allUSD.length - 1];
    }
  }

  // Fallback: derive price from total ÷ qty
  if (!price && qty && qty > 0) {
    const totalMatch = text.match(
      /(?:ยอดที่ต้องชำระ|ยอดที่จะได้รับคืน|ยอดที่ต้องชําระ|ยอดที่|มูลค่าหุ้น|มูลค่า)[\s\S]{0,100}?([\d,]+\.?\d*)\s*USD/i
    );
    if (totalMatch) {
      price = parseAmt(totalMatch[1]) / qty;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Date — from "วันที่ส่งคำสั่ง  19 พ.ค. 69 - 02:22 น."
  // ──────────────────────────────────────────────────────────────────────────
  let date = null;
  const dateLine = text.match(/วันที่ส่งคำสั่ง[\s\S]{0,100}/);
  if (dateLine) date = parseThaiDate(dateLine[0]);
  if (!date) date = parseThaiDate(text);
  if (!date) date = new Date().toISOString().split("T")[0];

  return {
    symbol:          symbol.toUpperCase(),
    name:            symbol.toUpperCase(),
    category,
    transactionType,
    qty:             qty  ?? 1,
    price:           price ?? 0,
    date,
  };
}

// ─── Tesseract worker (singleton, reused across images) ────────────────────
let _worker = null;

async function getWorker() {
  if (_worker) return _worker;
  _worker = await createWorker("tha+eng", 1, {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js",
    langPath:   "https://tessdata.projectnaptha.com/4.0.0",
    corePath:   "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js",
    logger:     () => {},
  });
  await _worker.setParameters({ preserve_interword_spaces: "1" });
  return _worker;
}

/**
 * OCR a single image file and parse as Dime! receipt.
 */
export async function ocrReceiptFile(file, onProgress) {
  try {
    const worker = await getWorker();
    onProgress?.("reading");
    const { data: { text } } = await worker.recognize(file);
    onProgress?.("parsing");

    // Debug: expose raw text in dev
    if (import.meta.env?.DEV) console.log("[OCR raw]", text);

    const parsed = parseDimeReceipt(text);
    if (!parsed) {
      return { success: false, error: "ไม่พบข้อมูลรายการ (อาจไม่ใช่สลิป Dime!)", rawText: text };
    }
    return { success: true, ...parsed, rawText: text };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function terminateTesseract() {
  if (_worker) { await _worker.terminate(); _worker = null; }
}
