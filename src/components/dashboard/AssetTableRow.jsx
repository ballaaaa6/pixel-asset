import React from "react";
import { Plus, Trash2 } from "lucide-react";
import AssetLogo from "../common/AssetLogo";
import MarketBadge from "./MarketBadge";
import { getDisplaySymbol, getAssetFullName } from "../../utils/assetHelpers";
import BrokerBadge from "../common/BrokerBadge";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function AssetTableRow({
  asset,
  idx,
  prices,
  priceFlash,
  totalUSD,
  bestAsset,
  exchangeRate,
  selectedAsset,
  setSelectedAsset,
  setEditingAsset,
  setModalOpen,
  handleDeleteAsset,
  hasPrices,
  fmt,
  hideValues,
  hoveredSymbol,
  setHoveredSymbol,
  hoveredCategory,
  setHoveredCategory
}) {
  const pData = prices[asset.symbol];
  const flash = priceFlash[asset.symbol];
  const weightPct = totalUSD > 0 ? (asset.valueUSD / totalUSD) * 100 : 0;
  const isBest = bestAsset?.symbol === asset.symbol;
  const isCashAsset = asset.type === "fiat" || asset.category === "fiat";
  const isSelected = selectedAsset?.id === asset.id;
  const isHovered = hoveredSymbol === asset.symbol || (hoveredCategory === (asset.category || "stock") && !hoveredSymbol);

  return (
    <tr
      className={`asset-row-clickable ${asset.category || "stock"} ${isSelected ? "selected" : ""} ${isHovered ? "row-hovered" : ""} ${flash ? `price-flash-${flash}` : ""}`}
      onClick={(e) => {
        if (e.target.closest("button") || e.target.closest("td:last-child")) return;
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
      style={{ animationDelay: `${idx * 0.04}s` }}
    >
      <td>
        <div className="asset-name-col">
          <AssetLogo symbol={asset.symbol} category={asset.category} />
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
              <span className="asset-symbol">{getDisplaySymbol(asset.symbol)}</span>
              <span className={`badge-type ${asset.category || "stock"}`}>
                {asset.category === "gold" ? (asset.symbol === "CL=F" ? "น้ำมัน" : "ทองคำ") : (CATEGORY_LABELS[asset.category] || asset.category || "stock")}
              </span>
              <BrokerBadge broker={asset.broker} />
              {!isCashAsset && isBest && (
                <span className="best-badge">🏆 Best</span>
              )}
            </div>
            <div className="asset-fullname">{getAssetFullName(asset.symbol, asset.name, asset.category)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              <MarketBadge state={pData?.marketState} extChangePct={asset.extChangePct} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", background: "#F1F5F9", padding: "1px 6px", borderRadius: 4 }}>
                {weightPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </td>

      <td style={{ textAlign: "right" }}>
        {!hasPrices ? (
          <div className="skeleton skeleton-text" style={{ width: 70, height: 16, marginLeft: "auto" }} />
        ) : isCashAsset ? (
          <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
        ) : (
          <div className={hideValues ? "privacy-blurred" : ""} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
            <div>
              <div className="num-tick" style={{ fontWeight: 700, fontSize: 14 }}>
                {fmt.usd(asset.regPriceUSD)}
              </div>
              <div className="price-thb">
                {fmt.thb(asset.regPriceUSD * exchangeRate)}
              </div>
              {!isCashAsset && asset.extPrice != null && (
                <div style={{ fontSize: 10, fontWeight: 700, color: asset.extChangePct >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 2, whiteSpace: "nowrap" }}>
                  {fmt.usd(asset.extPriceUSD)} ({fmt.pct(asset.extChangePct)})
                </div>
              )}
            </div>
          </div>
        )}
      </td>

      <td style={{ textAlign: "right" }}>
        {!hasPrices ? (
          <div className="skeleton skeleton-text" style={{ width: 80, height: 16, marginLeft: "auto" }} />
        ) : (
          <div className={hideValues ? "privacy-blurred" : ""}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {fmt.usd(isCashAsset ? asset.valueUSD : asset.regValueUSD)}
            </div>
            <div className="price-thb">
              {isCashAsset ? (
                `${fmt.qty(asset.qty)} ${asset.symbol}`
              ) : (
                fmt.thb(asset.regValueTHB)
              )}
            </div>
            {!isCashAsset && asset.extPrice != null && (
              <div style={{ fontSize: 10, color: asset.extChangePct >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 2, whiteSpace: "nowrap" }}>
                {fmt.usd(asset.extValueUSD)} ({fmt.pct(asset.extChangePct)})
              </div>
            )}
          </div>
        )}
      </td>

      <td style={{ textAlign: "right" }}>
        {!hasPrices || asset.costUSD === 0 || isCashAsset ? (
          <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
        ) : (
          <div className={hideValues ? "privacy-blurred" : ""}>
            <div className={`pnl-cell ${asset.regGainUSD >= 0 ? "positive" : "negative"}`}>
              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
                {`${asset.regGainUSD >= 0 ? "+" : "-"}${fmt.usd(Math.abs(asset.regGainUSD))} (${fmt.pct(asset.regGainPct)})`}
              </div>
              <div className="price-thb">
                {`${asset.regGainUSD >= 0 ? "+" : "-"}${fmt.thb(Math.abs(asset.regGainUSD * exchangeRate))}`}
              </div>
            </div>
            {!isCashAsset && asset.extPrice != null && (
              <div className={`pnl-cell ${asset.extGainUSD >= 0 ? "positive" : "negative"}`} style={{ fontSize: 10, marginTop: 2, whiteSpace: "nowrap" }}>
                {`${asset.extGainUSD >= 0 ? "+" : "-"}${fmt.usd(Math.abs(asset.extGainUSD))} (${fmt.pct(asset.extGainPct)})`}
              </div>
            )}
          </div>
        )}
      </td>

      <td style={{ textAlign: "right", position: "relative" }}>
        {!hasPrices || isCashAsset ? (
          <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
        ) : (
          <div>
            <div className={`pnl-cell ${asset.regTodayPct >= 0 ? "positive" : "negative"}`}>
              <div style={{ fontSize: 13 }}>
                {fmt.pct(asset.regTodayPct)}
              </div>
            </div>
            {!isCashAsset && asset.extPrice != null && (
              <div className={`pnl-cell ${asset.extChangePct >= 0 ? "positive" : "negative"}`} style={{ fontSize: 10, marginTop: 2, whiteSpace: "nowrap" }}>
                {fmt.pct(asset.extChangePct)}
              </div>
            )}
          </div>
        )}
        <div className="asset-row-actions">
          <button className="btn-delete btn-action-add" title={asset.category === "fiat" || asset.type === "fiat" ? "ฝากเงินสด / ถอนเงินสด" : "ซื้อ / ขายสินทรัพย์"}
            onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setModalOpen(true); }}>
            <Plus size={14} />
          </button>
          <button className="btn-delete btn-action-trash" title="ลบออกจากพอร์ต"
            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset); }}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>

    </tr>
  );
}
