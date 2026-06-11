import { getRealizedPnL, getCurrencyTicker, getCurrencyPriceUSD } from "./assetHelpers";

/**
 * Helper to match exchange rate at a historical transaction date.
 */
export function getHistoricalRate(dateStr, historicalRates, exchangeRate) {
  if (!dateStr) return exchangeRate;
  const targetDate = dateStr.split("T")[0];
  if (historicalRates && historicalRates[targetDate]) {
    return historicalRates[targetDate];
  }
  const dates = Object.keys(historicalRates || {}).sort();
  if (dates.length === 0) return exchangeRate;
  let bestRate = exchangeRate;
  for (const d of dates) {
    if (d <= targetDate) {
      bestRate = historicalRates[d];
    } else {
      break;
    }
  }
  return bestRate;
}

/**
 * Calculates total realized PnL in THB using FIFO/historical exchange rates.
 */
export function getRealizedPnLInTHB(lots, isThai, historicalRates, exchangeRate) {
  if (!lots || !lots.length) return 0;
  const sortedLots = [...lots].sort((a, b) => new Date(a.date) - new Date(b.date));
  let realizedTHB = 0;
  let currentQty = 0;
  let currentAvgCostUSD = 0;
  for (const lot of sortedLots) {
    const lotQty = lot.qty;
    let lotPriceUSD = lot.price || 0;
    const txRate = getHistoricalRate(lot.date, historicalRates, exchangeRate);
    if (isThai && txRate) {
      lotPriceUSD = lotPriceUSD / txRate;
    }
    if (lotQty > 0) {
      const newQty = currentQty + lotQty;
      const newCost = (currentQty * currentAvgCostUSD) + (lotQty * lotPriceUSD);
      currentAvgCostUSD = newQty > 0 ? newCost / newQty : 0;
      currentQty = newQty;
    } else if (lotQty < 0) {
      const sellQty = Math.abs(lotQty);
      const gainUSD = (lotPriceUSD - currentAvgCostUSD) * sellQty;
      const gainTHB = gainUSD * txRate;
      realizedTHB += gainTHB;
      currentQty = Math.max(0, currentQty - sellQty);
    }
  }
  return realizedTHB;
}

/**
 * Computes valuation and profit/loss metrics for an asset.
 */
export function computeAssetMetrics(asset, prices, exchangeRate, historicalRates) {
  const isThai = asset.symbol.toUpperCase().endsWith(".BK");
  const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

  let priceUSD = 0;
  if (isCashAsset) {
    const ticker = getCurrencyTicker(asset.symbol);
    const p = prices[ticker]?.price;
    priceUSD = getCurrencyPriceUSD(asset.symbol, p, exchangeRate);
  } else {
    const p = prices[asset.symbol]?.price ?? 0;
    priceUSD = isThai ? p / exchangeRate : p;
  }

  const valueUSD = priceUSD * asset.qty;
  const avgCost = asset.avgCost ?? asset.avgPrice ?? 0;
  const costUSD = isCashAsset ? avgCost * asset.qty : (avgCost * asset.qty / (isThai ? exchangeRate : 1));
  const unrealized = asset.qty > 0 ? (valueUSD - costUSD) : 0;

  // Realized
  const rawRealized = getRealizedPnL(asset.lots || [], isThai, exchangeRate);
  const rawRealizedTHB = getRealizedPnLInTHB(asset.lots || [], isThai, historicalRates, exchangeRate);
  const realized = rawRealized - (asset.clearedRealizedUSD || 0);
  const realizedTHB = rawRealizedTHB - (asset.clearedRealizedTHB || 0);

  // Initial Capital (cumulative buys)
  let totalInvested = 0;
  (asset.lots || []).forEach(l => {
    if (l.qty > 0) {
      const pUSD = isThai ? l.price / exchangeRate : l.price;
      totalInvested += l.qty * pUSD;
    }
  });
  if (totalInvested === 0 && asset.qty > 0) {
    totalInvested = costUSD;
  }

  const totalPnL = realized + unrealized;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    valueUSD,
    totalInvested,
    realized,
    realizedTHB,
    unrealized,
    totalPnL,
    totalPnLPct
  };
}
