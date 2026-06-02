/**
 * ocrParser.js — Tesseract.js + Dime! receipt regex parser
 *
 * Strategy:
 * 1. Tesseract.js extracts raw text from image (tha+eng)
 * 2. Normalize Thai characters and spacing around numbers/decimals
 * 3. Regex patterns specific to Dime! format extract fields
 * 4. Verify all required fields (symbol, qty, price) are present.
 *    If any are missing, return success: false to trigger AI fallback.
 */

import { createWorker } from "tesseract.js";

/** Normalize OCR raw text to handle Thai Unicode variants and number spacing */
function normalizeOcrText(rawText) {
  if (!rawText) return "";
  let t = rawText.normalize("NFC");

  // 1. Normalize Thai SARA AM: U+0E4D (NIKHAHIT) + U+0E32 (SARA AA) -> U+0E33 (SARA AM)
  t = t.replace(/\u0e4d\u0e32/g, "\u0e33");

  // 2. Remove space around decimal points in numbers (e.g. "51 . 62" -> "51.62")
  t = t.replace(/(\d+)\s*\.\s*(\d+)/g, "$1.$2");

  // 3. Remove space around commas in numbers (e.g. "10, 000" -> "10,000")
  t = t.replace(/(\d+)\s*,\s*(\d+)/g, "$1,$2");

  return t;
}

function parseThaiTime(text) {
  if (!text) return null;
  // Match HH:MM format, possibly followed by " น." or " น" or "น"
  const match = text.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (match) {
    const hour = match[1].padStart(2, "0");
    const minute = match[2];
    return `${hour}:${minute}`;
  }
  return null;
}

function parseThaiDate(text) {
  if (!text) return null;

  const months = [
    { num: "01", pattern: "[มuUmM]\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|มกราคม" },
    { num: "02", pattern: "[กnNkKgG]\\s*\\.?\\s*[พwWvV]\\s*\\.?|กุมภาพันธ์" },
    { num: "03", pattern: "(?:มี|[มmM][ีeEiI])\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|มีนาคม" },
    { num: "04", pattern: "เ\\s*[มm]\\s*\\.?\\s*[ยyY9qQvVuUnN]\\s*\\.?|เมษายน" },
    { num: "05", pattern: "(?:[พwWvVhHnN]|[0oO])\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|พฤษภาคม" },
    { num: "06", pattern: "(?:มิ|[มmM][ิiI])\\s*\\.?\\s*[ยyY9qQvVuUnN]\\s*\\.?|[0oO]\\s*\\.?\\s*[9qQ]\\s*\\.?|มิถุนายน" },
    { num: "07", pattern: "[กnNkKgG]\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|กรกฎาคม" },
    { num: "08", pattern: "[สsS]\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|สิงหาคม" },
    { num: "09", pattern: "[กnNkKgG]\\s*\\.?\\s*[ยyY9qQvVuUnN]\\s*\\.?|กันยายน" },
    { num: "10", pattern: "[ตtT]\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|ตุลาคม" },
    { num: "11", pattern: "(?:[พwWvVhHnN]|[0oO])\\s*\\.?\\s*[ยyY9qQvVuUnN]\\s*\\.?|พฤศจิกายน" },
    { num: "12", pattern: "[ธsStTdD]\\s*\\.?\\s*[คaAดศลoO0cCdDnNuUvV]\\s*\\.?|ธันวาคม" }
  ];

  for (const m of months) {
    // Match day (1-2 digits) + spaces + month pattern + spaces + year (2 or 4 digits)
    const re = new RegExp(`(\\d{1,2})\\s*(?:${m.pattern})\\s*(\\d{2,4})`, "i");
    const match = text.match(re);
    if (match) {
      const day = String(parseInt(match[1])).padStart(2, "0");
      let year = parseInt(match[2]);
      if (year < 100) year = year + 1957; // "68" -> 2025
      if (year > 2400) year = year - 543;
      if (year > 2100) year = year - 543;
      return `${year}-${m.num}-${day}`;
    }
  }
  return null;
}

/** Remove thousand-comma separators and parse float */
function parseAmt(str) {
  return parseFloat(String(str).replace(/,/g, "")) || 0;
}

