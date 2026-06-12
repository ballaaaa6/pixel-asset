import React from "react";

const TICKER_TAPE_ITEMS = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^NDX", label: "Nasdaq 100" },
  { symbol: "^RUT", label: "Russell 2000" },
  { symbol: "^SET.BK", label: "SET Index" },
  { symbol: "THB=X", label: "USD/THB" },
  { symbol: "BTC-USD", label: "BTC/USD" },
  { symbol: "GC=F", label: "XAU/USD (Gold)" },
  { symbol: "CL=F", label: "Crude Oil (WTI)" }
];

export default function TickerTape({ prices }) {
  const hasPrices = React.useMemo(() => {
    return TICKER_TAPE_ITEMS.some(item => prices && prices[item.symbol] != null);
  }, [prices]);

  // Ensure there are enough items to fill screen width and loop seamlessly at -50% translation
  const duplicatedList = React.useMemo(() => {
    let list = [...TICKER_TAPE_ITEMS];
    while (list.length < 16) {
      list = [...list, ...TICKER_TAPE_ITEMS];
    }
    return [...list, ...list];
  }, []);

  if (!hasPrices) return null;

  const renderItem = (item, idx) => {
    const pData = prices[item.symbol];
    if (!pData) return null;

    // Use live price: Regular price during market hours, or Pre/Post-market prices outside
    const regPrice = pData.price ?? 0;
    const isPre = pData.marketState === "PRE" || pData.marketState === "PREPRE";
    const isPost = pData.marketState === "POST" || pData.marketState === "POSTPOST";
    const isClosed = pData.marketState === "CLOSED";

    // Extended price: prePrice during PRE, postPrice during POST or CLOSED
    let extPrice = null;
    let extChangePct = null;

    if (isPre && pData.prePrice != null && pData.prePrice > 0) {
      extPrice = pData.prePrice;
      extChangePct = regPrice > 0 ? ((pData.prePrice - regPrice) / regPrice) * 100 : 0;
    } else if ((isPost || isClosed) && pData.postPrice != null && pData.postPrice > 0) {
      extPrice = pData.postPrice;
      extChangePct = regPrice > 0 ? ((pData.postPrice - regPrice) / regPrice) * 100 : 0;
    }

    const price = extPrice ?? regPrice;
    const pctChange = extPrice != null ? extChangePct : (pData.changePercent ?? 0);
    const isUp = pctChange >= 0;

    let priceStr = "";
    if (item.symbol === "THB=X") {
      priceStr = `฿${price.toFixed(2)}`;
    } else if (item.symbol === "^SET.BK") {
      priceStr = `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} จุด`;
    } else if (item.symbol.startsWith("^")) {
      priceStr = `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      priceStr = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const pctStr = `${Math.abs(pctChange).toFixed(2)}%`;

    return (
      <div key={`${item.symbol}-${idx}`} className="ticker-item">
        <span className="ticker-item-symbol">{item.label}</span>
        <span className="ticker-item-price">
          {priceStr}
        </span>
        <span className={`ticker-item-pct ${isUp ? "up" : "down"}`}>
          {isUp ? "▲" : "▼"} {pctStr}
        </span>
      </div>
    );
  };

  return (
    <div className="ticker-tape-container">
      <div className="ticker-track">
        {duplicatedList.map((item, idx) => renderItem(item, idx))}
      </div>
    </div>
  );
}
