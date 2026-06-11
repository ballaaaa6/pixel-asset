import React from "react";
import { fmtUSD } from "../../utils/formatters";
import { getDynamicDateFormat } from "../../utils/formatters";

/**
 * AssetChartSVG — pure SVG rendering for AssetChart.
 * Receives fully-computed geometry as props; contains no state or event logic.
 */
export function AssetChartSVG({
  W, H, PAD_L, PAD_R, PAD_T, PAD_B, iW, iH,
  isUp, isCashAsset,
  // Paths
  linePath, costLinePath,
  fillValueArea, fillCostArea,
  clipAboveCostPath, clipBelowCostPath, clipAboveValuePath,
  // EMAs
  showEma10, showEma20, showEma50, showEma200,
  ema10Path, ema20Path, ema50Path, ema200Path,
  // Active point sets
  activePts, activeCostPts,
  hasCostLine,
  // Ticks
  yTicks, xTicks,
  visibleDurationMs, hasMultipleYears,
  // Lot markers
  lotMarkers,
  // Hover state
  hovered,
  // Diff state
  isDiffActive, diffStartIdx, diffEndIdx,
  findClosestPtByTimestamp,
  // Cost label
  hideValues,
}) {
  const color = isUp ? "#00B98A" : "#FF4B55";

  const renderPointGuidesAndBadges = (pt, type = "hover") => {
    if (!pt) return null;

    let fillBg = "#1E293B";
    let strokeCol = "#64748B";
    let lineCol = "#94A3B8";

    if (type === "diffA") {
      fillBg = "#2563EB";   // Point 1: Blue
      strokeCol = "#93C5FD";
      lineCol = "#3B82F6";
    } else if (type === "diffB") {
      fillBg = "#D97706";   // Point 2: Amber/Orange
      strokeCol = "#FDE68A";
      lineCol = "#F59E0B";
    }

    // Dynamic badge calculations
    const dateObj = new Date(pt.date);
    const dateStr = dateObj.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
    const timeStr = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const xValText = `${dateStr} ${timeStr} น.`;
    const rectW_X = xValText.length * 7.5 + 16;
    const badgeX = Math.max(2, Math.min(W - rectW_X - 2, pt.x - rectW_X / 2));

    const yValText = fmtUSD(pt.value, hideValues);
    const rectW_Y = yValText.length * 7 + 16;
    const badgeX_Y = Math.max(2, PAD_L - rectW_Y - 4);
    const badgeY = Math.max(PAD_T, Math.min(H - PAD_B - 22, pt.y - 11));

    return (
      <g style={{ pointerEvents: "none" }}>
        {/* Guidelines */}
        <line
          x1={pt.x} y1={PAD_T}
          x2={pt.x} y2={H - PAD_B}
          stroke={lineCol}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <line
          x1={PAD_L} y1={pt.y}
          x2={pt.x} y2={pt.y}
          stroke={lineCol}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />

        {/* X-axis coordinate badge */}
        <rect
          x={badgeX}
          y={H - PAD_B + 2}
          width={rectW_X}
          height={22}
          rx={4}
          fill={fillBg}
          stroke={strokeCol}
          strokeWidth="1"
        />
        <text
          x={badgeX + rectW_X / 2}
          y={H - PAD_B + 17}
          textAnchor="middle"
          fontSize="12"
          fill="#F8FAFC"
          fontWeight="bold"
          fontFamily="Outfit,sans-serif"
        >
          {xValText}
        </text>

        {/* Y-axis coordinate badge */}
        <rect
          x={badgeX_Y}
          y={badgeY}
          width={rectW_Y}
          height={22}
          rx={4}
          fill={fillBg}
          stroke={strokeCol}
          strokeWidth="1"
        />
        <text
          x={badgeX_Y + rectW_Y / 2}
          y={badgeY + 15}
          textAnchor="middle"
          fontSize="12"
          fill="#F8FAFC"
          fontWeight="bold"
          fontFamily="Outfit,sans-serif"
        >
          {yValText}
        </text>
      </g>
    );
  };

  const latestCost = activeCostPts.length > 0 ? activeCostPts[activeCostPts.length - 1].cost : 0;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", cursor: "crosshair" }}>
      <defs>
        <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00B98A" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#00B98A" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4B55" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FF4B55" stopOpacity="0.25" />
        </linearGradient>

        {clipAboveCostPath && (
          <clipPath id="assetClipAboveCost">
            <path d={clipAboveCostPath} />
          </clipPath>
        )}
        {clipBelowCostPath && (
          <clipPath id="assetClipBelowCost">
            <path d={clipBelowCostPath} />
          </clipPath>
        )}
        {clipAboveValuePath && (
          <clipPath id="assetClipAboveValue">
            <path d={clipAboveValuePath} />
          </clipPath>
        )}
        <clipPath id="assetClipFull">
          <rect x={PAD_L} y={PAD_T} width={iW} height={iH} />
        </clipPath>
        {hasCostLine && activeCostPts.length >= 1 && (
          <>
            <clipPath id="prePurchasedClip">
              <rect x={PAD_L} y={0} width={Math.max(0, activeCostPts[0].x - PAD_L)} height={H} />
            </clipPath>
            <clipPath id="purchasedClip">
              <rect x={activeCostPts[0].x} y={0} width={Math.max(0, W - PAD_R - activeCostPts[0].x)} height={H} />
            </clipPath>
          </>
        )}
      </defs>

      {/* ── Grid lines ── */}
      {yTicks.map(({ y }, i) => (
        <line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
          stroke="#E8EBF2" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {xTicks.map(({ x }, i) => (
        <line key={i} x1={x} y1={PAD_T} x2={x} y2={H - PAD_B}
          stroke="#F1F5F9" strokeWidth="1" />
      ))}

      {/* ── Diff selection overlay (connection line and dots only) ── */}
      {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && (() => {
        const ptA = findClosestPtByTimestamp(diffStartIdx);
        const ptB = findClosestPtByTimestamp(diffEndIdx);
        if (ptA && ptB) {
          const { x: xA, y: yA } = ptA;
          const { x: xB, y: yB } = ptB;
          return (
            <g style={{ pointerEvents: "none" }}>
              {diffStartIdx !== diffEndIdx && (
                <line x1={xA} y1={yA} x2={xB} y2={yB} stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />
              )}
              <circle cx={xA} cy={yA} r="6" fill="white" stroke="#3B82F6" strokeWidth="3" />
              {diffStartIdx !== diffEndIdx && (
                <circle cx={xB} cy={yB} r="6" fill="white" stroke="#F59E0B" strokeWidth="3" />
              )}
            </g>
          );
        }
        return null;
      })()}

      {/* ── Fill areas (gain/loss) ── */}
      {hasCostLine && costLinePath && fillValueArea && fillCostArea && activeCostPts.length >= 1 ? (
        <g clipPath="url(#purchasedClip)">
          <path d={fillValueArea} fill="url(#gainGrad)" clipPath="url(#assetClipAboveCost)" />
          <path d={fillCostArea} fill="url(#lossGrad)" clipPath="url(#assetClipAboveValue)" />
        </g>
      ) : (
        fillValueArea && <path d={fillValueArea} fill={isUp ? "url(#gainGrad)" : "url(#lossGrad)"} clipPath="url(#assetClipFull)" />
      )}

      {/* ── Cost (avg-cost) step line ── */}
      {hasCostLine && costLinePath && (
        <path
          d={costLinePath}
          fill="none"
          stroke="#5236FF"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          opacity="0.85"
          clipPath="url(#assetClipFull)"
        />
      )}

      {/* ── EMA lines ── */}
      {!isCashAsset && showEma10 && ema10Path && (
        <path d={ema10Path} fill="none" stroke="#00d2ff" strokeWidth="1"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipFull)" opacity="0.9" />
      )}
      {!isCashAsset && showEma20 && ema20Path && (
        <path d={ema20Path} fill="none" stroke="#FBBF24" strokeWidth="1"
          strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round"
          clipPath="url(#assetClipFull)" opacity="0.9" />
      )}
      {!isCashAsset && showEma50 && ema50Path && (
        <path d={ema50Path} fill="none" stroke="#F97316" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipFull)" opacity="0.95" />
      )}
      {!isCashAsset && showEma200 && ema200Path && (
        <path d={ema200Path} fill="none" stroke="#DC2626" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipFull)" opacity="0.95" />
      )}

      {/* ── Price line (dual-color above/below cost, or single color) ── */}
      {linePath && costLinePath && activeCostPts.length >= 1 ? (
        <>
          <path d={linePath} fill="none" stroke="#94A3B8" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.85" clipPath="url(#prePurchasedClip)" />
          <g clipPath="url(#purchasedClip)">
            <path d={linePath} fill="none" stroke="#00B98A" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipAboveCost)" />
            <path d={linePath} fill="none" stroke="#FF4B55" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipBelowCost)" />
          </g>
        </>
      ) : (
        linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipFull)" />
        )
      )}

      {/* ── Cost label badge ── */}
      {hasCostLine && activeCostPts.length > 0 && (
        <>
          <rect
            x={W - PAD_R - 74}
            y={activeCostPts[activeCostPts.length - 1].y - 11}
            width={74} height={20} rx="5"
            fill="#5236FF" opacity="0.9"
          />
          <text
            x={W - PAD_R - 37}
            y={activeCostPts[activeCostPts.length - 1].y + 4}
            textAnchor="middle" fontSize="10" fill="white"
            fontWeight="800" fontFamily="Outfit,sans-serif"
          >
            {fmtUSD(latestCost, hideValues)}
          </text>
        </>
      )}

      {/* ── Lot markers ── */}
      {lotMarkers.map((m, i) => {
        const markerColor = m.colorType === "buy" ? "#16A34A" : m.colorType === "sell" ? "#DC2626" : "#F59E0B";
        const isMultiple = m.numsCount > 1;
        const badgeW = isMultiple ? Math.max(16, m.label.length * 6 + 10) : 15;
        return (
          <g key={i}>
            <line x1={m.x} y1={PAD_T} x2={m.x} y2={H - PAD_B}
              stroke={markerColor} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
            {isMultiple ? (
              <rect x={m.x - badgeW / 2} y={PAD_T + 4.5} width={badgeW} height={15} rx="7.5" fill={markerColor} />
            ) : (
              <circle cx={m.x} cy={PAD_T + 12} r="7.5" fill={markerColor} />
            )}
            <text x={m.x} y={PAD_T + 12} textAnchor="middle" fontSize="9" fill="white"
              fontWeight="900" fontFamily="Outfit,sans-serif" dominantBaseline="middle">
              {m.label}
            </text>
          </g>
        );
      })}

      {/* ── Y-axis labels ── */}
      {yTicks.map(({ v, y }, i) => (
        <text key={i} x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="10"
          fill="#94A3B8" fontFamily="Outfit,sans-serif" fontWeight="600">
          {v >= 1000 ? (v / 1000).toFixed(1) + "k" : v < 1 ? v.toFixed(4) : v.toFixed(v >= 100 ? 0 : 2)}
        </text>
      ))}

      {/* ── X-axis labels ── */}
      {xTicks.map(({ x, date }, i) => (
        <text key={i} x={x} y={H - PAD_B + 16} textAnchor="middle" fontSize="10"
          fill="#94A3B8" fontFamily="Outfit,sans-serif" fontWeight="600">
          {getDynamicDateFormat(date, visibleDurationMs, hasMultipleYears)}
        </text>
      ))}

      {/* Guidelines and Axis badges (Rendered on top of standard axes and labels) */}
      {!isDiffActive && hovered && renderPointGuidesAndBadges(hovered, "hover")}

      {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && (() => {
        const ptA = findClosestPtByTimestamp(diffStartIdx);
        const ptB = findClosestPtByTimestamp(diffEndIdx);
        
        if (ptA && ptB && ptA.x === ptB.x) {
          return renderPointGuidesAndBadges(ptA, "diffA");
        }

        return (
          <>
            {ptA && renderPointGuidesAndBadges(ptA, "diffA")}
            {ptB && renderPointGuidesAndBadges(ptB, "diffB")}
          </>
        );
      })()}
    </svg>
  );
}

export default AssetChartSVG;
