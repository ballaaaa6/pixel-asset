export const SECTOR_MAPPING = {
  "AAPL": "Technology", "MSFT": "Technology", "NVDA": "Technology", "GOOGL": "Technology", "GOOG": "Technology", 
  "META": "Technology", "TSLA": "Consumer Goods", "NFLX": "Technology", "AMZN": "Consumer Goods", "AVGO": "Technology",
  "CSCO": "Technology", "ORCL": "Technology", "T": "Telecom", "VZ": "Telecom", "CMCSA": "Telecom",
  "JPM": "Financials", "BAC": "Financials", "WFC": "Financials", "MS": "Financials", "GS": "Financials", "C": "Financials", "V": "Financials", "MA": "Financials",
  "O": "Real Estate (REIT)", "AMT": "Real Estate (REIT)", "PLD": "Real Estate (REIT)", "CCI": "Real Estate (REIT)", "WY": "Real Estate (REIT)", "EQIX": "Real Estate (REIT)", "PSA": "Real Estate (REIT)", "SPG": "Real Estate (REIT)", "VICI": "Real Estate (REIT)",
  "KO": "Consumer Goods", "PEP": "Consumer Goods", "COST": "Consumer Goods", "WMT": "Consumer Goods", "PG": "Consumer Goods", "NKE": "Consumer Goods", "MCD": "Consumer Goods", "SBUX": "Consumer Goods", "HD": "Consumer Goods", "LOW": "Consumer Goods", "CL": "Consumer Goods",
  "JNJ": "Healthcare", "PFE": "Healthcare", "MRK": "Healthcare", "ABBV": "Healthcare", "LLY": "Healthcare", "UNH": "Healthcare", "ABT": "Healthcare", "BMY": "Healthcare", "GILD": "Healthcare",
  "XOM": "Energy & Utilities", "CVX": "Energy & Utilities", "COP": "Energy & Utilities", "NEE": "Energy & Utilities", "DUK": "Energy & Utilities", "SO": "Energy & Utilities",
  "CAT": "Industrials", "GE": "Industrials", "HON": "Industrials", "MMM": "Industrials", "UNP": "Industrials", "LMT": "Industrials",
  "SCB.BK": "Financials", "KBANK.BK": "Financials", "BBL.BK": "Financials", "TISCO.BK": "Financials", "KTB.BK": "Financials", "KKP.BK": "Financials",
  "PTT.BK": "Energy & Utilities", "PTTEP.BK": "Energy & Utilities", "EGCO.BK": "Energy & Utilities", "RATCH.BK": "Energy & Utilities", "TOP.BK": "Energy & Utilities", "BANPU.BK": "Energy & Utilities", "SPRC.BK": "Energy & Utilities", "IRPC.BK": "Energy & Utilities", "BCPG.BK": "Energy & Utilities",
  "ADVANC.BK": "Telecom", "INTUCH.BK": "Telecom", "TRUE.BK": "Telecom",
  "CPALL.BK": "Consumer Goods", "CPF.BK": "Consumer Goods", "BJC.BK": "Consumer Goods", "CPAXT.BK": "Consumer Goods", "HMPRO.BK": "Consumer Goods", "OR.BK": "Consumer Goods", "TU.BK": "Consumer Goods",
  "BDMS.BK": "Healthcare", "BH.BK": "Healthcare", "BCH.BK": "Healthcare", "CHG.BK": "Healthcare",
  "SCC.BK": "Industrials", "AOT.BK": "Industrials", "GULF.BK": "Energy & Utilities", "CPN.BK": "Real Estate (REIT)", "LH.BK": "Real Estate (REIT)", "AP.BK": "Real Estate (REIT)", "SPALI.BK": "Real Estate (REIT)", "QH.BK": "Real Estate (REIT)", "SIRI.BK": "Real Estate (REIT)", "WHA.BK": "Real Estate (REIT)", "AMATA.BK": "Real Estate (REIT)"
};

export const getSector = (symbol) => {
  const cleanSym = symbol ? symbol.toUpperCase().trim() : "";
  if (SECTOR_MAPPING[cleanSym]) return SECTOR_MAPPING[cleanSym];
  if (cleanSym.includes("PTT")) return "Energy & Utilities";
  if (cleanSym.includes("REIT") || cleanSym.includes("PF") || ["LH.BK", "AP.BK", "SPALI.BK", "SIRI.BK"].some(x => cleanSym.startsWith(x))) return "Real Estate (REIT)";
  if (["SCB.BK", "KBANK.BK", "BBL.BK", "TISCO.BK", "KTB.BK", "KKP.BK"].some(x => cleanSym.startsWith(x))) return "Financials";
  return cleanSym.endsWith(".BK") ? "Other (TH)" : "Other";
};

export const getSectorColor = (sectorName) => {
  const mapping = {
    "Technology": "#3B82F6", "Financials": "#8B5CF6", "Consumer Goods": "#F59E0B", "Healthcare": "#EC4899",
    "Real Estate (REIT)": "#10B981", "Energy & Utilities": "#14B8A6", "Telecom": "#06B6D4",
    "Industrials": "#64748B", "Other": "#94A3B8", "Other (TH)": "#B0BEC5"
  };
  return mapping[sectorName] || "var(--primary)";
};

export const getCorrelation = (sym1, sym2) => {
  if (sym1 === sym2) return 1.0;
  const sorted = [sym1, sym2].sort().join("-");
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = sorted.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = ((Math.abs(hash) % 201) - 100) / 100;
  return parseFloat(val.toFixed(2));
};

export const getSectorBeta = (sectorName) => {
  const mapping = {
    "Technology": 1.25,
    "Financials": 1.10,
    "Consumer Goods": 0.85,
    "Healthcare": 0.75,
    "Real Estate (REIT)": 0.65,
    "Energy & Utilities": 0.80,
    "Telecom": 0.70,
    "Industrials": 1.05,
    "Other": 1.00,
    "Other (TH)": 1.00
  };
  return mapping[sectorName] || 1.00;
};

