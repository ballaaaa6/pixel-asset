const SECTOR_MAPPING = {
  // US tech/telecom
  "AAPL": "Technology", "MSFT": "Technology", "NVDA": "Technology", "GOOGL": "Technology", "GOOG": "Technology", 
  "META": "Technology", "TSLA": "Technology", "NFLX": "Technology", "AMZN": "Technology", "AVGO": "Technology",
  "CSCO": "Technology", "ORCL": "Technology", "MU": "Technology", "SNDK": "Technology", "AMD": "Technology",
  "INTC": "Technology", "TSM": "Technology", "ASML": "Technology", "QCOM": "Technology",
  "T": "Telecom", "VZ": "Telecom", "CMCSA": "Telecom",
  // US Financials
  "JPM": "Financials", "BAC": "Financials", "WFC": "Financials", "MS": "Financials", "GS": "Financials", "C": "Financials", "V": "Financials", "MA": "Financials",
  // US REITs
  "O": "Real Estate (REIT)", "AMT": "Real Estate (REIT)", "PLD": "Real Estate (REIT)", "CCI": "Real Estate (REIT)", "WY": "Real Estate (REIT)", "EQIX": "Real Estate (REIT)", "PSA": "Real Estate (REIT)", "SPG": "Real Estate (REIT)", "VICI": "Real Estate (REIT)",
  // US Consumer/Staples
  "KO": "Consumer Goods", "PEP": "Consumer Goods", "COST": "Consumer Goods", "WMT": "Consumer Goods", "PG": "Consumer Goods", "NKE": "Consumer Goods", "MCD": "Consumer Goods", "SBUX": "Consumer Goods", "HD": "Consumer Goods", "LOW": "Consumer Goods", "CL": "Consumer Goods",
  // US Healthcare
  "JNJ": "Healthcare", "PFE": "Healthcare", "MRK": "Healthcare", "ABBV": "Healthcare", "LLY": "Healthcare", "UNH": "Healthcare", "ABT": "Healthcare", "BMY": "Healthcare", "GILD": "Healthcare",
  // US Energy/Utilities/Industrials
  "XOM": "Energy & Utilities", "CVX": "Energy & Utilities", "COP": "Energy & Utilities", "NEE": "Energy & Utilities", "DUK": "Energy & Utilities", "SO": "Energy & Utilities",
  "CAT": "Industrials", "GE": "Industrials", "HON": "Industrials", "MMM": "Industrials", "UNP": "Industrials", "LMT": "Industrials",
  
  // Thai stocks (matching standard Thai listing styles or BK suffix)
  "SCB.BK": "Financials", "KBANK.BK": "Financials", "BBL.BK": "Financials", "TISCO.BK": "Financials", "KTB.BK": "Financials", "KKP.BK": "Financials",
  "PTT.BK": "Energy & Utilities", "PTTEP.BK": "Energy & Utilities", "EGCO.BK": "Energy & Utilities", "RATCH.BK": "Energy & Utilities", "TOP.BK": "Energy & Utilities", "BANPU.BK": "Energy & Utilities", "SPRC.BK": "Energy & Utilities", "IRPC.BK": "Energy & Utilities", "BCPG.BK": "Energy & Utilities",
  "ADVANC.BK": "Telecom", "INTUCH.BK": "Telecom", "TRUE.BK": "Telecom",
  "CPALL.BK": "Consumer Goods", "CPF.BK": "Consumer Goods", "BJC.BK": "Consumer Goods", "CPAXT.BK": "Consumer Goods", "HMPRO.BK": "Consumer Goods", "OR.BK": "Consumer Goods", "TU.BK": "Consumer Goods",
  "BDMS.BK": "Healthcare", "BH.BK": "Healthcare", "BCH.BK": "Healthcare", "CHG.BK": "Healthcare",
  "SCC.BK": "Industrials", "AOT.BK": "Industrials", "GULF.BK": "Energy & Utilities", "CPN.BK": "Real Estate (REIT)", "LH.BK": "Real Estate (REIT)", "AP.BK": "Real Estate (REIT)", "SPALI.BK": "Real Estate (REIT)", "QH.BK": "Real Estate (REIT)", "SIRI.BK": "Real Estate (REIT)", "WHA.BK": "Real Estate (REIT)", "AMATA.BK": "Real Estate (REIT)"
};

const KINGS = new Set(["KO", "PEP", "PG", "JNJ", "MMM", "CL", "LOW"]);
const ARISTOCRATS = new Set(["O", "ABBV", "T", "MCD", "XOM", "CVX", "CAT", "NEE"]);

