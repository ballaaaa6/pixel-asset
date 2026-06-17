/**
 * dimePdfParser.js
 * Client-side parser for Dime Transactions History Report PDF and text.
 */

/**
 * Load PDF.js dynamically from CDN to keep bundle size small
 */
export function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js library. Please check your internet connection."));
    document.head.appendChild(script);
  });
}

/**
 * Parse OCC Options Symbol (e.g., RKLB250829C00048000)
 */
export function parseOptionSymbol(symbol) {
  if (!symbol) return null;
  const match = symbol.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
  if (!match) return null;

  const [_, underlying, yy, mm, dd, type, strikeRaw] = match;
  const year = `20${yy}`;
  const strike = parseFloat(strikeRaw) / 1000;

  return {
    underlying,
    expiry: `${year}-${mm}-${dd}`,
    type: type === "C" ? "Call" : "Put",
    strike
  };
}

/**
 * Check if option has expired relative to a given date or today
 */
export function isOptionExpired(expiryDateStr, compareDateStr) {
  const expiry = new Date(expiryDateStr + "T23:59:59");
  const compare = compareDateStr ? new Date(compareDateStr) : new Date();
  return compare > expiry;
}

/**
 * Parse a single line from Dime Transaction PDF
 */
export function parseDimeLine(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 5) return null;

  // Match DD/MM/YYYY date pattern
  const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const matchDate = parts[0].match(datePattern);
  if (!matchDate) return null;

  const type = parts[1];
  if (type !== "BUY" && type !== "SEL") return null;

  const symbol = parts[2].toUpperCase();

  // Clean tokens starting from index 3
  const rawTokens = parts.slice(3);
  const cleanTokens = [];

  for (const tok of rawTokens) {
    const val = tok.replace(/[$,฿]/g, "").replace(/,/g, "").trim();
    if (val === "" || val === "฿" || val === "$") continue;
    cleanTokens.push(val);
  }

  // We find where the Currency token is (USD or THB)
  const ccyIndex = cleanTokens.findIndex(t => t === "USD" || t === "THB");
  if (ccyIndex < 0) return null;

  const orderId = cleanTokens[ccyIndex + 1] || "";
  const units = parseFloat(cleanTokens[0]);
  const price = parseFloat(cleanTokens[1]);

  if (isNaN(units) || isNaN(price)) return null;

  const feeUSD = cleanTokens[4] !== "-" ? parseFloat(cleanTokens[4]) : 0;
  const feeTHB = cleanTokens[5] !== "-" ? parseFloat(cleanTokens[5]) : 0;
  const vat = cleanTokens[6] !== "-" ? parseFloat(cleanTokens[6]) : 0;
  const discount = cleanTokens[7] !== "-" ? parseFloat(cleanTokens[7]) : 0;

  const netUSD = cleanTokens[8] !== "-" ? parseFloat(cleanTokens[8]) : 0;
  const netTHB = cleanTokens[9] !== "-" ? parseFloat(cleanTokens[9]) : 0;

  // Determine actual cost including fee / net values
  const ccy = cleanTokens[ccyIndex];
  
  // Parse option details if it is an option
  const optionDetails = parseOptionSymbol(symbol);

  // Return standard transaction format matching processTransactions schema
  return {
    date: `${matchDate[3]}-${matchDate[2]}-${matchDate[1]}`, // YYYY-MM-DD
    time: "00:00",
    transactionType: type === "BUY" ? "BUY" : "SELL",
    symbol,
    name: optionDetails
      ? `${optionDetails.underlying} ${optionDetails.type} $${optionDetails.strike.toFixed(2)}`
      : symbol,
    qty: units,
    avgPrice: price,
    // Options use category "option"; Thai stocks use "stock"; US stocks use "stock"
    type: optionDetails ? "option" : "stock",
    category: optionDetails ? "option" : "stock",
    broker: "Dime!",
    orderId,
    fee: ccy === "USD" ? feeUSD : feeTHB,
    vat,
    discount,
    netAmount: ccy === "USD" ? netUSD : netTHB,
    ccy,
    optionDetails
  };
}

/**
 * Group text items in a PDF page by y-coordinate to reconstruct rows
 */
export function reconstructPdfLines(items) {
  const linesMap = {};
  for (const item of items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5] * 2) / 2; // round to nearest 0.5px to group properly
    const foundY = Object.keys(linesMap).find(k => Math.abs(parseFloat(k) - y) < 3);
    const key = foundY || String(y);
    if (!linesMap[key]) linesMap[key] = [];
    linesMap[key].push(item);
  }

  // Sort lines from top to bottom (y-coordinate is descending)
  const sortedY = Object.keys(linesMap).map(Number).sort((a, b) => b - a);

  const lines = [];
  for (const y of sortedY) {
    // Sort items in the line from left to right (x-coordinate is transform[4])
    const lineItems = linesMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
    lines.push(lineItems.map(i => i.str).join(" "));
  }

  return lines;
}

/**
 * Main parser function to extract transactions from Dime Report PDF
 */
export async function parseDimePdfReport(file) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allTransactions = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = reconstructPdfLines(textContent.items);
    
    for (const line of pageLines) {
      const parsed = parseDimeLine(line);
      if (parsed) {
        allTransactions.push(parsed);
      }
    }
  }

  return allTransactions;
}

/**
 * Alternative text-paste parser
 */
export function parseDimeTextReport(text) {
  const lines = text.split("\n");
  const allTransactions = [];
  for (const line of lines) {
    const parsed = parseDimeLine(line);
    if (parsed) {
      allTransactions.push(parsed);
    }
  }
  return allTransactions;
}

/**
 * Automate expiration of options contracts.
 * Adds a virtual $0.00 SELL transaction lot on expiry date if not closed.
 */
export function autoExpirePortfolioOptions(assets) {
  let changed = false;
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const updated = assets.map(asset => {
    const optionDetails = parseOptionSymbol(asset.symbol);
    if (optionDetails && asset.qty > 0) {
      if (isOptionExpired(optionDetails.expiry, todayStr)) {
        const expiredQty = asset.qty;
        const newLot = {
          id: Math.random().toString(36).substr(2, 9),
          date: optionDetails.expiry,
          time: "23:59",
          qty: -expiredQty,
          price: 0,
          type: "SELL",
          isAutoExpired: true
        };

        const currentLots = asset.lots || [];
        const alreadyExpired = currentLots.some(l => l.isAutoExpired);
        if (!alreadyExpired) {
          const updatedLots = [...currentLots, newLot].sort((a, b) => new Date(a.date + "T" + (a.time || "00:00")) - new Date(b.date + "T" + (b.time || "00:00")));
          changed = true;
          return {
            ...asset,
            lots: updatedLots,
            qty: 0,
            avgCost: asset.avgCost
          };
        }
      }
    }
    return asset;
  });

  return { updated, changed };
}

