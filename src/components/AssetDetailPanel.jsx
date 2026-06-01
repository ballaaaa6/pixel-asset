import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, TrendingUp, TrendingDown, RefreshCw, ShoppingCart, Calendar } from "lucide-react";

/* ══════════════════════════════════════════════════════
   FORMATTERS
══════════════════════════════════════════════════════ */
const fmtUSD  = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n != null && Math.abs(n) < 1 ? 4 : 2 }).format(n);
const fmtPct  = (n) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const fmtQty  = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(n);
const fmtDate = (iso, tf) => {
  const d = new Date(iso);
  if (tf === "1D") return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  if (tf === "5D" || tf === "1W") return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: tf === "5Y" ? "2-digit" : undefined });
};
const fmtDateShort = (iso) => new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

/* ══════════════════════════════════════════════════════
   BEZIER SMOOTH PATH
══════════════════════════════════════════════════════ */
function smoothPath(pts) {
  if (!pts || pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) * 0.12;
    const cp1y = p1.y + (p2.y - p0.y) * 0.12;
    const cp2x = p2.x - (p3.x - p1.x) * 0.12;
    const cp2y = p2.y - (p3.y - p1.y) * 0.12;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/* ══════════════════════════════════════════════════════
   STEP PATH FOR COST BASIS
   Draws sharp horizontal steps and vertical jumps
══════════════════════════════════════════════════════ */
function stepPath(pts) {
  if (!pts || pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const nextX = pts[i + 1].x;
    const nextY = pts[i + 1].y;
    d += ` L ${nextX.toFixed(2)},${pts[i].y.toFixed(2)} L ${nextX.toFixed(2)},${nextY.toFixed(2)}`;
  }
  return d;
}


/* ══════════════════════════════════════════════════════
   MAIN ASSET DETAIL CHART
══════════════════════════════════════════════════════ */
function AssetChart({ candles, avgCost, lots, tf, isThai, exchangeRate }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [dims, setDims] = useState({ w: 600, h: 280 });

  /* Responsive sizing */
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: Math.min(300, Math.max(200, e.contentRect.width * 0.42)) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { W, H, PAD_L, PAD_R, PAD_T, PAD_B } = useMemo(() => ({
    W: dims.w, H: dims.h,
    PAD_L: 58, PAD_R: 16, PAD_T: 24, PAD_B: 40,
  }), [dims]);

  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;

  /* ── Compute Y range: adaptive tight scale with dynamic cost curve ── */
  const { pts, costPts, yMin, yMax, isUp } = useMemo(() => {
    if (!candles || candles.length < 2) return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true };

    // Sort lots by date ascending
    const sortedLots = lots && lots.length > 0
      ? [...lots].sort((a,b) => new Date(a.date) - new Date(b.date))
      : [{ id: "virtual", date: "1970-01-01", qty: 1, price: avgCost }];

    const firstPurchaseDate = sortedLots[0]?.date || "1970-01-01";

    // Helper to calculate holding stats on a specific date (in original currency)
    const getStatsOnDate = (dateStr) => {
      const targetDateOnly = dateStr.split("T")[0];
      const lotsBeforeOrOn = sortedLots.filter(lot => lot && lot.date && lot.date <= targetDateOnly);

      if (lotsBeforeOrOn.length === 0) {
        return { qty: 0, cost: 0 };
      }

      const totalQty = lotsBeforeOrOn.reduce((sum, l) => sum + (l.qty || 0), 0);
      const totalCost = lotsBeforeOrOn.reduce((sum, l) => sum + (l.qty || 0) * (l.price || 0), 0);
      return { qty: totalQty, cost: totalCost };
    };

    // Calculate value and cost for each candle
    const rawData = candles.map((c) => {
      const targetDateOnly = c.date.split("T")[0];
      
      // Check if this candle is on or after the first purchase date
      const hasPurchased = targetDateOnly >= firstPurchaseDate;
      
      if (!hasPurchased) {
        return { date: c.date, valueUSD: null, costUSD: null, hasPurchased: false };
      }

      const stats = getStatsOnDate(c.date);
      const priceUSD = isThai ? c.close / exchangeRate : c.close;
      const valueUSD = stats.qty * priceUSD;
      const costUSD = isThai ? stats.cost / exchangeRate : stats.cost;

      return { date: c.date, valueUSD, costUSD, hasPurchased: true };
    });

    // We only zoom and scale on active purchased points
    const activePoints = rawData.filter(d => d.hasPurchased);

    if (activePoints.length === 0) {
      return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true };
    }

    const valuesUSD = activePoints.map(d => d.valueUSD).filter(v => v != null);
    const costsUSD = activePoints.map(d => d.costUSD).filter(c => c != null);

    const isShortTF = tf === "1D" || tf === "5D" || tf === "1W";
    const dataMin = isShortTF ? Math.min(...valuesUSD) : Math.min(...valuesUSD, ...costsUSD);
    const dataMax = isShortTF ? Math.max(...valuesUSD) : Math.max(...valuesUSD, ...costsUSD);
    const range   = dataMax - dataMin || dataMin * 0.02 || 1;

    // Tight padding: 12% of range each side (shows movement clearly)
    const pad = range * 0.12;
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;
    const yRange = yMax - yMin;

    const toY = (v) => PAD_T + ((yMax - v) / yRange) * iH;
    const toX = (i) => PAD_L + (i / (candles.length - 1)) * iW;

    // Map all candles: return null for non-purchased days to omit them from lines
    const pts = candles.map((c, i) => {
      const d = rawData[i];
      if (!d.hasPurchased) return null;
      return { x: toX(i), y: toY(d.valueUSD), value: d.valueUSD, date: c.date };
    });

    const costPts = candles.map((c, i) => {
      const d = rawData[i];
      if (!d.hasPurchased) return null;
      return { x: toX(i), y: toY(d.costUSD), cost: d.costUSD, date: c.date };
    });

    // Determine isUp based on active portion
    const activeVal = activePoints.map(d => d.valueUSD).filter(v => v != null);
    const isUp = activeVal.length >= 2 ? activeVal[activeVal.length - 1] >= activeVal[0] : true;

    return { pts, costPts, yMin, yMax, isUp, toY, toX };
  }, [candles, avgCost, lots, isThai, exchangeRate, PAD_T, iH, PAD_L, iW]);

  /* ── Y-axis tick labels ── */
  const yTicks = useMemo(() => {
    if (yMax === yMin) return [];
    const range = yMax - yMin;
    const rawStep = range / 6;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude || 1;
    const ticks = [];
    const start = Math.ceil(yMin / step) * step;
    for (let v = start; v <= yMax + step * 0.01; v += step) {
      const y = PAD_T + ((yMax - v) / (yMax - yMin)) * iH;
      if (y >= PAD_T - 4 && y <= H - PAD_B + 4) {
        ticks.push({ v, y });
      }
    }
    return ticks;
  }, [yMin, yMax, PAD_T, iH, H, PAD_B]);

  /* ── X-axis tick labels ── */
  const xTicks = useMemo(() => {
    if (!candles || candles.length < 2) return [];
    const count = Math.min(6, candles.length);
    const step = Math.floor(candles.length / count);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i * step, candles.length - 1);
      return { idx, x: PAD_L + (idx / (candles.length - 1)) * iW, date: candles[idx].date };
    });
  }, [candles, PAD_L, iW]);

  /* ── Filter active points (excluding nulls before first purchase) ── */
  const activePts = useMemo(() => pts.filter(Boolean), [pts]);
  const activeCostPts = useMemo(() => costPts.filter(Boolean), [costPts]);

  /* ── Line paths ── */
  const linePath = useMemo(() => smoothPath(activePts), [activePts]);
  const costLinePath = useMemo(() => stepPath(activeCostPts), [activeCostPts]);

  /* ── Fill paths ── */
  const fillValueArea = useMemo(() => {
    if (!linePath || activePts.length < 2) return "";
    const first = activePts[0], last = activePts[activePts.length - 1];
    const bottomY = H - PAD_B;
    return linePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [linePath, activePts, H, PAD_B]);

  const fillCostArea = useMemo(() => {
    if (!costLinePath || activeCostPts.length < 2) return "";
    const first = activeCostPts[0], last = activeCostPts[activeCostPts.length - 1];
    const bottomY = H - PAD_B;
    return costLinePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [costLinePath, activeCostPts, H, PAD_B]);

  // Clipping path definitions using active boundaries
  const clipAboveCostPath = useMemo(() => {
    if (!costLinePath || activeCostPts.length < 2) return "";
    const first = activeCostPts[0], last = activeCostPts[activeCostPts.length - 1];
    return costLinePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [costLinePath, activeCostPts]);

  const clipBelowCostPath = useMemo(() => {
    if (!costLinePath || activeCostPts.length < 2) return "";
    const first = activeCostPts[0], last = activeCostPts[activeCostPts.length - 1];
    const bottomY = H - PAD_B;
    return costLinePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [costLinePath, activeCostPts, H, PAD_B]);

  const clipAboveValuePath = useMemo(() => {
    if (!linePath || activePts.length < 2) return "";
    const first = activePts[0], last = activePts[activePts.length - 1];
    return linePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [linePath, activePts]);

  /* ── Lot markers (purchase dates) ── */
  const lotMarkers = useMemo(() => {
    if (!lots || !candles || candles.length < 2) return [];
    const markers = [];
    lots.forEach((lot, i) => {
      const lotDateStr = lot.date;
      let bestIdx = -1, bestDiff = Infinity;
      candles.forEach((c, idx) => {
        const diff = Math.abs(new Date(c.date) - new Date(lotDateStr + "T00:00:00"));
        if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
      });
      if (bestIdx >= 0 && bestDiff < 7 * 86400000) {
        const x = PAD_L + (bestIdx / (candles.length - 1)) * iW;
        const priceUSD = lot.price && isThai ? lot.price / exchangeRate : lot.price;
        markers.push({ x, lot, priceUSD, idx: bestIdx, num: i + 1 });
      }
    });
    return markers;
  }, [lots, candles, PAD_L, iW, isThai, exchangeRate]);

  /* ── Hover handler (Maps cursor to active purchase region) ── */
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || !pts || pts.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left - PAD_L) / iW;
    const idx = Math.max(0, Math.min(Math.round(relX * (candles.length - 1)), candles.length - 1));
    const pt = pts[idx];
    const costPt = costPts[idx];
    if (pt && costPt) {
      setHovered({
        idx,
        x: pt.x,
        y: pt.y,
        costY: costPt.y,
        value: pt.value,
        cost: costPt.cost,
        date: pt.date
      });
    }
  }, [pts, costPts, candles, PAD_L, iW]);

  const hasCostLine = activeCostPts.length > 0 && (avgCost > 0 || (lots && lots.length > 0));
  const color = isUp ? "#00B98A" : "#FF4B55";

  if (!candles || candles.length < 2) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
        <RefreshCw size={18} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} /> กำลังโหลดข้อมูลกราฟ...
      </div>
    );
  }

  const latestCost = activeCostPts.length > 0 ? activeCostPts[activeCostPts.length - 1].cost : 0;

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative", userSelect: "none" }}
      onMouseMove={handleMouseMove} onMouseLeave={() => setHovered(null)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", cursor: "crosshair" }}>
        <defs>
          {/* Gradient for gain area (above cost) */}
          <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00B98A" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#00B98A" stopOpacity="0.04" />
          </linearGradient>
          {/* Gradient for loss area (below cost) */}
          <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4B55" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FF4B55" stopOpacity="0.25" />
          </linearGradient>

          {/* Dynamic Clipping path for Above Cost (Gain Zone) */}
          {clipAboveCostPath && (
            <clipPath id="assetClipAboveCost">
              <path d={clipAboveCostPath} />
            </clipPath>
          )}
          {/* Dynamic Clipping path for Below Cost (Loss Zone) */}
          {clipBelowCostPath && (
            <clipPath id="assetClipBelowCost">
              <path d={clipBelowCostPath} />
            </clipPath>
          )}
          {/* Dynamic Clipping path for Above Value */}
          {clipAboveValuePath && (
            <clipPath id="assetClipAboveValue">
              <path d={clipAboveValuePath} />
            </clipPath>
          )}
          {/* Full Clip */}
          <clipPath id="assetClipFull">
            <rect x={PAD_L} y={PAD_T} width={iW} height={iH} />
          </clipPath>
        </defs>

        {/* ── Grid lines ── */}
        {yTicks.map(({ v, y }, i) => (
          <line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
            stroke="#E8EBF2" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {xTicks.map(({ x }, i) => (
          <line key={i} x1={x} y1={PAD_T} x2={x} y2={H - PAD_B}
            stroke="#F1F5F9" strokeWidth="1" />
        ))}

        {/* ── Fill areas with Clipping ── */}
        {hasCostLine && costLinePath && fillValueArea && fillCostArea ? (
          <>
            {/* Gain Zone (Value > Cost): Green Fill */}
            <path d={fillValueArea} fill="url(#gainGrad)" clipPath="url(#assetClipAboveCost)" />
            {/* Loss Zone (Value < Cost): Red Fill */}
            <path d={fillCostArea} fill="url(#lossGrad)" clipPath="url(#assetClipAboveValue)" />
          </>
        ) : (
          fillValueArea && <path d={fillValueArea} fill={isUp ? "url(#gainGrad)" : "url(#lossGrad)"} clipPath="url(#assetClipFull)" />
        )}

        {/* ── Dynamic Dashed Cost Line ── */}
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

        {/* ── Dual-color Price Value Line ── */}
        {linePath && costLinePath ? (
          <>
            {/* Green Price Line when above Cost */}
            <path
              d={linePath}
              fill="none"
              stroke="#00B98A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#assetClipAboveCost)"
            />
            {/* Red Price Line when below Cost */}
            <path
              d={linePath}
              fill="none"
              stroke="#FF4B55"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#assetClipBelowCost)"
            />
          </>
        ) : (
          linePath && (
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" clipPath="url(#assetClipFull)" />
          )
        )}

        {/* ── Cost badge on the right end of the cost line ── */}
        {hasCostLine && activeCostPts.length > 0 && (
          <>
            <rect
              x={W - PAD_R - 74}
              y={activeCostPts[activeCostPts.length - 1].y - 11}
              width={74}
              height={20}
              rx="5"
              fill="#5236FF"
              opacity="0.9"
            />
            <text
              x={W - PAD_R - 37}
              y={activeCostPts[activeCostPts.length - 1].y + 4}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              fontWeight="800"
              fontFamily="Outfit,sans-serif"
            >
              {fmtUSD(latestCost)}
            </text>
          </>
        )}

        {/* ── Lot purchase markers ── */}
        {lotMarkers.map((m, i) => (
          <g key={i}>
            <line x1={m.x} y1={PAD_T} x2={m.x} y2={H - PAD_B}
              stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.9" />
            <circle cx={m.x} cy={PAD_T + 12} r="7" fill="#F59E0B" />
            <text x={m.x} y={PAD_T + 16} textAnchor="middle" fontSize="9" fill="white" fontWeight="800" fontFamily="Outfit,sans-serif">
              {m.num}
            </text>
          </g>
        ))}

        {/* ── Hover crosshair ── */}
        {hovered && (
          <>
            <line x1={hovered.x} y1={PAD_T} x2={hovered.x} y2={H - PAD_B}
              stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={hovered.x} cy={hovered.y} r="5"
              fill="white" stroke={hovered.value >= hovered.cost ? "#00B98A" : "#FF4B55"} strokeWidth="2.5" />
            {hovered.cost > 0 && (
              <circle cx={hovered.x} cy={hovered.costY} r="4"
                fill="white" stroke="#5236FF" strokeWidth="2" />
            )}
          </>
        )}

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
            {fmtDate(date, tf)}
          </text>
        ))}

        {/* ── Hover tooltip ── */}
        {hovered && (() => {
          const tipW = 140, tipH = 58;
          const tipX = Math.min(hovered.x - tipW / 2, W - PAD_R - tipW);
          const tipY = hovered.y < PAD_T + tipH + 20 ? hovered.y + 14 : hovered.y - tipH - 14;
          
          const diff = hovered.cost > 0 ? hovered.value - hovered.cost : 0;
          const diffPct = hovered.cost > 0 ? (diff / hovered.cost) * 100 : 0;
          return (
            <g>
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="10"
                fill="#1E293B" opacity="0.95" />
              <text x={tipX + tipW / 2} y={tipY + 15} textAnchor="middle"
                fontSize="10" fill="#94A3B8" fontFamily="Outfit,sans-serif">
                {fmtDate(hovered.date, tf)}
              </text>
              <text x={tipX + tipW / 2} y={tipY + 30} textAnchor="middle"
                fontSize="12" fill="white" fontWeight="800" fontFamily="Outfit,sans-serif">
                มูลค่า: {fmtUSD(hovered.value)}
              </text>
              {hovered.cost > 0 && (
                <text x={tipX + tipW / 2} y={tipY + 45} textAnchor="middle"
                  fontSize="11" fill={diff >= 0 ? "#00B98A" : "#FF4B55"} fontWeight="800" fontFamily="Outfit,sans-serif">
                  ต้นทุน: {fmtUSD(hovered.cost)} ({fmtPct(diffPct)})
                </text>
              )}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ASSET DETAIL PANEL
══════════════════════════════════════════════════════ */
const TF_OPTIONS = ["1D", "5D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y"];

export default function AssetDetailPanel({ asset, price, exchangeRate, onClose }) {
  const [tf, setTf]         = useState("1M");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const isThai = asset?.symbol?.endsWith(".BK");

  /* ── Fetch chart data ── */
  useEffect(() => {
    if (!asset?.symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setChartData(null);

    fetch(`/api/prices?history=${encodeURIComponent(asset.symbol)}&tf=${tf}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) { setError(data.error); setLoading(false); return; }
        setChartData(data);
        setLoading(false);
      })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [asset?.symbol, tf]);

  if (!asset) return null;

  const pData = price || {};
  const priceUSD    = isThai ? (pData.price || 0) / exchangeRate : (pData.price || 0);
  const changeUSD   = isThai ? (pData.change || 0) / exchangeRate : (pData.change || 0);
  const changePct   = pData.changePercent || 0;
  const valueUSD    = priceUSD * asset.qty;

  // Robustly handle avgCost vs avgPrice for backward compatibility
  const avgCost     = asset.avgCost ?? asset.avgPrice ?? 0;
  const costUSD     = avgCost * asset.qty / (isThai ? exchangeRate : 1);
  const gainUSD     = valueUSD - costUSD;
  const gainPct     = costUSD > 0 ? ((valueUSD - costUSD) / costUSD) * 100 : 0;
  const lots        = asset.lots || [];

  // Recompute properly
  const avgCostUSD = isThai ? avgCost / exchangeRate : avgCost;
  const totalCostUSD = avgCostUSD * asset.qty;
  const totalGainUSD = valueUSD - totalCostUSD;
  const totalGainPct = totalCostUSD > 0 ? (totalGainUSD / totalCostUSD) * 100 : 0;

  const isUp = changePct >= 0;
  const gainUp = totalGainUSD >= 0;

  return (
    <div className="asset-detail-panel" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="asset-detail-content">

        {/* ── Header ── */}
        <div className="asset-detail-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className={`asset-icon-wrapper ${asset.category || "stock"}`} style={{ width: 48, height: 48, fontSize: 16, flexShrink: 0 }}>
              {asset.symbol.slice(0, 2)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text-main)" }}>{asset.symbol}</span>
                <span className={`badge-type ${asset.category || "stock"}`}>{asset.category || "stock"}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{asset.name}</div>
            </div>
          </div>
          <button className="btn-close ripple-btn" onClick={onClose} style={{ width: 36, height: 36 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Price Summary Bar ── */}
        <div className="asset-detail-price-bar">
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)", lineHeight: 1 }}>
              {fmtUSD(priceUSD)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
              ฿{Math.round(priceUSD * exchangeRate).toLocaleString("th-TH")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: isUp ? "var(--gain)" : "var(--loss)" }}>
              {isUp ? "▲" : "▼"} {fmtPct(changePct)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)" }}>วันนี้</div>
          </div>
        </div>

        {/* ── KPI Mini Grid ── */}
        <div className="asset-detail-kpi-grid">
          <div className="asset-detail-kpi">
            <div className="asset-detail-kpi-label">จำนวนถือ</div>
            <div className="asset-detail-kpi-val">{fmtQty(asset.qty)} หน่วย</div>
          </div>
          <div className="asset-detail-kpi">
            <div className="asset-detail-kpi-label">ราคาทุนเฉลี่ย</div>
            <div className="asset-detail-kpi-val">{fmtUSD(avgCostUSD)}</div>
          </div>
          <div className="asset-detail-kpi">
            <div className="asset-detail-kpi-label">มูลค่าปัจจุบัน</div>
            <div className="asset-detail-kpi-val">{fmtUSD(valueUSD)}</div>
          </div>
          <div className={`asset-detail-kpi ${gainUp ? "gain-kpi" : "loss-kpi"}`}>
            <div className="asset-detail-kpi-label">กำไร/ขาดทุนรวม</div>
            <div className="asset-detail-kpi-val" style={{ color: gainUp ? "var(--gain)" : "var(--loss)", fontWeight: 900 }}>
              {gainUp ? "+" : ""}{fmtUSD(totalGainUSD)}
              <span style={{ fontSize: 11, marginLeft: 4 }}>({fmtPct(totalGainPct)})</span>
            </div>
          </div>
        </div>

        {/* ── TF Selector ── */}
        <div className="asset-detail-tf-bar">
          <div className="chart-range-tabs">
            {TF_OPTIONS.map(t => (
              <button key={t}
                className={`chart-range-tab${tf === t ? " active" : ""} ripple-btn`}
                onClick={() => setTf(t)}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>
            {tf === "1D" ? "รายนาที (5m)" : tf === "5D" ? "รายชั่วโมง" : tf === "1W" ? "ราย 30 นาที" : tf === "5Y" ? "รายสัปดาห์" : "รายวัน"}
          </div>
        </div>

        {/* ── Lot legend ── */}
        {lots.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
            {lots.map((lot, i) => (
              <div key={lot.id || i} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "#FFFBEB", border: "1px solid #FCD34D",
                borderRadius: 8, padding: "3px 8px", fontSize: 11
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", background: "#F59E0B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 900, fontSize: 9
                }}>{i + 1}</div>
                <span style={{ fontWeight: 700, color: "#92400E" }}>
                  {fmtDateShort(lot.date)} · {fmtQty(lot.qty)} × {fmtUSD(isThai ? lot.price / exchangeRate : lot.price)}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EEECFF", border: "1px solid #C3C7FA", borderRadius: 8, padding: "3px 8px", fontSize: 11 }}>
              <div style={{ width: 20, height: 2, background: "#5236FF", borderTop: "2px dashed #5236FF" }} />
              <span style={{ fontWeight: 700, color: "#5236FF" }}>ราคาทุนเฉลี่ย {fmtUSD(avgCostUSD)}</span>
            </div>
          </div>
        )}

        {/* ── Chart ── */}
        <div className="asset-detail-chart-container">
          {loading ? (
            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-muted)" }}>
              <div className="spinner sm" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>กำลังโหลดกราฟ {tf}...</span>
            </div>
          ) : error ? (
            <div style={{ height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)" }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <span style={{ fontSize: 13 }}>โหลดกราฟไม่สำเร็จ: {error}</span>
              <button className="btn btn-secondary ripple-btn" style={{ height: 36, fontSize: 12 }}
                onClick={() => setTf(prev => { const t = prev; setTimeout(() => setTf(t), 50); return prev; })}>
                ลองใหม่
              </button>
            </div>
          ) : chartData?.candles ? (
            <AssetChart
              candles={chartData.candles}
              avgCost={avgCost}
              lots={lots}
              tf={tf}
              isThai={isThai}
              exchangeRate={exchangeRate}
            />
          ) : null}
        </div>

        {/* ── Purchase History Table ── */}
        {lots.length > 0 && (
          <div className="asset-detail-lots">
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingCart size={14} /> ประวัติการซื้อ ({lots.length} รายการ)
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>ครั้ง</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>วันที่ซื้อ</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>จำนวน</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>ราคาทุน</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>ต้นทุน</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {[...lots].reverse().map((lot, i) => {
                    const lotCostUSD = (isThai ? lot.price / exchangeRate : lot.price) * lot.qty;
                    const lotValUSD  = priceUSD * lot.qty;
                    const lotGain    = lotValUSD - lotCostUSD;
                    const lotGainPct = lotCostUSD > 0 ? (lotGain / lotCostUSD) * 100 : 0;
                    return (
                      <tr key={lot.id || i} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "9px 12px" }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", background: "#F59E0B",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 900, fontSize: 10
                          }}>{lots.length - i}</div>
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--text-muted)" }}>
                          {fmtDateShort(lot.date)}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>
                          {fmtQty(lot.qty)}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>
                          {fmtUSD(isThai ? lot.price / exchangeRate : lot.price)}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700 }}>
                          {fmtUSD(lotCostUSD)}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 800, color: lotGain >= 0 ? "var(--gain)" : "var(--loss)" }}>
                          {lotGain >= 0 ? "+" : ""}{fmtUSD(lotGain)}
                          <div style={{ fontSize: 10, opacity: 0.8 }}>{fmtPct(lotGainPct)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border)", background: "var(--primary-light)" }}>
                    <td colSpan={2} style={{ padding: "9px 12px", fontWeight: 800, color: "var(--primary)" }}>รวม</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>{fmtQty(asset.qty)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 11, color: "var(--text-muted)" }}>avg {fmtUSD(avgCostUSD)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>{fmtUSD(totalCostUSD)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 900, color: gainUp ? "var(--gain)" : "var(--loss)" }}>
                      {gainUp ? "+" : ""}{fmtUSD(totalGainUSD)}
                      <div style={{ fontSize: 10 }}>{fmtPct(totalGainPct)}</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
