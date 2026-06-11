import React from "react";
import { Trash2 } from "lucide-react";
import AssetLogo from "../common/AssetLogo";
import MarketBadge from "./MarketBadge";
import { getDisplaySymbol, getAssetFullName } from "../../utils/assetHelpers";
import BrokerBadge from "../common/BrokerBadge";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function AssetCardMobile({
  asset,
  idx,
  prices,
  priceFlash,
  bestAsset,
  exchangeRate,
  setSelectedAsset,
  setEditingAsset,
  setModalOpen,
  handleDeleteAsset,
  hasPrices,
  sparklines,
  fmt,
  hoveredSymbol,
  setHoveredSymbol,
  hoveredCategory,
  setHoveredCategory
}) {
  const pData = prices[asset.symbol];
  const flash = priceFlash[asset.symbol];
  const isBest = bestAsset?.symbol === asset.symbol;
  const isCashAsset = asset.type === "fiat" || asset.category === "fiat";
  const isHovered = hoveredSymbol === asset.symbol || (hoveredCategory === (asset.category || "stock") && !hoveredSymbol);

  return (
    <div
      className={`mobile-asset-card ${asset.category || "stock"} ${isHovered ? "row-hovered" : ""} ${flash ? `price-flash-${flash}` : ""}`}
      onClick={(e) => {
        if (e.target.closest("button")) return;
        setSelectedAsset(asset);
      }}
      onMouseEnter={() => {
        setHoveredSymbol(asset.symbol);
        setHoveredCategory(asset.category || "stock");
      }}
      onMouseLeave={() => {
        setHoveredSymbol(null);
        setHoveredCategory(null);
      }}
      style={{ animationDelay: `${idx * 0.06}s`, cursor: "pointer" }}
    >
      <div className="mobile-card-top">
        <div className="mobile-card-left">
          <AssetLogo symbol={asset.symbol} category={asset.category} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <span className="asset-symbol">{getDisplaySymbol(asset.symbol)}</span>
              <span className={`badge-type ${asset.category || "stock"}`}>
                {asset.category === "gold" ? (asset.symbol === "CL=F" ? "น้ำมัน" : "ทองคำ") : (CATEGORY_LABELS[asset.category] || asset.category || "stock")}
              </span>
              <BrokerBadge broker={asset.broker} />
              {!isCashAsset && isBest && <span className="best-badge" style={{ padding: "1px 6px", borderRadius: 4 }}>🏆 Best</span>}
            </div>
            <div className="asset-fullname">{getAssetFullName(asset.symbol, asset.name, asset.category)}</div>
            <MarketBadge state={pData?.marketState} />
          </div>
        </div>
        <div className="mobile-card-right">
          {hasPrices ? (
            isCashAsset ? (
              <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
            ) : (
              <>
                <div className="mobile-card-price">{fmt.usd(asset.regPriceUSD)}</div>
                <div className="price-thb">{fmt.thb(asset.regPriceUSD * exchangeRate)}</div>
                {!isCashAsset && asset.extPrice != null && (
                  <div style={{ fontSize: 9, fontWeight: 700, color: asset.extChangePct >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 2 }}>
                    {asset.extType}: {fmt.usd(asset.extPriceUSD)} ({fmt.pct(asset.extChangePct)})
                  </div>
                )}
              </>
            )
          ) : (
            <div className="skeleton skeleton-text" style={{ width: 80, height: 18 }} />
          )}
        </div>
      </div>

      <div className="mobile-card-stats">
        <div className="mobile-stat">
          <span className="mobile-stat-label">มูลค่า</span>
          <span className="mobile-stat-value">
            {hasPrices ? (
              isCashAsset ? (
                `${fmt.qty(asset.qty)} ${asset.symbol} (≈ ${fmt.usd(asset.valueUSD)})`
              ) : (
                fmt.usd(asset.valueUSD)
              )
            ) : "—"}
          </span>
        </div>
        <div className="mobile-stat">
          <span className="mobile-stat-label">กำไร/ขาดทุน</span>
          <span className="mobile-stat-value" style={{ color: isCashAsset ? "var(--text-faint)" : (asset.gainUSD >= 0 ? "var(--gain)" : "var(--loss)") }}>
            {isCashAsset ? "—" : (hasPrices && asset.costUSD > 0 ? fmt.pct(asset.gainPct) : "—")}
          </span>
        </div>
        <div className="mobile-stat">
          <span className="mobile-stat-label">วันนี้</span>
          <span className="mobile-stat-value" style={{ color: isCashAsset ? "var(--text-faint)" : (asset.todayPct >= 0 ? "var(--gain)" : "var(--loss)") }}>
            {isCashAsset ? "—" : (hasPrices ? fmt.pct(asset.todayPct) : "—")}
          </span>
        </div>
      </div>



      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn btn-secondary ripple-btn"
          style={{ height: 38, fontSize: 12, flex: 1 }}
          onClick={() => { setEditingAsset(asset); setModalOpen(true); }}>
          {isCashAsset ? "📥 ฝาก / 📤 ถอน" : "🛒 ซื้อ / ขาย"}
        </button>
        <button className="btn-icon ripple-btn" style={{ flex: "0 0 38px" }}
          onClick={() => handleDeleteAsset(asset)} title="ลบ">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
