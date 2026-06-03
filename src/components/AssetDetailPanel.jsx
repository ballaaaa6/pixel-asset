import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, TrendingUp, TrendingDown, RefreshCw, ShoppingCart, Calendar, History, ChevronDown, ChevronUp } from "lucide-react";

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

function AssetLogo({ symbol, category, style }) {
  const [srcIndex, setSrcIndex] = useState(0);
  const sym = symbol ? symbol.split(".")[0].toUpperCase() : "";

  // Build ordered list of logo sources to try
  const sources = useMemo(() => {
    if (!sym) return [];
    const cat = category || "stock";

    if (cat === "fiat") {
      const code = ({
        THB:"th",USD:"us",EUR:"eu",JPY:"jp",GBP:"gb",AUD:"au",CAD:"ca",
        SGD:"sg",CHF:"ch",CNY:"cn",HKD:"hk",KRW:"kr",INR:"in",NZD:"nz",
        SEK:"se",NOK:"no",DKK:"dk",MYR:"my",IDR:"id",PHP:"ph",VND:"vn",
        TWD:"tw",BRL:"br",RUB:"ru",ZAR:"za",TRY:"tr",MXN:"mx"
      })[sym] || sym.slice(0,2).toLowerCase();
      return [`https://flagcdn.com/w80/${code}.png`];
    }

    if (cat === "crypto") {
      return [
        `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
        `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/128/color/${sym.toLowerCase()}.png`,
        `https://www.google.com/s2/favicons?sz=128&domain=${sym.toLowerCase()}.org`
      ];
    }

    if (cat === "gold" || sym === "XAU" || sym === "GLD" || sym === "IAU") {
      return [`https://images.financialmodelingprep.com/symbol/GLD.png`];
    }

    // Stock: try Financial Modeling Prep (free, no token needed), then logo.dev, then TradingView, then Google favicon
    return [
      `https://images.financialmodelingprep.com/symbol/${sym}.png`,
      `https://img.logo.dev/ticker/${sym}?token=pk_R4dEIaKTRG-i8tSiILBNZA&size=128&format=png`,
      `https://s3-symbol-logo.tradingview.com/stock/${sym.toLowerCase()}.svg`,
      `https://www.google.com/s2/favicons?sz=128&domain=${sym.toLowerCase()}.com`
    ];
  }, [sym, category]);

  // Reset when symbol changes
  useEffect(() => { setSrcIndex(0); }, [sym, category]);

  if (!sources.length || srcIndex >= sources.length) {
    // Final fallback: colourful text initials
    return (
      <div className={`asset-icon-wrapper ${category || "stock"}`} style={style}>
        {sym.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={sources[srcIndex]}
      alt={sym}
      onError={() => setSrcIndex(i => i + 1)}
      style={{
        width: 38, height: 38, borderRadius: 12,
        objectFit: "contain", background: "#FFFFFF",
        padding: 4, border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)", flexShrink: 0,
        ...style
      }}
    />
  );
}


const getCurrencyTicker = (symbol) => {
  if (symbol === "USD") return "USD";
  if (["EUR", "GBP", "AUD", "NZD"].includes(symbol)) {
    return `${symbol}USD=X`;
  }
  return `${symbol}=X`;
};


/* ══════════════════════════════════════════════════════
   MAIN ASSET DETAIL CHART
══════════════════════════════════════════════════════ */
function AssetChart({ candles, avgCost, lots, tf, isThai, exchangeRate, asset }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [dims, setDims] = useState({ w: 600, h: 280 });
  const [zoomRange, setZoomRange] = useState(null); // { start, end }
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [diffStartIdx, setDiffStartIdx] = useState(null);
  const [diffEndIdx, setDiffEndIdx] = useState(null);
  const [isDiffActive, setIsDiffActive] = useState(false);
  const touchRef = useRef({ lastX: 0, lastY: 0, type: null, startDist: 0, startZoom: null, isPinching: false, centerX: 0 });
  const lastTouchTime = useRef(0);

  const diffStartIdxRef = useRef(null);
  const diffEndIdxRef = useRef(null);

  const updateDiffStartIdx = (val) => {
    setDiffStartIdx(val);
    diffStartIdxRef.current = val;
  };

  const updateDiffEndIdx = (val) => {
    setDiffEndIdx(val);
    diffEndIdxRef.current = val;
  };


  useEffect(() => {
    setZoomRange(null);
  }, [candles, tf]);

  /* Responsive sizing */
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: Math.min(300, Math.max(200, e.contentRect.width * 0.42)) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [candles]);

  const { W, H, PAD_L, PAD_R, PAD_T, PAD_B } = useMemo(() => ({
    W: dims.w, H: dims.h,
    PAD_L: 58, PAD_R: 16, PAD_T: 24, PAD_B: 40,
  }), [dims]);

  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;

  const displayedCandles = useMemo(() => {
    if (!candles) return [];
    if (!zoomRange) return candles;
    return candles.slice(zoomRange.start, zoomRange.end + 1);
  }, [candles, zoomRange]);

  /* ── Compute Y range: adaptive tight scale with dynamic cost curve ── */
  const { pts, costPts, yMin, yMax, isUp } = useMemo(() => {
    if (!displayedCandles || displayedCandles.length < 2) return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true };

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

    const isCashAsset = asset?.type === "fiat" || asset?.category === "fiat";

    // Calculate unit price and unit average cost for each candle
    const rawData = displayedCandles.map((c) => {
      const targetDateOnly = c.date.split("T")[0];

      let priceUSD = 0;
      if (isCashAsset) {
        if (asset.symbol === "USD") {
          priceUSD = 1.0;
        } else {
          if (["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol)) {
            priceUSD = c.close;
          } else {
            priceUSD = 1.0 / c.close;
          }
        }
      } else {
        priceUSD = isThai ? c.close / exchangeRate : c.close;
      }

      // Check if this candle is on or after the first purchase date
      const hasPurchased = targetDateOnly >= firstPurchaseDate;

      if (!hasPurchased) {
        // Return unit price as valueUSD, but null/0 costUSD for days before purchase
        return { date: c.date, valueUSD: priceUSD, costUSD: null, hasPurchased: false };
      }

      const stats = getStatsOnDate(c.date);

      // Use unit average cost basis instead of cumulative total cost
      let costUSD = 0;
      if (stats.qty > 0) {
        if (isCashAsset) {
          costUSD = stats.cost / stats.qty;
        } else {
          costUSD = isThai ? (stats.cost / stats.qty) / exchangeRate : (stats.cost / stats.qty);
        }
      } else {
        costUSD = isThai ? avgCost / exchangeRate : avgCost;
      }

      return { date: c.date, valueUSD: priceUSD, costUSD, hasPurchased: true };
    });

    const valuesUSD = rawData.map(d => d.valueUSD).filter(v => v != null);
    const costsUSD = rawData.filter(d => d.hasPurchased).map(d => d.costUSD).filter(c => c != null);

    if (valuesUSD.length === 0) {
      return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true };
    }

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
    const toX = (i) => PAD_L + (i / (displayedCandles.length - 1)) * iW;

    // Map all candles: return price movement for all days, but with costUSD only after purchase
    const pts = displayedCandles.map((c, i) => {
      const d = rawData[i];
      if (d.valueUSD == null) return null;
      return { x: toX(i), y: toY(d.valueUSD), value: d.valueUSD, date: c.date, hasPurchased: d.hasPurchased };
    });

    const costPts = displayedCandles.map((c, i) => {
      const d = rawData[i];
      if (!d.hasPurchased || d.costUSD == null) return null;
      return { x: toX(i), y: toY(d.costUSD), cost: d.costUSD, date: c.date };
    });

    // Determine isUp based on the entire displayed portion
    const isUp = valuesUSD.length >= 2 ? valuesUSD[valuesUSD.length - 1] >= valuesUSD[0] : true;

    return { pts, costPts, yMin, yMax, isUp, toY, toX };
  }, [displayedCandles, avgCost, lots, isThai, exchangeRate, PAD_T, iH, PAD_L, iW, tf, asset]);

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
    if (!displayedCandles || displayedCandles.length < 2) return [];
    const count = Math.min(6, displayedCandles.length);
    const step = Math.floor(displayedCandles.length / count);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i * step, displayedCandles.length - 1);
      return { idx, x: PAD_L + (idx / (displayedCandles.length - 1)) * iW, date: displayedCandles[idx].date };
    });
  }, [displayedCandles, PAD_L, iW]);

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
    if (!lots || !displayedCandles || displayedCandles.length < 2) return [];
    const startIdx = zoomRange ? zoomRange.start : 0;
    const endIdx = zoomRange ? zoomRange.end : candles.length - 1;
    const markers = [];
    const startStr = candles[0].date.split("T")[0];
    const endStr = candles[candles.length - 1].date.split("T")[0];

    lots.forEach((lot, i) => {
      if (!lot || !lot.date) return;
      const lotDateStr = lot.date;

      // Strict boundary check: transaction must be within history bounds
      if (lotDateStr < startStr || lotDateStr > endStr) return;

      let bestIdx = -1, bestDiff = Infinity;

      // Try to find exact string match first in original candles
      bestIdx = candles.findIndex(c => c.date.split("T")[0] === lotDateStr);

      if (bestIdx === -1) {
        const targetTime = new Date(lotDateStr + "T00:00:00.000Z").getTime();
        candles.forEach((c, idx) => {
          const cTime = new Date(c.date).getTime();
          const diff = Math.abs(cTime - targetTime);
          if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
        });
      } else {
        bestDiff = 0;
      }

      if (bestIdx >= startIdx && bestIdx <= endIdx && (bestDiff < 7 * 86400000 || bestDiff === 0)) {
        const displayIdx = bestIdx - startIdx;
        const x = PAD_L + (displayIdx / (displayedCandles.length - 1)) * iW;
        const priceUSD = lot.price && isThai ? lot.price / exchangeRate : lot.price;
        markers.push({ x, lot, priceUSD, idx: bestIdx, num: i + 1 });
      }
    });
    return markers;
  }, [lots, candles, displayedCandles, zoomRange, PAD_L, iW, isThai, exchangeRate]);

  const stateRef = useRef();
  stateRef.current = {
    candles,
    zoomRange,
    displayedCandles,
    W,
    H,
    iW,
    iH,
    PAD_L,
    PAD_R,
    PAD_T,
    PAD_B,
    diffStartIdx,
    diffEndIdx,
    pts,
    costPts,
    isDiffActive
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseX >= PAD_L && mouseX <= W - PAD_R) {
      if (e.shiftKey && zoomRange) {
        setDragStart({ x: mouseX, type: "pan", startZoom: { ...zoomRange } });
      } else {
        const relX = (mouseX - PAD_L) / iW;
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
        const originalIdx = (zoomRange ? zoomRange.start : 0) + idx;

        setIsDiffActive(true);
        updateDiffStartIdx(originalIdx);
        updateDiffEndIdx(originalIdx);
        setDragStart({ x: mouseX, type: "diff" });
        setHovered(null);
      }
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || !pts || pts.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseXInSvg = ((e.clientX - rect.left) / rect.width) * W;

    if (dragStart) {
      if (dragStart.type === "diff") {
        const boundedX = Math.max(PAD_L, Math.min(W - PAD_R, mouseXInSvg));
        const relX = (boundedX - PAD_L) / iW;
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
        const originalIdx = (zoomRange ? zoomRange.start : 0) + idx;
        updateDiffEndIdx(originalIdx);
        setHovered(null);
      } else if (dragStart.type === "pan") {
        const deltaX = mouseXInSvg - dragStart.x;
        const len = candles.length;
        const currentStart = dragStart.startZoom.start;
        const currentEnd = dragStart.startZoom.end;
        const rangeSize = currentEnd - currentStart;
        const stepSize = iW / Math.max(1, rangeSize);
        const indexShift = Math.round(-deltaX / stepSize);

        if (indexShift !== 0) {
          let newStart = currentStart + indexShift;
          let newEnd = currentEnd + indexShift;
          if (newStart < 0) {
            newStart = 0;
            newEnd = newStart + rangeSize;
          }
          if (newEnd >= len) {
            newEnd = len - 1;
            newStart = Math.max(0, newEnd - rangeSize);
          }
          setZoomRange({ start: newStart, end: newEnd });
        }
        setHovered(null);
      }
      return;
    }

    if (isDiffActive) return;

    const relX = (mouseXInSvg - PAD_L) / iW;
    const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
    const pt = pts[idx];
    if (pt) {
      const costPt = costPts[idx];
      setHovered({
        idx,
        x: pt.x,
        y: pt.y,
        costY: costPt ? costPt.y : null,
        value: pt.value,
        cost: costPt ? costPt.cost : null,
        date: pt.date,
        hasPurchased: pt.hasPurchased
      });
    }
  }, [pts, costPts, displayedCandles, PAD_L, iW, W, dragStart, zoomRange, candles, isDiffActive]);

  const handleMouseUp = () => {
    if (dragStart && dragStart.type === "diff") {
      if (diffStartIdxRef.current === diffEndIdxRef.current) {
        setIsDiffActive(false);
        updateDiffStartIdx(null);
        updateDiffEndIdx(null);
      }
    }
    setDragStart(null);
    setDragEnd(null);
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setDragStart(null);
    setDragEnd(null);
  };

  // Combined programmatic event listeners to control passive behavior and enable vertical scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getLatest = () => stateRef.current;

    const handleWheel = (e) => {
      const { candles, zoomRange, displayedCandles, W, iW, PAD_L } = getLatest();
      if (!candles || candles.length < 2) return;
      e.preventDefault();

      const isZoomIn = e.deltaY < 0;
      const len = candles.length;
      const currentStart = zoomRange ? zoomRange.start : 0;
      const currentEnd = zoomRange ? zoomRange.end : len - 1;
      const rangeSize = currentEnd - currentStart;

      const rect = el.getBoundingClientRect();
      const mouseXInSvg = ((e.clientX - rect.left) / rect.width) * W;
      const relX = (mouseXInSvg - PAD_L) / iW;
      const hoveredIdx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
      const centerIdx = currentStart + hoveredIdx;

      if (isZoomIn) {
        if (rangeSize <= 2) return;
        const cropSize = Math.max(1, Math.floor(rangeSize * 0.12));
        const newRangeSize = Math.max(2, rangeSize - cropSize * 2);

        let newStart = Math.round(centerIdx - relX * newRangeSize);
        let newEnd = newStart + newRangeSize;

        if (newStart < 0) {
          newStart = 0;
          newEnd = newRangeSize;
        }
        if (newEnd >= len) {
          newEnd = len - 1;
          newStart = Math.max(0, newEnd - newRangeSize);
        }

        setZoomRange({ start: newStart, end: newEnd });
      } else {
        if (!zoomRange) return;
        const expandSize = Math.max(1, Math.floor(rangeSize * 0.12));
        const newRangeSize = Math.min(len - 1, rangeSize + expandSize * 2);

        let newStart = Math.round(centerIdx - relX * newRangeSize);
        let newEnd = newStart + newRangeSize;

        if (newStart < 0) {
          newStart = 0;
          newEnd = newRangeSize;
        }
        if (newEnd >= len) {
          newEnd = len - 1;
          newStart = Math.max(0, newEnd - newRangeSize);
        }

        if (newStart === 0 && newEnd === len - 1) {
          setZoomRange(null);
        } else {
          setZoomRange({ start: newStart, end: newEnd });
        }
      }
    };

    const handleDblClick = (e) => {
      e.preventDefault();
      setZoomRange(null);
    };

    const handleTouchStart = (e) => {
      const { candles, zoomRange, displayedCandles, W, iW, PAD_L, PAD_R } = getLatest();
      if (!candles || candles.length < 2) return;

      if (e.touches.length === 1) {
        const rect = el.getBoundingClientRect();
        const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
        if (touchX >= PAD_L && touchX <= W - PAD_R) {
          const relX = (touchX - PAD_L) / iW;
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
          const originalIdx = (zoomRange ? zoomRange.start : 0) + idx;

          touchRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            lastX: e.touches[0].clientX,
            lastY: e.touches[0].clientY,
            type: null,
            startIdx: originalIdx,
            isPinching: false
          };
          setHovered(null);
        }
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const initialZoom = zoomRange || { start: 0, end: candles.length - 1 };
        touchRef.current = {
          startDist: dist,
          startZoom: { ...initialZoom },
          isPinching: true,
          centerX: (t1.clientX + t2.clientX) / 2
        };
      }
    };

    const handleTouchMove = (e) => {
      const { candles, zoomRange, displayedCandles, W, iW, PAD_L, PAD_R } = getLatest();
      if (!candles || candles.length < 2) return;
      const ref = touchRef.current;
      if (!ref) return;

      if (e.touches.length === 1 && !ref.isPinching) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        if (ref.type === null) {
          const dx = Math.abs(currentX - ref.startX);
          const dy = Math.abs(currentY - ref.startY);
          if (dx > 5 || dy > 5) {
            if (dx > dy) {
              ref.type = "diff";
              setIsDiffActive(true);
              updateDiffStartIdx(ref.startIdx);
              updateDiffEndIdx(ref.startIdx);
            } else {
              ref.type = "scroll";
            }
          }
        }

        if (ref.type === "diff") {
          const rect = el.getBoundingClientRect();
          const touchX = ((currentX - rect.left) / rect.width) * W;
          const boundedX = Math.max(PAD_L, Math.min(W - PAD_R, touchX));
          const relX = (boundedX - PAD_L) / iW;
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
          const originalIdx = (zoomRange ? zoomRange.start : 0) + idx;

          updateDiffEndIdx(originalIdx);
          setHovered(null);
          e.preventDefault();
        }
      } else if (e.touches.length === 2 && ref.isPinching) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        const ratio = ref.startDist / dist;
        const len = candles.length;
        const startZoom = ref.startZoom;
        const initialRangeSize = startZoom.end - startZoom.start;

        let newRangeSize = Math.round(initialRangeSize * ratio);
        newRangeSize = Math.max(2, Math.min(len - 1, newRangeSize));

        const rect = el.getBoundingClientRect();
        const relativeX = ((ref.centerX - rect.left) / rect.width);

        let newStart = Math.round((startZoom.start + initialRangeSize * relativeX) - relativeX * newRangeSize);
        let newEnd = newStart + newRangeSize;

        if (newStart < 0) {
          newStart = 0;
          newEnd = newRangeSize;
        }
        if (newEnd >= len) {
          newEnd = len - 1;
          newStart = Math.max(0, newEnd - newRangeSize);
        }

        if (newStart === 0 && newEnd === len - 1) {
          setZoomRange(null);
        } else {
          setZoomRange({ start: newStart, end: newEnd });
        }
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      const ref = touchRef.current;
      if (ref) {
        if (ref.type === "diff") {
          if (diffStartIdxRef.current === diffEndIdxRef.current) {
            setIsDiffActive(false);
            updateDiffStartIdx(null);
            updateDiffEndIdx(null);
          }
        } else if (ref.type === null) {
          setIsDiffActive(false);
          updateDiffStartIdx(null);
          updateDiffEndIdx(null);
        }
      }
      touchRef.current = { lastX: 0, startDist: 0, startZoom: null, isPinching: false, centerX: 0 };
    };

    const handleTouchStartWithDoubleTap = (e) => {
      const now = Date.now();
      if (now - lastTouchTime.current < 300) {
        e.preventDefault();
        setZoomRange(null);
        return;
      }
      lastTouchTime.current = now;
      handleTouchStart(e);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("dblclick", handleDblClick);
    el.addEventListener("touchstart", handleTouchStartWithDoubleTap, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("dblclick", handleDblClick);
      el.removeEventListener("touchstart", handleTouchStartWithDoubleTap);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [candles]);


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
    <div ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "100%",
        position: "relative",
        userSelect: "none",
        cursor: zoomRange ? (dragStart && dragStart.type === "pan" ? "grabbing" : "grab") : "crosshair",
        touchAction: "pan-y"
      }}>
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
          {hasCostLine && activeCostPts.length >= 2 && (
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
        {yTicks.map(({ v, y }, i) => (
          <line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
            stroke="#E8EBF2" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {xTicks.map(({ x }, i) => (
          <line key={i} x1={x} y1={PAD_T} x2={x} y2={H - PAD_B}
            stroke="#F1F5F9" strokeWidth="1" />
        ))}

        {/* Range selection diff highlight */}
        {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && diffStartIdx !== diffEndIdx && (() => {
          const currentStart = zoomRange ? zoomRange.start : 0;
          const dispStartIdx = diffStartIdx - currentStart;
          const dispEndIdx = diffEndIdx - currentStart;

          if (dispStartIdx >= 0 && dispStartIdx < displayedCandles.length &&
              dispEndIdx >= 0 && dispEndIdx < displayedCandles.length && pts[dispStartIdx] && pts[dispEndIdx]) {
            const xA = pts[dispStartIdx].x;
            const xB = pts[dispEndIdx].x;
            const yA = pts[dispStartIdx].y;
            const yB = pts[dispEndIdx].y;

            return (
              <g style={{ pointerEvents: "none" }}>
                <line x1={xA} y1={PAD_T} x2={xA} y2={H - PAD_B} stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <line x1={xB} y1={PAD_T} x2={xB} y2={H - PAD_B} stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <line x1={xA} y1={yA} x2={xB} y2={yB} stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />
                <circle cx={xA} cy={yA} r="6" fill="white" stroke="var(--primary)" strokeWidth="3" />
                <circle cx={xB} cy={yB} r="6" fill="white" stroke="var(--primary)" strokeWidth="3" />
              </g>
            );
          }
          return null;
        })()}

        {/* ── Fill areas with Clipping ── */}
        {hasCostLine && costLinePath && fillValueArea && fillCostArea && activeCostPts.length >= 2 ? (
          <g clipPath="url(#purchasedClip)">
            {/* Gain Zone (Value > Cost): Green Fill */}
            <path d={fillValueArea} fill="url(#gainGrad)" clipPath="url(#assetClipAboveCost)" />
            {/* Loss Zone (Value < Cost): Red Fill */}
            <path d={fillCostArea} fill="url(#lossGrad)" clipPath="url(#assetClipAboveValue)" />
          </g>
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

        {/* ── Price Value Line ── */}
        {linePath && costLinePath && activeCostPts.length >= 2 ? (
          <>
            {/* Pre-purchased neutral price line */}
            <path
              d={linePath}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              clipPath="url(#prePurchasedClip)"
            />
            {/* Purchased price line wrapped with purchasedClip */}
            <g clipPath="url(#purchasedClip)">
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
            </g>
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
              fill="white" stroke={hovered.cost != null && hovered.value >= hovered.cost ? "#00B98A" : hovered.cost != null ? "#FF4B55" : "#94A3B8"} strokeWidth="2.5" />
            {hovered.costY != null && (
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
          const tipW = 160, tipH = hovered.cost != null ? 68 : 46;
          const tipX = hovered.x < W / 2
            ? Math.min(hovered.x + 15, W - PAD_R - tipW)
            : Math.max(PAD_L + 15, hovered.x - tipW - 15);
          const tipY = Math.max(PAD_T + 10, Math.min(H - PAD_B - tipH - 10, hovered.y - tipH / 2));

          const diff = hovered.cost != null ? hovered.value - hovered.cost : 0;
          const diffPct = hovered.cost != null && hovered.cost > 0 ? (diff / hovered.cost) * 100 : 0;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="10"
                fill="#1E293B" opacity="0.95" />
              <text x={tipX + tipW / 2} y={tipY + 15} textAnchor="middle"
                fontSize="10" fill="#94A3B8" fontFamily="Outfit,sans-serif">
                {fmtDate(hovered.date, tf)}
              </text>
              <text x={tipX + tipW / 2} y={tipY + 31} textAnchor="middle"
                fontSize="12" fill="white" fontWeight="800" fontFamily="Outfit,sans-serif">
                ราคา: {fmtUSD(hovered.value)}
              </text>
              {hovered.cost != null && (
                <text x={tipX + tipW / 2} y={tipY + 51} textAnchor="middle"
                  fontSize="11" fill={diff >= 0 ? "#00B98A" : "#FF4B55"} fontWeight="800" fontFamily="Outfit,sans-serif">
                  ทุนเฉลี่ย: {fmtUSD(hovered.cost)} ({fmtPct(diffPct)})
                </text>
              )}
            </g>
          );
        })()}
      </svg>

      {/* Floating Diff / Comparison Overlay Box */}
      {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && diffStartIdx !== diffEndIdx && (() => {
        const currentStart = zoomRange ? zoomRange.start : 0;
        const dispStartIdx = diffStartIdx - currentStart;
        const dispEndIdx = diffEndIdx - currentStart;

        if (dispStartIdx >= 0 && dispStartIdx < displayedCandles.length &&
            dispEndIdx >= 0 && dispEndIdx < displayedCandles.length && pts[dispStartIdx] && pts[dispEndIdx]) {
          const pA = candles[diffStartIdx];
          const pB = candles[diffEndIdx];
          if (!pA || !pB) return null;

          const isThai = asset?.symbol?.endsWith(".BK");
          const valA = isThai ? pA.close / exchangeRate : pA.close;
          const valB = isThai ? pB.close / exchangeRate : pB.close;
          const diffVal = valB - valA;
          const diffPct = valA > 0 ? (diffVal / valA) * 100 : 0;

          const dateA = new Date(pA.date);
          const dateB = new Date(pB.date);
          const diffDays = Math.round(Math.abs(dateB - dateA) / (1000 * 60 * 60 * 24));
          let timeStr = `${diffDays} วัน`;
          if (diffDays >= 365) {
            timeStr = `${(diffDays / 365).toFixed(1)} ปี`;
          } else if (diffDays >= 30) {
            timeStr = `${(diffDays / 30.4).toFixed(1)} เดือน`;
          }

          const xA = pts[dispStartIdx].x;
          const xB = pts[dispEndIdx].x;
          const centerPct = ((xA + xB) / 2 / W) * 100;
          const yA = pts[dispStartIdx].y;
          const yB = pts[dispEndIdx].y;
          const topPos = Math.min(yA, yB) - 50;

          return (
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: centerPct >= 50 ? "52px" : "auto",
                right: centerPct < 50 ? "12px" : "auto",
                opacity: 1,
                transform: "none",
                zIndex: 101,
                pointerEvents: "none",
                width: "220px",
                padding: "10px 14px",
                background: "rgba(30, 41, 59, 0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                color: "white",
                fontFamily: "Outfit, sans-serif"
              }}
            >
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4, marginBottom: 2 }}>
                📊 เปรียบเทียบราคาหุ้น
              </div>
              <div style={{ fontSize: 10, color: "#CBD5E1" }}>
                {fmtDateShort(pA.date)} ➔ {fmtDateShort(pB.date)} ({timeStr})
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 2 }}>
                <span style={{ color: "#94A3B8" }}>เริ่ม:</span>
                <span style={{ color: "white", fontWeight: 700 }}>
                  {fmtUSD(valA)} {isThai && <span style={{ fontSize: 9, color: "#94A3B8" }}>(฿{(valA * exchangeRate).toFixed(2)})</span>}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#94A3B8" }}>สิ้นสุด:</span>
                <span style={{ color: "white", fontWeight: 700 }}>
                  {fmtUSD(valB)} {isThai && <span style={{ fontSize: 9, color: "#94A3B8" }}>(฿{(valB * exchangeRate).toFixed(2)})</span>}
                </span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                borderTop: "1px dashed rgba(255,255,255,0.15)",
                paddingTop: 4,
                marginTop: 2
              }}>
                <span style={{ color: "#94A3B8" }}>ส่วนต่าง:</span>
                <span style={{
                  fontWeight: 900,
                  color: diffVal >= 0 ? "#10B981" : "#EF4444"
                }}>
                  {diffVal >= 0 ? "+" : ""}{fmtUSD(diffVal)} ({diffVal >= 0 ? "+" : ""}{diffPct.toFixed(2)}%)
                </span>
              </div>
              {isThai && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span style={{ color: "#94A3B8" }}>ส่วนต่าง (บาท):</span>
                  <span style={{ fontWeight: 700, color: diffVal >= 0 ? "#10B981" : "#EF4444" }}>
                    ฿{diffVal * exchangeRate >= 0 ? "+" : ""}{(diffVal * exchangeRate).toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
                คลิก 1 ครั้งบนกราฟเพื่อล้างข้อมูลเปรียบเทียบ
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ASSET DETAIL PANEL
══════════════════════════════════════════════════════ */
const TF_OPTIONS = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ตั้งแต่ซื้อ"];

export default function AssetDetailPanel({ asset, price, exchangeRate, onClose }) {
  const [tf, setTf]         = useState("1M");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const isThai = asset?.symbol?.endsWith(".BK");
  const isCashAsset = asset?.type === "fiat" || asset?.category === "fiat";

  const getCurrencyPriceUSD = (symbol, priceVal, exchangeRate) => {
    if (symbol === "USD") return 1.0;
    if (priceVal != null && priceVal > 0) {
      if (["EUR", "GBP", "AUD", "NZD"].includes(symbol)) {
        return priceVal;
      }
      return 1.0 / priceVal;
    }
    if (symbol === "THB") return 1.0 / (exchangeRate || 35.0);
    return 1.0;
  };

  /* ── Fetch chart data ── */
  useEffect(() => {
    if (!asset?.symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setChartData(null);

    // Only USD uses completely flat mock data! Other currencies fetch actual rates.
    const isUSDOnly = asset.symbol === "USD";
    if (isUSDOnly) {
      const priceVal = 1.0;
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mockData = {
        symbol: asset.symbol,
        tf: tf,
        interval: "1d",
        currency: asset.symbol,
        regularMarketPrice: priceVal,
        candles: [
          {
            ts: Math.floor(thirtyDaysAgo.getTime() / 1000),
            date: thirtyDaysAgo.toISOString(),
            open: priceVal,
            high: priceVal,
            low: priceVal,
            close: priceVal,
            volume: 0
          },
          {
            ts: Math.floor(now.getTime() / 1000),
            date: now.toISOString(),
            open: priceVal,
            high: priceVal,
            low: priceVal,
            close: priceVal,
            volume: 0
          }
        ]
      };
      setChartData(mockData);
      setLoading(false);
      return;
    }

    const targetSymbol = isCashAsset ? getCurrencyTicker(asset.symbol) : asset.symbol;
    const fetchTf = tf === "ตั้งแต่ซื้อ" ? "MAX" : tf;
    fetch(`/api/prices?history=${encodeURIComponent(targetSymbol)}&tf=${fetchTf}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) { setError(data.error); setLoading(false); return; }
        setChartData(data);
        setLoading(false);
      })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [asset?.symbol, tf, isCashAsset]);

  if (!asset) return null;

  const pData = price || {};

  let priceUSD = isThai ? (pData.price || 0) / exchangeRate : (pData.price || 0);
  if (isCashAsset) {
    priceUSD = getCurrencyPriceUSD(asset.symbol, pData.price, exchangeRate);
  }

  // Calculate day change for cash
  let changeUSD = 0;
  let changePct = 0;
  if (isCashAsset) {
    if (asset.symbol !== "USD" && pData.price > 0 && pData.previousClose > 0) {
      let prevPriceUSD = 0;
      if (["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol)) {
        prevPriceUSD = pData.previousClose;
      } else {
        prevPriceUSD = 1.0 / pData.previousClose;
      }
      changeUSD = (priceUSD - prevPriceUSD) * asset.qty;
      changePct = prevPriceUSD > 0 ? ((priceUSD - prevPriceUSD) / prevPriceUSD) * 100 : 0;
    }
  } else {
    changeUSD = isThai ? (pData.change || 0) / exchangeRate : (pData.change || 0);
    changePct = pData.changePercent || 0;
  }

  const valueUSD = priceUSD * asset.qty;

  // Robustly handle avgCost vs avgPrice for backward compatibility
  const avgCost = asset.avgCost ?? asset.avgPrice ?? 0;

  const costUSD = isCashAsset ? avgCost * asset.qty : (avgCost * asset.qty / (isThai ? exchangeRate : 1));

  const gainUSD     = valueUSD - costUSD;
  const gainPct     = costUSD > 0 ? ((valueUSD - costUSD) / costUSD) * 100 : 0;
  const lots        = asset.lots || [];

  // Running average cost & P&L calculation chronologically
  const processedLots = useMemo(() => {
    if (!lots || !lots.length) return [];
    const sorted = [...lots].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningQty = 0;
    let runningAvgCost = 0;

    return sorted.map((lot, idx) => {
      const lotQty = lot.qty;
      const isThai = asset?.symbol?.toUpperCase().endsWith(".BK");
      const lotPriceUSD = isThai ? (lot.price || 0) / exchangeRate : (lot.price || 0);

      let type = "BUY";
      let transactionValueUSD = lotQty * lotPriceUSD;
      let pnl = 0;
      let pnlPct = 0;

      if (lotQty > 0) {
        type = "BUY";
        const oldCost = runningQty * runningAvgCost;
        const newCost = oldCost + (lotQty * lotPriceUSD);
        runningQty += lotQty;
        runningAvgCost = runningQty > 0 ? newCost / runningQty : 0;
        pnl = (priceUSD - lotPriceUSD) * lotQty;
        pnlPct = lotPriceUSD > 0 ? (pnl / (lotQty * lotPriceUSD)) * 100 : 0;
      } else if (lotQty < 0) {
        type = "SELL";
        const sellQty = Math.abs(lotQty);
        pnl = (lotPriceUSD - runningAvgCost) * sellQty;
        pnlPct = runningAvgCost > 0 ? (pnl / (sellQty * runningAvgCost)) * 100 : 0;
        runningQty = Math.max(0, runningQty - sellQty);
      }

      return {
        ...lot,
        type,
        lotQty,
        lotPriceUSD,
        transactionValueUSD,
        pnl,
        pnlPct,
        runningQty,
        runningAvgCost
      };
    });
  }, [lots, priceUSD, exchangeRate, asset?.symbol]);

  // Recompute properly
  const avgCostUSD = isCashAsset ? avgCost : (isThai ? avgCost / exchangeRate : avgCost);
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
            <AssetLogo symbol={asset.symbol} category={asset.category} style={{ width: 48, height: 48, borderRadius: 16, fontSize: 16 }} />
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
          {isCashAsset ? (
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)", lineHeight: 1 }}>
                {fmtQty(asset.qty)} {asset.symbol}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>
                ≈ {fmtUSD(valueUSD)}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* ── KPI Mini Grid ── */}
        <div className="asset-detail-kpi-grid" style={{ gridTemplateColumns: isCashAsset ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}>
          <div className="asset-detail-kpi">
            <div className="asset-detail-kpi-label">จำนวนถือ</div>
            <div className="asset-detail-kpi-val">{fmtQty(asset.qty)} {asset.symbol}</div>
          </div>
          {!isCashAsset && (
            <div className="asset-detail-kpi">
              <div className="asset-detail-kpi-label">ราคาทุนเฉลี่ย</div>
              <div className="asset-detail-kpi-val">{fmtUSD(avgCostUSD)}</div>
            </div>
          )}
          <div className="asset-detail-kpi">
            <div className="asset-detail-kpi-label">มูลค่าปัจจุบัน</div>
            <div className="asset-detail-kpi-val">{fmtUSD(valueUSD)}</div>
          </div>
          {!isCashAsset && (
            <div className={`asset-detail-kpi ${gainUp ? "gain-kpi" : "loss-kpi"}`}>
              <div className="asset-detail-kpi-label">กำไร/ขาดทุนรวม</div>
              <div className="asset-detail-kpi-val" style={{ color: gainUp ? "var(--gain)" : "var(--loss)", fontWeight: 900 }}>
                {gainUp ? "+" : ""}{fmtUSD(totalGainUSD)}
                <span style={{ fontSize: 11, marginLeft: 4 }}>({fmtPct(totalGainPct)})</span>
              </div>
            </div>
          )}
        </div>

        {/* ── TF Selector ── */}
        {!isCashAsset && (
          <div className="asset-detail-tf-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                {tf === "1D" ? "รายนาที (5m)" : tf === "5D" ? "รายชั่วโมง" : tf === "1W" ? "ราย 30 นาที" : tf === "5Y" ? "รายสัปดาห์" : tf === "ตั้งแต่ซื้อ" ? "ตั้งแต่เริ่มลงทุน" : "รายวัน"}
              </div>
            </div>
            {lots.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EEECFF", border: "1px solid #C3C7FA", borderRadius: 8, padding: "3px 8px", fontSize: 11 }}>
                <div style={{ width: 14, height: 2, background: "#5236FF", borderTop: "2px dashed #5236FF" }} />
                <span style={{ fontWeight: 700, color: "#5236FF" }}>ราคาทุนเฉลี่ย {fmtUSD(avgCostUSD)}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Chart ── */}
        {!isCashAsset && (
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
                candles={(() => {
                  if (tf === "ตั้งแต่ซื้อ") {
                    const sortedLots = lots && lots.length > 0
                      ? [...lots].sort((a,b) => new Date(a.date) - new Date(b.date))
                      : [];
                    if (sortedLots.length > 0) {
                      const firstDate = sortedLots[0].date;
                      const filtered = chartData.candles.filter(c => c.date.split("T")[0] >= firstDate);
                      if (filtered.length >= 2) {
                        return filtered;
                      } else if (filtered.length === 1) {
                        const single = filtered[0];
                        const prevDate = new Date(new Date(single.date) - 86400000).toISOString();
                        return [
                          { ...single, date: prevDate },
                          single
                        ];
                      } else {
                        // If no candles are >= firstDate (e.g. firstDate is today/in future)
                        // Take the last candle in chartData.candles and pad it
                        if (chartData.candles.length > 0) {
                          const lastCandle = chartData.candles[chartData.candles.length - 1];
                          const prevDate = new Date(new Date(lastCandle.date) - 86400000).toISOString();
                          return [
                            { ...lastCandle, date: prevDate },
                            lastCandle
                          ];
                        }
                      }
                    }
                  }
                  return chartData.candles;
                })()}
                avgCost={avgCost}
                lots={lots}
                tf={tf}
                isThai={isThai}
                exchangeRate={exchangeRate}
                asset={asset}
              />
            ) : null}
          </div>
        )}

        {/* ── Purchase History Table ── */}
        {lots.length > 0 && (
          <div className="asset-detail-lots" style={{ paddingBottom: 24 }}>
            <div
              onClick={() => setHistoryExpanded(!historyExpanded)}
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "var(--text-main)",
                marginBottom: historyExpanded ? 12 : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                padding: "10px 14px",
                background: "#F8FAFC",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                userSelect: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isCashAsset ? <History size={14} /> : <ShoppingCart size={14} />}
                {isCashAsset ? "ประวัติการฝาก/ถอนเงินสด" : "ประวัติธุรกรรมซื้อ/ขาย"} ({lots.length} รายการ)
              </div>
              {historyExpanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
            </div>

            {historyExpanded && (
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflowY: "auto",
                maxHeight: "220px"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", position: "sticky", top: 0, zIndex: 1, boxShadow: "0 1px 0 var(--border)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>ครั้ง</th>
                      {!isCashAsset && <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>ประเภท</th>}
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>วันที่ทำรายการ</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>{isCashAsset ? "จำนวนเงิน" : "จำนวน"}</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>{isCashAsset ? "อัตราแลกเปลี่ยน" : "ราคาทำรายการ"}</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>{isCashAsset ? "มูลค่ารวม (USD)" : "มูลค่าธุรกรรม (USD)"}</th>
                      {!isCashAsset && <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>P&L (USD)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {[...processedLots].reverse().map((lot, i) => {
                      const isBuy = lot.type === "BUY";
                      return (
                        <tr key={lot.id || i} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={{ padding: "9px 12px" }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: "50%", background: "#F59E0B",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              color: "white", fontWeight: 900, fontSize: 10
                            }}>{processedLots.length - i}</div>
                          </td>
                          {!isCashAsset && (
                            <td style={{ padding: "9px 12px" }}>
                              {isBuy ? (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4 }}>ซื้อ (BUY)</span>
                              ) : (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 6px", borderRadius: 4 }}>ขาย (SELL)</span>
                              )}
                            </td>
                          )}
                          <td style={{ padding: "9px 12px", color: "var(--text-muted)" }}>
                            {fmtDateShort(lot.date)} {lot.time ? `· ${lot.time} น.` : ""}
                          </td>
                          <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>
                            {isBuy ? "+" : "-"}{fmtQty(Math.abs(lot.lotQty))} {isCashAsset ? asset.symbol : ""}
                          </td>
                          <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>
                            {fmtUSD(lot.lotPriceUSD)}
                          </td>
                          <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700 }}>
                            {fmtUSD(Math.abs(lot.transactionValueUSD))}
                          </td>
                          {!isCashAsset && (
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 800, color: lot.pnl >= 0 ? "var(--gain)" : "var(--loss)" }}>
                              <div>
                                {lot.pnl >= 0 ? "+" : ""}{fmtUSD(lot.pnl)}
                              </div>
                              <div style={{ fontSize: 10, opacity: 0.85 }}>
                                ({lot.pnl >= 0 ? "▲" : "▼"}{fmtPct(lot.pnlPct)})
                                <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4, fontWeight: "normal" }}>
                                  {isBuy ? "ยังไม่รับรู้" : "รับรู้แล้ว"}
                                </span>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid var(--border)", background: "var(--primary-light)", position: "sticky", bottom: 0, zIndex: 1, boxShadow: "0 -2px 0 var(--border)" }}>
                      <td colSpan={isCashAsset ? 2 : 3} style={{ padding: "9px 12px", fontWeight: 800, color: "var(--primary)" }}>ถือครองปัจจุบัน</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>{fmtQty(asset.qty)} {isCashAsset ? asset.symbol : ""}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 11, color: "var(--text-muted)" }}>
                        {isCashAsset ? "—" : `avg ${fmtUSD(avgCostUSD)}`}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>{fmtUSD(totalCostUSD)}</td>
                      {!isCashAsset && (
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 900, color: gainUp ? "var(--gain)" : "var(--loss)" }}>
                          {gainUp ? "+" : ""}{fmtUSD(totalGainUSD)}
                          <div style={{ fontSize: 10 }}>{fmtPct(totalGainPct)}</div>
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