/** Extract numbers that are clearly separated (preceded/followed by whitespace or punctuation) */
function extractCleanNumbers(block) {
  const found = [];
  const re = /(?:^|[\s,()\-+*/])(\d+(?:,\d{3})*(?:\.\d+)?)(?=$|[\s,()\-+*/])/g;
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
  
  // Normalize character variants and spacing issues first
  const text = normalizeOcrText(rawText);

  // Extract the first 15 lines to find transaction type & ticker (wider window handles top empty/garbage lines)
  const searchLines = text.split(/[\r\n]+/).slice(0, 15).join("\n");

  // ──────────────────────────────────────────────────────────────────────────
  // Transaction type — support standard terms and common OCR typos
  // ──────────────────────────────────────────────────────────────────────────
  let transactionType = "BUY";
  if (/ขาย|ทาย|นาบ|นาก|uo|Sell|SELL/i.test(searchLines)) {
    transactionType = "SELL";
  } else if (/ซื้อ|ชื้อ|ชือ|ซือ|ซื่อ|do|bo|Buy|BUY/i.test(searchLines)) {
    transactionType = "BUY";
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Symbol — look for ticker right after Buy/Sell keywords (optional spaces)
  // ──────────────────────────────────────────────────────────────────────────
  let symbol = null;
  const txMatch = searchLines.match(/(?:ซื้อ|ขาย|do|uo|ชื้อ|ชือ|ซือ|ซื่อ|Buy|Sell)\s*([A-Za-zก-๙0-9]{1,8}(?:\.[A-Z]{1,4})?)/i);
  if (txMatch) symbol = txMatch[1];

  if (!symbol) {
    // Fallback: ticker adjacent to exchange name
    const exMatch = searchLines.match(/\b([A-Za-zก-๙0-9]{2,8})\b\s*(?:NASDAQ|NYSE|BATS|SET|ASX)/i);
    if (exMatch) symbol = exMatch[1];
  }

  if (!symbol) {
    // Fallback 2: Look at the first 10 lines for any word that is 2-6 uppercase English letters,
    // excluding known common keywords.
    const blacklist = new Set(["BUY", "SELL", "USD", "THB", "DIME", "FAST", "MARKET", "LIMIT", "BATS", "NASDAQ", "NYSE", "SET", "ASX"]);
    const lines = text.split(/[\r\n]+/);
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const words = lines[i].match(/\b[A-Za-z]{2,6}\b/g);
      if (words) {
        for (const w of words) {
          const wUpper = w.toUpperCase();
          if (!blacklist.has(wUpper)) {
            symbol = wUpper;
            break;
          }
        }
      }
      if (symbol) break;
    }
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
  // Quantity — หุ้น may be garbled by Tesseract
  // ──────────────────────────────────────────────────────────────────────────
  let qty = null;

  // Extract the text section between the Exchange/Header and the Price Table Header
  const headerMatch = text.match(/(?:NASDAQ|NYSE|BATS|SET|ASX|ซื้อ|ขาย|do|uo)[\s\S]*?(?=ราคา(?!ตลาด)|ธาคา(?!ตลาด)|ธาศา|รากา|ราค(?!ตลาด|าตลาด)|คุณตั้ง|ตั้ง|ได้จริง)/i);
  if (headerMatch) {
    const sectionText = headerMatch[0];
    const unitPattern = /(?:หุ้น|หุน|ห[ุูu][้o]?[นn]|[Aa][uu]|[Ii][uu]|[Uu][uu]|[Hh][uu][nN]|[Aa][nN]|[Uu][nN]|[Kk][uu]|[ศสช][ุูu][้o]?[นn]|shares?|หน่วย|หนวย|หน[วว][ยย]|units?|เหรียญ|เหรียณ|coins?)/i;
    const qtyUnitMatch = sectionText.match(new RegExp(`(\\d+(?:,\\d{3})*(?:\\.\\d+)?)\\s*${unitPattern.source}`, "i"));
    if (qtyUnitMatch) {
      qty = parseFloat(qtyUnitMatch[1].replace(/,/g, ""));
    } else {
      // Fallback: pick the last non-zero number in the section if no unit matched
      const numMatches = extractCleanNumbers(sectionText);
      if (numMatches.length > 0) {
        const candidates = numMatches.filter(n => n < 10000);
        if (candidates.length > 0) {
          qty = candidates[candidates.length - 1];
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Price — "ราคาที่ได้จริง" is the SECOND column in a two-column table.
  // ──────────────────────────────────────────────────────────────────────────
  let price = null;
  let qtyFromTable = null;

  const priceBlockMatch = text.match(
    /(?:ราคา(?!ตลาด)|ธาคา(?!ตลาด)|ธาศา|รากา|ราค(?!ตลาด|าตลาด)|คุณตั้ง|ได้จริง|ได้จ|ได้959|ได้จ5)[\s\S]*?(?=ยอดที่|ยอด|มูลค่า|ค่าคอม|คุณได้รับ|$)/i
  );
  if (priceBlockMatch) {
    const blockText = priceBlockMatch[0];
    
    // Find all USD amounts by matching numbers followed by common currency word garbles
    const usdRe = /(?:^|[\s,()\-+*/])(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:USD|บรอ|บรอ|บรอ|บรอ|บรอ|บรั|บรต|บธ|บธิ|บธุ|บธ|บร)(?=$|[\s,()\-+*/])/gi;
    const usdValues = [];
    let m;
    while ((m = usdRe.exec(blockText)) !== null) {
      usdValues.push(parseAmt(m[1]));
    }
    
    const allNums = extractCleanNumbers(blockText);
    
    // Line-by-line layout analysis (price and qty side-by-side)
    const lines = blockText.split(/[\r\n]+/);
    for (const line of lines) {
      const lineNums = extractCleanNumbers(line);
      if (lineNums.length === 2) {
        if (transactionType === "BUY" && !qty) {
          // Buy market order: Price is first, Qty is second
          price = lineNums[0];
          qtyFromTable = lineNums[1];
        } else {
          // Limit order: Limit Price is first, Executed Price is second
          price = lineNums[1];
        }
      }
    }
    
    // If layout analysis didn't find price, fall back to currency-labeled values
    if (!price && usdValues.length > 0) {
      price = usdValues[usdValues.length - 1]; // rightmost = executed price
    }

    // Flat block-level fallback if line-by-line or currency match was partial
    if ((!price || (!qty && !qtyFromTable)) && allNums.length >= 2) {
      if (transactionType === "BUY" && !qty) {
        if (!price) price = allNums[0];
        if (!qtyFromTable) qtyFromTable = allNums[1];
      } else {
        if (!price) price = allNums[allNums.length - 1];
      }
    }
    
    // If layout analysis didn't find qty, filter allNums
    if (!qty && !qtyFromTable) {
      const nonUsdNums = allNums.filter(n => !usdValues.includes(n) && n !== price);
      if (nonUsdNums.length > 0) {
        qtyFromTable = nonUsdNums[0];
      }
    }
  }

  // GLOBAL FALLBACK: If block matching failed, scan the entire text line-by-line
  if (!price || (!qty && !qtyFromTable)) {
    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
      const lineNums = extractCleanNumbers(line);
      if (lineNums.length === 2 && /USD|บรอ|บรั|บรต|บธ|บธิ|บธุ|บธ|บร/i.test(line)) {
        if (transactionType === "BUY" && !qty) {
          if (!price) price = lineNums[0];
          if (!qtyFromTable) qtyFromTable = lineNums[1];
        } else {
          if (!price) price = lineNums[1];
        }
      }
    }
  }

  // If quantity was not in header but was in table (Buy Market orders)
  if (qtyFromTable && !qty) {
    qty = qtyFromTable;
  }

  // Final fallback using a global search in case header matching failed
  if (!qty) {
    const unitPattern = /(?:หุ้น|หุน|ห[ุูu][้o]?[นn]|[Aa][uu]|[Ii][uu]|[Uu][uu]|[Hh][uu][nN]|[Aa][nN]|[Uu][nN]|[Kk][uu]|[ศสช][ุูu][้o]?[นn]|shares?|หน่วย|หนวย|หน[วว][ยย]|units?|เหรียญ|เหรียณ|coins?)/i;
    const globalMatch = text.match(new RegExp(`(\\d+(?:,\\d{3})*(?:\\.\\d+)?)\\s*${unitPattern.source}`, "i"));
    if (globalMatch) {
      qty = parseFloat(globalMatch[1].replace(/,/g, ""));
    }
  }

  // Fallback executed price section search
  if (!price) {
    const execSection = text.match(/(?:ราคาที่ได้จริง|ราคาที่ได้|ได้จริง|ราคาที่ได้959|ราคที่ได้จ5|ธาคา|รวยกีโช้จ5)[\s\S]{0,150}/i);
    if (execSection) {
      const allUSD = [];
      const usdRe = /(?:^|[\s,()\-+*/])(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:USD|บรอ|บรอ|บรอ|บรอ|บรอ|บรั|บรต|บธ|บธิ|บธุ|บธ|บร)(?=$|[\s,()\-+*/])/gi;
      let m;
      while ((m = usdRe.exec(execSection[0])) !== null) {
        allUSD.push(parseAmt(m[1]));
      }
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
  // Date & Time — from "วันที่ส่งคำสั่ง  19 พ.ค. 69 - 02:22 น."
  // ──────────────────────────────────────────────────────────────────────────
  let date = null;
  let time = "";
  const dateLine = text.match(/วันที่ส่งคำสั่ง[\s\S]{0,120}/) || text.match(/วันที่สำเร็จ[\s\S]{0,120}/);
  if (dateLine) {
    date = parseThaiDate(dateLine[0]);
    time = parseThaiTime(dateLine[0]) || "";
  }
  if (!date) date = parseThaiDate(text);
  if (!date) date = new Date().toISOString().split("T")[0];
  if (!time) time = parseThaiTime(text) || "";

  return {
    symbol:          symbol.toUpperCase(),
    name:            symbol.toUpperCase(),
    category,
    transactionType,
    qty,
    price,
    date,
    time,
  };
}

// ─── Tesseract worker (singleton, reused across images) ────────────────────
let _worker = null;

async function getWorker() {
  if (_worker) return _worker;
  _worker = await createWorker("tha+eng");
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
    if (!parsed || !parsed.symbol || !parsed.qty || !parsed.price) {
      return { success: false, error: "ไม่สามารถอ่านข้อมูลหุ้น จำนวน หรือราคาได้ครบถ้วน", rawText: text };
    }
    return { success: true, ...parsed, rawText: text };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function terminateTesseract() {
  if (_worker) { await _worker.terminate(); _worker = null; }
}
