import React from "react";
import { getDisplaySymbol } from "../../utils/assetHelpers";

export default function TickerTape({ assets, prices }) {
  // Filter unique assets that are not fiat cash
  const uniqueAssets = React.useMemo(() => {
    const seen = new Set();
    return assets.filter(a => {
      if (a.category === "fiat" || a.type === "fiat") return false;
      if (seen.has(a.symbol)) return false;
      seen.add(a.symbol);
      return true;
    });
  }, [assets]);

  // Ensure there are enough items to fill screen width and loop seamlessly at -50% translation
  const duplicatedList = React.useMemo(() => {
    let list = [...uniqueAssets];
    if (list.length === 0) return [];
    while (list.length < 15) {
      list = [...list, ...uniqueAssets];
    }
    return [...list, ...list];
  }, [uniqueAssets]);

  if (uniqueAssets.length === 0) return null;

  const renderItem = (asset, idx) => {
    const pData = prices[asset.symbol];
    if (!pData) return null;

    // Use live price: Regular price during market hours, or Pre/Post-market prices outside
    const regPrice = pData.price ?? 0;
    const isPre = pData.marketState === "PRE" || pData.marketState === "PREPRE";
    const isPost = pData.marketState === "POST" || pData.marketState === "POSTPOST";
    const extPrice = (isPre && pData.prePrice > 0) ? pData.prePrice : ((isPost && pData.postPrice > 0) ? pData.postPrice : null);
    const price = extPrice ?? regPrice;

    const prevClose = pData.previousClose ?? price;
    const pctChange = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    const isUp = pctChange >= 0;
    const isThai = asset.symbol.toUpperCase().endsWith(".BK");

    const priceStr = isThai
      ? `฿${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const pctStr = `${pctChange.toFixed(2)}%`;

    return (
      <div key={`${asset.symbol}-${idx}`} className="ticker-item">
        <span className="ticker-item-symbol">{getDisplaySymbol(asset.symbol)}</span>
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
        {duplicatedList.map((asset, idx) => renderItem(asset, idx))}
      </div>
    </div>
  );
}
