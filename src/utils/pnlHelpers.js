import { getRealizedPnL, getCurrencyTicker, getCurrencyPriceUSD, getHistoricalExchangeRate, getRealizedPnLInTHB } from "./assetHelpers";

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
