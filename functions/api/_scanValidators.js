export const SYSTEM_PROMPT = `You are an expert OCR transcription tool for Dime! (by SCB) and Webull Thailand trading receipts.
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

export function parseNumeric(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[$,฿]/g, "")
    .replace(/,/g, "")
    .replace(/[^0-9.]/g, "")
    .trim();
  return parseFloat(cleaned) || 0;
}

export function crossValidateShareAmount(shareAmount, actualPrice) {
  if (actualPrice <= 0 || shareAmount <= 0) return shareAmount;

  const product = shareAmount * actualPrice;
  if (product > 500000) {
    const corrected = shareAmount / actualPrice;
    if (corrected > 0.0001) {
      return parseFloat(corrected.toFixed(8));
    }
  }
  return shareAmount;
}

export function parseWebullDateTimeToThaiISO(rawStr) {
  if (!rawStr) return "";
  const match = rawStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return "";
  const day = match[1];
  const month = match[2];
  const year = match[3];
  const hour = match[4];
  const minute = match[5];
  const second = match[6];
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

export function parseThaiDateToISO(rawStr) {
  if (!rawStr) return "";
  
  if (rawStr.includes("/") && (rawStr.toLowerCase().includes("edt") || rawStr.toLowerCase().includes("est") || rawStr.toLowerCase().includes("gmt") || /^[0-9\/\s:]+$/.test(rawStr))) {
    const webullISO = parseWebullDateTimeToThaiISO(rawStr);
    if (webullISO) return webullISO;
  }

  const cleaned = rawStr.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  if (parts.length < 3) return "";

  const monthsMap = {
    "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04", "พ.ค.": "05", "มิ.ย.": "06",
    "ก.ค.": "07", "ส.ค.": "08", "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
    "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12"
  };

  const dayStr = parts[0].replace(/[^0-9]/g, "");
  const day = dayStr.padStart(2, "0");

  let monthStr = parts[1].toLowerCase().replace(/\./g, "");
  let month = monthsMap[monthStr] || monthsMap[monthStr + "."] || "01";

  let yearVal = parseInt(parts[2].replace(/[^0-9]/g, ""), 10);
  if (yearVal > 2500) {
    yearVal -= 543;
  }
  const year = String(yearVal);

  let time = "00:00:00";
  if (parts[3] && parts[3].includes(":")) {
    time = parts[3].replace(/[^0-9:]/g, "");
    if (time.split(":").length === 2) time += ":00";
  }

  return `${year}-${month}-${day}T${time}.000Z`;
}

export function validateSlipData(raw) {
  if (!raw || typeof raw !== "object") return null;

  let action = "";
  const header = String(raw.header_text || "").toLowerCase();
  const status = String(raw.status_text || "").toLowerCase();
  const bold = String(raw.bold_amount || "").toLowerCase();
  const color = String(raw.header_color || "").toLowerCase();
  const allText = JSON.stringify(raw).toLowerCase();

  const webullOrder = String(raw.webull_order_type || "").toLowerCase();
  if (webullOrder.includes("ซื้อ") || webullOrder.includes("buy")) {
    action = "BUY";
  } else if (webullOrder.includes("ขาย") || webullOrder.includes("sell")) {
    action = "SELL";
  }

  const hasCashBack = raw.has_received_cash_back_label === true || raw.has_received_cash_back_label === "true";
  const hasPayment = raw.has_payment_amount_label === true || raw.has_payment_amount_label === "true";

  if (hasCashBack && !hasPayment) {
    action = "SELL";
  } else if (hasPayment && !hasCashBack) {
    action = "BUY";
  }

  if (!action) {
    if (color.includes("red") || color.includes("pink") || color.includes("purple")) {
      action = "SELL";
    } else if (color.includes("green")) {
      action = "BUY";
    }
  }

  if (!action) {
    if (header.includes("ซื้อ") || header.includes("buy")) {
      action = "BUY";
    } else if (header.includes("ขาย") || header.includes("sell")) {
      action = "SELL";
    }
  }

  if (!action) {
    if (status.includes("ขายคืน") || status.includes("รับเงินค่าขาย")) {
      action = "SELL";
    } else if (status.includes("ซื้อ") || status.includes("รับหุ้น") || status.includes("จับคู่")) {
      action = "BUY";
    }
  }

  if (!action) {
    if (bold.includes("หุ้น") || bold.includes("หน่วย")) {
      action = "SELL";
    } else if (bold.includes("usd") || bold.includes("฿") || bold.includes("thb")) {
      action = "BUY";
    }
  }

  if (!action) {
    if (allText.includes("ขายคืน") || allText.includes("ขาย") || allText.includes("sell") || allText.includes("ยอดที่จะได้รับคืน")) {
      action = "SELL";
    } else if (allText.includes("ซื้อ") || allText.includes("buy") || allText.includes("จับคู่") || allText.includes("ยอดที่ต้องชำระ")) {
      action = "BUY";
    } else {
      action = "BUY";
    }
  }

  let broker = String(raw.broker || "").trim();
  const isWebull = broker.toLowerCase().includes("webull") || allText.includes("webull");
  if (isWebull) {
    broker = "Webull";
  } else {
    broker = "Dime!";
  }

  let symbol = String(raw.symbol || "").trim().toUpperCase();
  if (!symbol && header) {
    const match = header.match(/(?:ซื้อ|ขาย|buy|sell)\s*([A-Z0-9.\-]+)/i);
    if (match) {
      symbol = match[1].toUpperCase();
    }
  }
  symbol = symbol.replace(/[^A-Z0-9.\-]/g, "");
  if (!symbol || /^\d+$/.test(symbol)) return null;

  const price = parseNumeric(raw.actual_price);
  const stockValue = parseNumeric(raw.stock_value);
  const qtyTable = parseNumeric(raw.qty_table);
  const boldNum = parseNumeric(raw.bold_amount);
  const boldText = String(raw.bold_amount || "").toLowerCase();

  let exchangeRate = 0;
  if (raw.exchange_rate && raw.exchange_rate !== "N/A") {
    const rateMatch = String(raw.exchange_rate).match(/(\d{2,3}(?:\.\d+)?)/);
    if (rateMatch) {
      exchangeRate = parseFloat(rateMatch[1]);
    }
  }

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

  let share_amount = 0;

  if (isWebull) {
    share_amount = qtyTable > 0 ? qtyTable : (boldNum > 0 ? boldNum : 0);
  } else {
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

export function parseTimestamp(ts) {
  if (!ts) return { date: new Date().toISOString().split("T")[0], time: "" };
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return { date: new Date().toISOString().split("T")[0], time: "" };
    const iso = d.toISOString(); // YYYY-MM-DDTHH:MM:SS.SSSZ
    const date = iso.split("T")[0];
    const time = iso.split("T")[1].slice(0, 5); // HH:MM
    return { date, time };
  } catch {
    return { date: new Date().toISOString().split("T")[0], time: "" };
  }
}
