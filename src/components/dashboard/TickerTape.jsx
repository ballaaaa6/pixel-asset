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

  if (uniqueAssets.length === 0) return null;

  // Triplicate the list of assets to ensure the infinite scrolling loop spans the entire viewport seamlessly
  const duplicatedList = [...uniqueAssets, ...uniqueAssets, ...uniqueAssets];

  const renderItem = (asset, idx) => {
    const pData = prices[asset.symbol];
    if (!pData) return null;

    const price = pData.price;
    const prevClose = pData.previousClose ?? price;
    const pctChange = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    const isUp = pctChange >= 0;
    const isThai = asset.symbol.toUpperCase().endsWith(".BK");

    return (
      <div key={`${asset.symbol}-${idx}`} className="ticker-item">
        <span className="ticker-item-symbol">{getDisplaySymbol(asset.symbol)}</span>
        <span className="ticker-item-price">
          {isThai
            ? `฿${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </span>
        <span className={`ticker-item-pct ${isUp ? "up" : "down"}`}>
          {isUp ? "▲" : "▼"} {pctChange.toFixed(2)}%
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
