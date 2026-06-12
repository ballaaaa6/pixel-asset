import React from "react";
import { getDynamicDateFormat, isExtendedHoursNY } from "../../utils/formatters";
import { PointGuidesAndBadges } from "./PointGuidesAndBadges";

export function PortfolioChartSVG({
  W, H, PAD_L, PAD_R, PAD_T, PAD_B, iW, iH,
  yTicks, dateLabels, lotMarkers, costPts, pts,
  isDiffActive, diffStartIdx, diffEndIdx, findClosestPtByTimestamp,
  fillValueArea, fillCostArea, clipAboveCostPath, clipBelowCostPath, clipAboveValuePath,
  costLinePath, linePath, isUp, color,
  hovered, visibleDurationMs, hasMultipleYears,
  fmt, hideValues, chartCategory
}) {


  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart-svg"
      style={{ height: H, display: "block" }}
    >
      <defs>
        <linearGradient id="portGainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00B98A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00B98A" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="portLossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4B55" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FF4B55" stopOpacity="0.20" />
        </linearGradient>

        {clipAboveCostPath && (
          <clipPath id="portClipAboveCost">
            <path d={clipAboveCostPath} />
          </clipPath>
        )}
        {clipBelowCostPath && (
          <clipPath id="portClipBelowCost">
            <path d={clipBelowCostPath} />
          </clipPath>
        )}
        {clipAboveValuePath && (
          <clipPath id="portClipAboveValue">
            <path d={clipAboveValuePath} />
          </clipPath>
        )}
        <clipPath id="portClipFull">
          <rect x={PAD_L} y={PAD_T} width={iW} height={iH} />
        </clipPath>
      </defs>

      {/* Market session shading for intraday periods */}
      {(() => {
        const isIntraday = visibleDurationMs > 0 && visibleDurationMs <= 8 * 24 * 60 * 60 * 1000 && chartCategory === "stock";
        if (!isIntraday) return null;

        return pts.map((pt, i) => {
          if (i === pts.length - 1) return null;
          const ptNext = pts[i + 1];
          if (!pt || !ptNext || !pt.date || !ptNext.date) return null;

          const isPtExt = isExtendedHoursNY(pt.date);
          const isNextExt = isExtendedHoursNY(ptNext.date);

          const rectElement = isPtExt ? (
            <rect
              key={`shade-${i}`}
              x={pt.x}
              y={PAD_T}
              width={ptNext.x - pt.x}
              height={iH}
              fill="rgba(99, 102, 241, 0.04)"
              style={{ pointerEvents: "none" }}
            />
          ) : null;

          const lineElement = isPtExt !== isNextExt ? (
            <line
              key={`boundary-${i}`}
              x1={ptNext.x}
              y1={PAD_T}
              x2={ptNext.x}
              y2={H - PAD_B}
              stroke="#CBD5E1"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.8"
              style={{ pointerEvents: "none" }}
            />
          ) : null;

          return (
            <g key={i}>
              {rectElement}
              {lineElement}
            </g>
          );
        });
      })()}

      {/* Grid lines */}
      {yTicks.map(({ y }, i) => (
        <line key={i}
          x1={PAD_L} y1={y}
          x2={W - PAD_R} y2={y}
          stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {dateLabels.map(({ x }, i) => (
        <line key={i} x1={x} y1={PAD_T} x2={x} y2={H - PAD_B}
          stroke="#F8FAFC" strokeWidth="1" />
      ))}

      {/* Diff range indicators (connection lines and dots only) */}
      {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && (() => {
        const ptA = findClosestPtByTimestamp(diffStartIdx);
        const ptB = findClosestPtByTimestamp(diffEndIdx);

        if (ptA && ptB) {
          const xA = ptA.x;
          const xB = ptB.x;
          const yA = ptA.y;
          const yB = ptB.y;

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

      {/* Fills */}
      {costLinePath && fillValueArea && fillCostArea ? (
        <>
          <path d={fillValueArea} fill="url(#portGainGrad)" clipPath="url(#portClipAboveCost)" />
          <path d={fillCostArea} fill="url(#portLossGrad)" clipPath="url(#portClipAboveValue)" />
        </>
      ) : (
        fillValueArea && <path d={fillValueArea} fill={isUp ? "url(#portGainGrad)" : "url(#portLossGrad)"} clipPath="url(#portClipFull)" />
      )}

      {/* Cost line */}
      {costLinePath && (
        <path
          d={costLinePath}
          fill="none"
          stroke="#5236FF"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          opacity="0.9"
          clipPath="url(#portClipFull)"
        />
      )}

      {/* Value lines */}
      {linePath && costLinePath ? (
        <>
          <path
            d={linePath}
            fill="none"
            stroke="#00B98A"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#portClipAboveCost)"
          />
          <path
            d={linePath}
            fill="none"
            stroke="#FF4B55"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#portClipBelowCost)"
          />
        </>
      ) : (
        linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#portClipFull)"
          />
        )
      )}

      {/* First / Last dot animations */}
      {pts.length > 0 && (
        <circle cx={pts[0].x} cy={pts[0].y} r="4" fill={color} opacity="0.6" />
      )}

      {pts.length > 1 && (
        <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={color}>
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Buy / Sell transaction markers */}
      {lotMarkers.map((m, i) => {
        const markerColor = m.colorType === "buy" ? "#16A34A" : m.colorType === "sell" ? "#DC2626" : "#F59E0B";
        const isMultiple = m.txs.length > 1;
        const badgeW = isMultiple ? Math.max(16, m.label.length * 6 + 10) : 15;
        return (
          <g key={i}>
            <line x1={m.x} y1={PAD_T} x2={m.x} y2={H - PAD_B}
              stroke={markerColor} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
            {isMultiple ? (
              <rect x={m.x - badgeW / 2} y={PAD_T + 2.5} width={badgeW} height={15} rx="7.5" fill={markerColor} style={{ cursor: "pointer" }} />
            ) : (
              <circle cx={m.x} cy={PAD_T + 10} r="7.5" fill={markerColor} style={{ cursor: "pointer" }} />
            )}
            <text x={m.x} y={PAD_T + 10} textAnchor="middle" fontSize="8" fill="white" fontWeight="900" fontFamily="Outfit,sans-serif" dominantBaseline="middle" style={{ cursor: "pointer", pointerEvents: "none" }}>
              {m.label}
            </text>
            <title>
              {m.txs.map(t => `${t.type === "BUY" ? "ซื้อ" : "ขาย"} ${t.symbol} ${t.qty.toLocaleString()} หุ้น @ ${fmt.usd(t.price)}${t.time ? ` · ${t.time} น.` : ""}`).join("\n")}
            </title>
          </g>
        );
      })}

      {/* Y-axis values */}
      {yTicks.map(({ v, y }, i) => (
        <text key={i} x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="12"
          fill="var(--text-muted)" fontFamily="var(--font-family)" fontWeight="700">
          {v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(v >= 100 ? 0 : 2)}
        </text>
      ))}

      {/* X-axis labels */}
      {dateLabels.map(({ x, date }, i) => (
        <text key={i} x={x} y={H - PAD_B + 18} textAnchor="middle" fontSize="11"
          fill="var(--text-muted)" fontFamily="var(--font-family)" fontWeight="700">
          {getDynamicDateFormat(date, visibleDurationMs, hasMultipleYears)}
        </text>
      ))}

      {/* Cost badge overlay */}
      {costPts && costPts.length > 0 && (
        <>
          <rect
            x={W - PAD_R - 80}
            y={costPts[costPts.length - 1].y - 12}
            width={80}
            height={22}
            rx="6"
            fill="#5236FF"
            opacity="0.95"
          />
          <text
            x={W - PAD_R - 40}
            y={costPts[costPts.length - 1].y + 4}
            textAnchor="middle"
            fontSize="11"
            fill="white"
            fontWeight="900"
            fontFamily="var(--font-family)"
          >
            {fmt.usd(costPts[costPts.length - 1].cost)}
          </text>
        </>
      )}

      {/* Guidelines and Axis badges (Rendered on top of standard axes and labels) */}
      {!isDiffActive && hovered && (
        <PointGuidesAndBadges
          pt={hovered}
          type="hover"
          W={W} H={H} PAD_L={PAD_L} PAD_R={PAD_R} PAD_T={PAD_T} PAD_B={PAD_B}
          yValText={fmt.usd(hovered.value)}
        />
      )}

      {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && (() => {
        const ptA = findClosestPtByTimestamp(diffStartIdx);
        const ptB = findClosestPtByTimestamp(diffEndIdx);
        
        if (ptA && ptB && ptA.x === ptB.x) {
          return (
            <PointGuidesAndBadges
              pt={ptA}
              type="diffA"
              W={W} H={H} PAD_L={PAD_L} PAD_R={PAD_R} PAD_T={PAD_T} PAD_B={PAD_B}
              yValText={fmt.usd(ptA.value)}
            />
          );
        }

        return (
          <>
            {ptA && (
              <PointGuidesAndBadges
                pt={ptA}
                type="diffA"
                W={W} H={H} PAD_L={PAD_L} PAD_R={PAD_R} PAD_T={PAD_T} PAD_B={PAD_B}
                yValText={fmt.usd(ptA.value)}
              />
            )}
            {ptB && (
              <PointGuidesAndBadges
                pt={ptB}
                type="diffB"
                W={W} H={H} PAD_L={PAD_L} PAD_R={PAD_R} PAD_T={PAD_T} PAD_B={PAD_B}
                yValText={fmt.usd(ptB.value)}
              />
            )}
          </>
        );
      })()}

      {/* Hover dots (Rendered on top of everything, only in non-diff mode) */}
      {!isDiffActive && hovered && (
        <>
          <circle cx={hovered.x} cy={hovered.y} r="5"
            fill="#FFFFFF" stroke={hovered.value >= hovered.cost ? "#00B98A" : "#FF4B55"} strokeWidth="2.5" />
          {hovered.cost > 0 && (
            <circle cx={hovered.x} cy={hovered.costY} r="4.5"
              fill="#FFFFFF" stroke="#5236FF" strokeWidth="2" />
          )}
        </>
      )}
    </svg>
  );
}
