import { getRealizedPnL, getRealizedPnLInTHB, computeSingleAssetData } from "./assetHelpers";
import { CATEGORY_LABELS } from "./constants";

export function calculatePortfolioValuation({ assets, prices, exchangeRate, sortConfig, historicalRates }) {
  if (!assets.length) {
    return {
      totalUSD: 0,
      totalCostUSD: 0,
      todayChangeUSD: 0,
      totalRealizedUSD: 0,
      totalRealizedTHB: 0,
      bestAsset: null,
      sortedAssets: [],
      donutSegments: [],
      initialCapitalUSD: 0,
      totalUnrealizedUSD: 0,
      totalUnrealizedTHB: 0,
      totalGainTHB: 0,
      totalGainUSD: 0,
      totalGainPct: 0,
      todayChangePct: 0
    };
  }

  let totVal = 0, totCost = 0, totToday = 0, totRealized = 0, totRealizedTHB = 0;
  let bestSym = null, bestPct = -Infinity;

  const computed = assets.map(a => {
    const c = computeSingleAssetData(a, prices, exchangeRate);
    totVal += c.valueUSD;
    totCost += c.costUSD;
    totToday += c.todayChg;

    const isThai = a.symbol.toUpperCase().endsWith(".BK");
    const rawRealized = getRealizedPnL(a.lots || [], isThai, exchangeRate);
    const realized = rawRealized - (a.clearedRealizedUSD || 0);
    totRealized += realized;

    const rawRealizedTHB = getRealizedPnLInTHB(a.lots || [], isThai, historicalRates, exchangeRate);
    const realizedTHB = rawRealizedTHB - (a.clearedRealizedTHB || 0);
    totRealizedTHB += realizedTHB;

    const assetWithPnL = {
      ...a, ...c,
      realizedPnL: realized,
      realizedPnLTHB: realizedTHB,
      unrealizedPnL: a.qty > 0 ? (c.valueUSD - c.costUSD) : 0,
      totalPnL: realized + (a.qty > 0 ? (c.valueUSD - c.costUSD) : 0)
    };

    if (c.gainPct > bestPct && a.qty > 0 && (a.avgCost > 0 || a.avgPrice > 0)) {
      bestPct = c.gainPct;
      bestSym = a;
    }
    return assetWithPnL;
  });

  const activeAssets = computed.filter(a => a.qty > 0.00001);
  const sorted = [...activeAssets].sort((a, b) => {
    if (!sortConfig.key) return b.valueUSD - a.valueUSD;
    const dir = sortConfig.dir === "asc" ? 1 : -1;
    switch (sortConfig.key) {
      case "value" : return dir * (a.valueUSD - b.valueUSD);
      case "gain" : return dir * (a.gainPct - b.gainPct);
      case "today" : return dir * (a.todayPct - b.todayPct);
      case "symbol" : return dir * a.symbol.localeCompare(b.symbol);
      default : return 0;
    }
  });

  const catMap = {};
  activeAssets.forEach(a => {
    const cat = a.category || "stock";
    catMap[cat] = (catMap[cat] || 0) + a.valueUSD;
  });
  const donut = Object.entries(catMap)
    .map(([cat, val]) => ({ id: cat, label: CATEGORY_LABELS[cat] || cat, pct: totVal > 0 ? (val / totVal) * 100 : 0, value: val }))
    .filter(s => s.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  let sumBuys = 0, hasBuys = false;
  assets.forEach(a => {
    if (a.type !== "fiat" && a.category !== "fiat") {
      const isThai = a.symbol.toUpperCase().endsWith(".BK");
      (a.lots || []).forEach(l => {
        if (l.qty > 0) {
          sumBuys += l.qty * (isThai ? l.price / exchangeRate : l.price);
          hasBuys = true;
        }
      });
    }
  });
  const initialCap = (hasBuys && sumBuys > 0) ? sumBuys : totCost;
  const totalUnrealizedUSD = totVal - totCost;
  const totalUnrealizedTHB = totalUnrealizedUSD * exchangeRate;
  const totalGainTHB = totalUnrealizedTHB + totRealizedTHB;
  const totalGainUSD = totalUnrealizedUSD + totRealized;
  const totalGainPct = initialCap > 0 ? (totalGainUSD / initialCap) * 100 : 0;
  const todayChangePct = totCost > 0 ? (totToday / (totVal - totToday)) * 100 : 0;

  return {
    totalUSD: totVal,
    totalCostUSD: totCost,
    todayChangeUSD: totToday,
    totalRealizedUSD: totRealized,
    totalRealizedTHB: totRealizedTHB,
    bestAsset: bestSym ? { symbol: bestSym.symbol, pct: bestPct } : null,
    sortedAssets: sorted,
    donutSegments: donut,
    initialCapitalUSD: initialCap,
    totalUnrealizedUSD,
    totalUnrealizedTHB,
    totalGainTHB,
    totalGainUSD,
    totalGainPct,
    todayChangePct
  };
}