export function calculateDividendProjections(assets, prices, dividendData, exchangeRate = 35) {
  const stockAssets = assets.filter(
    a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat"
  );

  let totalAnnualIncomeUSD = 0;
  let totalStockValueUSD = 0;
  const computedAssets = [];
  const upcomingPayments = [];

  // Monthly buckets for the next 12 months starting from current month
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth(); // 0 - 11
  const currentYear = currentDate.getFullYear();

  const next12Months = [];
  for (let i = 0; i < 12; i++) {
    const m = (currentMonthIndex + i) % 12;
    const y = currentYear + Math.floor((currentMonthIndex + i) / 12);
    next12Months.push({ month: m, year: y, value: 0, payments: [] });
  }

  stockAssets.forEach(asset => {
    const pData = prices[asset.symbol];
    const priceUSD = pData?.price || 0;
    const valueUSD = priceUSD * asset.qty;
    totalStockValueUSD += valueUSD;

    // Get asset details
    const cleanSym = asset.symbol.toUpperCase();
    const isThai = cleanSym.endsWith(".BK");
    const avgCost = asset.avgCost ?? asset.avgPrice ?? 0;
    const avgCostUSD = isThai ? avgCost / (exchangeRate || 35.0) : avgCost;

    // Classify Sector
    let sector = "Other";
    if (SECTOR_MAPPING[cleanSym]) {
      sector = SECTOR_MAPPING[cleanSym];
    } else if (isThai) {
      if (cleanSym.includes("PTT")) sector = "Energy & Utilities";
      else if (cleanSym.includes("REIT") || cleanSym.includes("PF") || ["LH.BK", "AP.BK", "SPALI.BK", "SIRI.BK"].some(x => cleanSym.startsWith(x))) sector = "Real Estate (REIT)";
      else if (["SCB.BK", "KBANK.BK", "BBL.BK", "TISCO.BK", "KTB.BK", "KKP.BK"].includes(cleanSym)) sector = "Financials";
      else sector = "Other";
    } else {
      if (asset.type === "reit" || asset.category === "reit" || cleanSym.includes("REIT")) {
        sector = "Real Estate (REIT)";
      }
    }

    const events = dividendData?.[asset.symbol];
    if (!events) {
      computedAssets.push({
        ...asset,
        priceUSD,
        valueUSD,
        avgCostUSD,
        annualRate: 0,
        annualIncomeUSD: 0,
        yieldPct: 0,
        yieldOnCostPct: 0,
        frequency: "N/A",
        sector,
        divProfileType: "Dividend Grower",
        payoutRatio: 0,
        safetyRating: "Safe",
        safetyScoreContribution: 100
      });
      return;
    }

    // Convert events map to array and sort by date descending
    const eventList = Object.values(events).sort((a, b) => b.date - a.date);
    if (eventList.length === 0) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const oneYearAgoSec = nowSec - 365 * 24 * 60 * 60;
    
    // Filter dividends paid in the last 1 year
    const lastYearDividends = eventList.filter(e => e.date >= oneYearAgoSec);
    
    let annualRate = 0;
    let frequencyCount = lastYearDividends.length;
    
    if (frequencyCount > 0) {
      annualRate = lastYearDividends.reduce((sum, e) => sum + (e.amount || 0), 0);
    } else {
      // Fallback: use last dividend amount and guess frequency
      const lastDiv = eventList[0];
      annualRate = (lastDiv?.amount || 0) * 4; // default to quarterly
      frequencyCount = 4;
    }

    const frequencyText = 
      frequencyCount >= 12 ? "รายเดือน" :
      frequencyCount >= 4 ? "รายไตรมาส" :
      frequencyCount >= 2 ? "ครึ่งปี" :
      frequencyCount === 1 ? "รายปี" : "ไม่แน่นอน";

    const annualIncomeUSD = annualRate * asset.qty;
    const yieldPct = priceUSD > 0 ? (annualRate / priceUSD) * 100 : 0;
    const yieldOnCostPct = avgCostUSD > 0 ? (annualRate / avgCostUSD) * 100 : 0;

    // Dividend Profile Classification
    let divProfileType = "Dividend Grower";
    if (KINGS.has(cleanSym)) {
      divProfileType = "Dividend King";
    } else if (ARISTOCRATS.has(cleanSym)) {
      divProfileType = "Dividend Aristocrat";
    } else if (yieldPct > 5.5) {
      divProfileType = "High Yield";
    }

    // Estimated Payout Ratio & Safety Rating
    let payoutRatio = 0;
    let safetyRating = "Safe";
    let safetyScoreContribution = 100;

    const isREIT = sector === "Real Estate (REIT)" || asset.type === "reit";

    if (isREIT) {
      // REITs normally have high payout ratio (around 80-95%)
      payoutRatio = Math.min(Math.round(80 + yieldPct * 1.5), 98);
      if (yieldPct > 10.0) {
        safetyRating = "Warning";
        safetyScoreContribution = 40;
      } else if (yieldPct > 7.5) {
        safetyRating = "Moderate";
        safetyScoreContribution = 75;
      } else {
        safetyRating = "Safe";
        safetyScoreContribution = 100;
      }
    } else {
      // Regular stocks
      if (sector === "Technology") {
        payoutRatio = Math.min(Math.round(15 + yieldPct * 3.5), 65);
      } else {
        payoutRatio = Math.min(Math.round(35 + yieldPct * 5.0), 95);
      }

      if (yieldPct > 8.0 || payoutRatio > 85) {
        safetyRating = "Warning";
        safetyScoreContribution = 30;
      } else if (yieldPct > 5.0 || payoutRatio > 70) {
        safetyRating = "Moderate";
        safetyScoreContribution = 70;
      } else {
        safetyRating = "Safe";
        safetyScoreContribution = 100;
      }
    }

    totalAnnualIncomeUSD += annualIncomeUSD;

    computedAssets.push({
      ...asset,
      priceUSD,
      valueUSD,
      avgCostUSD,
      annualRate,
      annualIncomeUSD,
      yieldPct,
      yieldOnCostPct,
      frequency: frequencyText,
      sector,
      divProfileType,
      payoutRatio,
      safetyRating,
      safetyScoreContribution
    });

    // Project payouts for the next 12 months based on historical months
    const historicalMonths = new Set();
    lastYearDividends.forEach(e => {
      const d = new Date(e.date * 1000);
      historicalMonths.add(d.getMonth());
    });

    // If no dividends in past year, fallback to last dividend's month
    if (historicalMonths.size === 0 && eventList.length > 0) {
      const d = new Date(eventList[0].date * 1000);
      historicalMonths.add(d.getMonth());
    }

    const lastAmount = eventList[0]?.amount || 0;
    const payoutPerCycle = lastAmount * asset.qty;

    next12Months.forEach(target => {
      if (historicalMonths.has(target.month)) {
        target.value += payoutPerCycle;
        target.payments.push({
          symbol: asset.symbol,
          qty: asset.qty,
          amountPerShare: lastAmount,
          estPayoutUSD: payoutPerCycle
        });
      }
    });

    // Project next upcoming payment
    if (eventList.length > 0 && frequencyCount > 0) {
      const lastEvent = eventList[0];
      const cycleDays = 365 / (frequencyCount || 4);
      
      let estExDateSec = lastEvent.date;
      while (estExDateSec <= nowSec) {
        estExDateSec += cycleDays * 24 * 60 * 60;
      }

      upcomingPayments.push({
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        estExDate: new Date(estExDateSec * 1000),
        amountPerShare: lastAmount,
        estPayoutUSD: payoutPerCycle
      });
    }
  });

  // Sort upcoming payments by date ascending
  upcomingPayments.sort((a, b) => a.estExDate - b.estExDate);

  const averageYield = totalStockValueUSD > 0 ? (totalAnnualIncomeUSD / totalStockValueUSD) * 100 : 0;
  const avgMonthlyIncomeUSD = totalAnnualIncomeUSD / 12;

  // 1. Sector Breakdown Aggregation
  const sectorMap = {};
  computedAssets.forEach(a => {
    if (a.annualIncomeUSD > 0) {
      sectorMap[a.sector] = (sectorMap[a.sector] || 0) + a.annualIncomeUSD;
    }
  });
  const sectorBreakdown = Object.keys(sectorMap).map(sect => ({
    name: sect,
    amountUSD: sectorMap[sect],
    pct: totalAnnualIncomeUSD > 0 ? (sectorMap[sect] / totalAnnualIncomeUSD) * 100 : 0
  })).sort((a, b) => b.amountUSD - a.amountUSD);

  // 2. Profile Type Breakdown Aggregation
  const typeMap = {};
  computedAssets.forEach(a => {
    if (a.annualIncomeUSD > 0) {
      typeMap[a.divProfileType] = (typeMap[a.divProfileType] || 0) + a.annualIncomeUSD;
    }
  });
  const typeBreakdown = Object.keys(typeMap).map(t => ({
    name: t,
    amountUSD: typeMap[t],
    pct: totalAnnualIncomeUSD > 0 ? (typeMap[t] / totalAnnualIncomeUSD) * 100 : 0
  })).sort((a, b) => b.amountUSD - a.amountUSD);

  // 3. Safety Score & Flags
  let safetyScore = 100;
  let flaggedCount = 0;
  const dividendPayingAssets = computedAssets.filter(a => a.annualIncomeUSD > 0);
  if (dividendPayingAssets.length > 0) {
    const totalScoreContrib = dividendPayingAssets.reduce((sum, a) => sum + (a.safetyScoreContribution * a.annualIncomeUSD), 0);
    safetyScore = Math.round(totalScoreContrib / totalAnnualIncomeUSD);
    flaggedCount = dividendPayingAssets.filter(a => a.safetyRating === "Warning").length;
  }

  // 4. Yield on Cost Leaderboard
  const yocLeaderboard = [...dividendPayingAssets]
    .map(a => ({
      ...a,
      yocDiff: a.yieldOnCostPct - a.yieldPct
    }))
    .sort((a, b) => b.yieldOnCostPct - a.yieldOnCostPct);

  return {
    computedAssets,
    upcomingPayments: upcomingPayments.slice(0, 5), // top 5
    next12Months,
    totalAnnualIncomeUSD,
    totalStockValueUSD,
    averageYield,
    avgMonthlyIncomeUSD,
    sectorBreakdown,
    typeBreakdown,
    safetyScore,
    flaggedCount,
    yocLeaderboard
  };
}
