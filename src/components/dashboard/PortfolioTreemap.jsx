import React, { useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { fmtUSD, fmtPct } from "../../utils/formatters";

const CATEGORY_STYLES = {
  stock: {
    bg: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
    border: "#6366F1",
    text: "#E0E7FF"
  },
  crypto: {
    bg: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
    border: "#10B981",
    text: "#D1FAE5"
  },
  gold: {
    bg: "linear-gradient(135deg, #D97706 0%, #92400E 100%)",
    border: "#F59E0B",
    text: "#FEF3C7"
  },
  fiat: {
    bg: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
    border: "#8B5CF6",
    text: "#F5F3FF"
  },
  default: {
    bg: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    border: "#64748B",
    text: "#F1F5F9"
  }
};

function computeTreemap(items, x, y, w, h) {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{ ...items[0], x, y, w, h }];
  }

  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let currentSum = 0;
  let splitIndex = 0;
  for (let i = 0; i < items.length - 1; i++) {
    currentSum += items[i].weight;
    if (currentSum >= total / 2) {
      splitIndex = i + 1;
      break;
    }
  }
  if (splitIndex === 0) splitIndex = 1;

  const leftItems = items.slice(0, splitIndex);
  const rightItems = items.slice(splitIndex);
  const leftSum = leftItems.reduce((sum, item) => sum + item.weight, 0);
  const ratio = leftSum / total;

  const vertical = w >= h;

  if (vertical) {
    const w1 = w * ratio;
    const w2 = w - w1;
    return [
      ...computeTreemap(leftItems, x, y, w1, h),
      ...computeTreemap(rightItems, x + w1, y, w2, h)
    ];
  } else {
    const h1 = h * ratio;
    const h2 = h - h1;
    return [
      ...computeTreemap(leftItems, x, y, w, h1),
      ...computeTreemap(rightItems, x, y + h1, w, h2)
    ];
  }
}

export default function PortfolioTreemap({
  activeAssets,
  hasAssets,
  hoveredSymbol,
  setHoveredSymbol,
  hoveredCategory,
  setHoveredCategory,
  hideValues,
  setSelectedAsset
}) {
  const totalVal = useMemo(() => {
    return activeAssets ? activeAssets.reduce((sum, a) => sum + (a.valueUSD || 0), 0) : 0;
  }, [activeAssets]);

  const treemapItems = useMemo(() => {
    if (!activeAssets || activeAssets.length === 0 || totalVal === 0) return [];
    
    const items = activeAssets
      .filter(a => (a.valueUSD || 0) > 0)
      .map(a => ({
        id: a.symbol,
        symbol: a.symbol,
        name: a.name,
        category: a.category || "stock",
        valueUSD: a.valueUSD,
        weight: a.valueUSD,
        assetRef: a
      }))
      .sort((a, b) => b.weight - a.weight);

    return computeTreemap(items, 0, 0, 100, 100);
  }, [activeAssets, totalVal]);

  if (!hasAssets || treemapItems.length === 0) {
    return (
      <div className="treemap-empty" style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontSize: 13 }}>
        เพิ่มสินทรัพย์เพื่อดูสัดส่วนพื้นที่พอร์ต (Treemap)
      </div>
    );
  }

  return (
    <div className="treemap-container" style={{ position: "relative", width: "100%", height: 260, borderRadius: 12, overflow: "hidden", background: "#0F172A", border: "1px solid var(--border)" }}>
      {treemapItems.map((item) => {
        const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.default;
        const pct = (item.valueUSD / totalVal) * 100;
        const isHovered = hoveredSymbol === item.symbol;
        const isDimmed = hoveredSymbol && hoveredSymbol !== item.symbol;
        
        const showFullText = item.w > 18 && item.h > 15;
        const showSymbolOnly = item.w > 8 && item.h > 8;

        return (
          <div
            key={item.id}
            className="treemap-node"
            style={{
              position: "absolute",
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.w}%`,
              height: `${item.h}%`,
              boxSizing: "border-box",
              padding: 2,
              zIndex: isHovered ? 2 : 1,
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), z-index 0.25s step-end"
            }}
            onMouseEnter={() => {
              setHoveredSymbol(item.symbol);
              setHoveredCategory(item.category);
            }}
            onMouseLeave={() => {
              setHoveredSymbol(null);
              setHoveredCategory(null);
            }}
            onClick={() => setSelectedAsset?.(item.assetRef)}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: style.bg,
                border: `1.5px solid ${isHovered ? "#FFFFFF" : style.border}`,
                borderRadius: 8,
                padding: "6px 8px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                overflow: "hidden",
                cursor: "pointer",
                opacity: isDimmed ? 0.45 : 1,
                transform: isHovered ? "scale(1.025)" : "scale(1)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isHovered ? "0 8px 20px rgba(0,0,0,0.3)" : "none"
              }}
            >
              {showSymbolOnly && (
                <div style={{ fontWeight: 900, fontSize: showFullText ? 14 : 11, color: style.text, textShadow: "0 1px 2px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
                  {item.symbol}
                </div>
              )}
              {showFullText && (
                <>
                  <div className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", marginTop: 2, whiteSpace: "nowrap" }}>
                    {fmtUSD(item.valueUSD, false)}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 1, whiteSpace: "nowrap" }}>
                    {fmtPct(pct)}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
