import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, RefreshCw, LogOut, TrendingUp, TrendingDown,
  Trash2, Download, Upload, PieChart, Star, BarChart2, Pencil, X, Settings
} from "lucide-react";
import AssetModal from "./AssetModal";
import AssetDetailPanel from "./AssetDetailPanel";

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════ */
const fmt = {
  usd:  (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 }).format(n),
  thb:  (n) => n == null ? "—" : "฿" + new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n),
  pct:  (n) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%",
  qty:  (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(n),
  date: (s) => s ? new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—",
};

/* Smooth Bezier Curve Path for SVG */
function smoothPath(pts) {
  if (!pts || pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) * 0.15;
    const cp1y = p1.y + (p2.y - p0.y) * 0.15;
    const cp2x = p2.x - (p3.x - p1.x) * 0.15;
    const cp2y = p2.y - (p3.y - p1.y) * 0.15;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x},${p2.y}`;
  }
  return d;
}

/* Step-like historical Cost line (Dashed) */
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


/* ═══════════════════════════════════════════════════════════════
   ASSET LOGO with multi-source fallback
═══════════════════════════════════════════════════════════════ */
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

const getCurrencyPriceUSD = (symbol, prices, exchangeRate) => {
  if (symbol === "USD") return 1.0;
  const ticker = getCurrencyTicker(symbol);
  const pData = prices[ticker];
  const priceVal = pData?.price;
  if (priceVal != null && priceVal > 0) {
    if (["EUR", "GBP", "AUD", "NZD"].includes(symbol)) {
      return priceVal;
    }
    return 1.0 / priceVal;
  }
  if (symbol === "THB") return 1.0 / (exchangeRate || 35.0);
  return 1.0;
};

function getPoints(values, W, H, padX = 0, padY = 10) {
  if (!values || values.length < 2) return [];
  const clean = values.filter(v => v != null && isFinite(v));
  if (clean.length < 2) return [];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const iW = W - padX * 2;
  const iH = H - padY * 2;
  return values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * iW,
    y: padY + ((max - (v ?? min)) / range) * iH,
  }));
}

/* ═══════════════════════════════════════════════════════════════
   SPARKLINE MINI CHART
═══════════════════════════════════════════════════════════════ */
const SparklineChart = React.memo(function SparklineChart({ closes }) {
  const W = 70, H = 32;
  if (!closes || closes.length < 3) {
    return (
      <div className="sparkline-cell skeleton" style={{ borderRadius: 6 }} />
    );
  }
  const pts = getPoints(closes, W, H, 2, 4);
  const isUp = closes[closes.length - 1] >= closes[0];
  const color = isUp ? "var(--gain)" : "var(--loss)";
  const fill = isUp ? "rgba(0,185,138,0.12)" : "rgba(255,75,85,0.12)";
  const linePath = smoothPath(pts);
  const first = pts[0], last = pts[pts.length - 1];
  const fillPath = linePath + ` L ${last.x},${H} L ${first.x},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="sparkline-svg">
      <path d={fillPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
});

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO LINE CHART (with hover tooltip)
═══════════════════════════════════════════════════════════════ */
function PortfolioChart({ history, range, onRangeChange, assets, exchangeRate }) {
  const svgRef = useRef(null);
  const [hovered, setHovered] = useState(null); // { idx, originalIdx, x, y, value, date }
  const [dims, setDims] = useState({ w: 800, h: 350 });
  const [zoomRange, setZoomRange] = useState(null); // { start: number, end: number }
  const [dragStart, setDragStart] = useState(null); // { x, type: "zoom" | "pan" | "diff", startZoom }
  const [dragEnd, setDragEnd] = useState(null); // { x }
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
  }, [history, range]);

  // Responsive resizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) {
        const isMobile = e.contentRect.width < 500;
        setDims({
          w: e.contentRect.width,
          h: isMobile
            ? Math.min(500, Math.max(320, e.contentRect.width * 0.88))
            : Math.min(550, Math.max(420, e.contentRect.width * 0.70))
        });
      }
    });
    if (svgRef.current) obs.observe(svgRef.current);
    return () => obs.disconnect();
  }, [history]);

  const W = dims.w;
  const H = dims.h;

  const isMobile = W < 500;
  const PAD_L = isMobile ? 30 : 42;
  const PAD_R = isMobile ? 12 : 24;
  const PAD_T = isMobile ? 4 : 6;
  const PAD_B = isMobile ? 18 : 24;

  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;

  const RANGES = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

  const displayedData = useMemo(() => {
    if (!history) return [];
    if (!zoomRange) return history;
    return history.slice(zoomRange.start, zoomRange.end + 1);
  }, [history, zoomRange]);

  const hasMultipleYears = useMemo(() => {
    if (!displayedData || displayedData.length < 2) return false;
    const firstYear = new Date(displayedData[0].date).getFullYear();
    const lastYear = new Date(displayedData[displayedData.length - 1].date).getFullYear();
    return firstYear !== lastYear;
  }, [displayedData]);

  // Group transaction lots by history index
  const transactionsByIdx = useMemo(() => {
    if (!assets || !history || history.length < 2) return {};
    const map = {};
    const startStr = history[0].date.split("T")[0];
    const endStr = history[history.length - 1].date.split("T")[0];

    assets.forEach(asset => {
      (asset.lots || []).forEach(lot => {
        if (!lot || !lot.date) return;
        const lotDateStr = lot.date;

        // Strict boundary check: transaction must be within history bounds
        if (lotDateStr < startStr || lotDateStr > endStr) return;

        // Find closest date in history
        let bestIdx = -1, bestDiff = Infinity;

        // Exact string match on date first
        bestIdx = history.findIndex(h => h.date.split("T")[0] === lotDateStr);

        if (bestIdx === -1) {
          const targetTime = new Date(lotDateStr + "T00:00:00.000Z").getTime();
          history.forEach((h, i) => {
            const hTime = new Date(h.date).getTime();
            const diff = Math.abs(hTime - targetTime);
            if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
          });
        } else {
          bestDiff = 0;
        }

        if (bestIdx >= 0) {
          if (!map[bestIdx]) map[bestIdx] = [];
          map[bestIdx].push({
            symbol: asset.symbol,
            type: lot.type || "BUY",
            qty: lot.qty,
            price: lot.price,
            date: lot.date
          });
        }
      });
    });
    return map;
  }, [assets, history]);

  // Unique lot purchase dates for markers
  const lotMarkers = useMemo(() => {
    if (!displayedData || displayedData.length < 2) return [];
    const startIdx = zoomRange ? zoomRange.start : 0;
    const endIdx = zoomRange ? zoomRange.end : history.length - 1;

    return Object.keys(transactionsByIdx)
      .map(idxStr => {
        const idx = parseInt(idxStr, 10);
        if (idx < startIdx || idx > endIdx) return null;

        const displayIdx = idx - startIdx;
        const txs = transactionsByIdx[idx];
        const primarySymbol = txs[0]?.symbol || "";
        const x = PAD_L + (displayIdx / (displayedData.length - 1)) * iW;
        return { idx, x, symbol: primarySymbol, txs };
      })
      .filter(Boolean);
  }, [transactionsByIdx, history, displayedData, zoomRange, iW, PAD_L]);

  const { pts, costPts, yMin, yMax, isUp, color } = useMemo(() => {
    if (!displayedData || displayedData.length < 2) return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true, color: "var(--gain)" };

    const vals = displayedData.map(h => h.value);
    const costs = displayedData.map(h => h.cost || 0);

    const isShortTF = range === "1D" || range === "5D" || range === "1W";
    const dataMin = isShortTF ? Math.min(...vals) : Math.min(...vals, ...costs.filter(c => c > 0));
    const dataMax = isShortTF ? Math.max(...vals) : Math.max(...vals, ...costs);
    const rangeVal = dataMax - dataMin || dataMin * 0.02 || 1;

    // Adaptive padding (shows movement clearly)
    const pad = rangeVal * 0.05;
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;
    const yRange = yMax - yMin;

    const toY = (v) => PAD_T + ((yMax - v) / yRange) * iH;
    const toX = (i) => PAD_L + (i / (displayedData.length - 1)) * iW;

    const pts = displayedData.map((h, i) => ({ x: toX(i), y: toY(h.value), value: h.value, date: h.date }));
    const costPts = displayedData.map((h, i) => ({ x: toX(i), y: toY(h.cost || 0), cost: h.cost || 0, date: h.date }));

    const isUp = vals[vals.length - 1] >= vals[0];
    const color = isUp ? "var(--gain)" : "var(--loss)";

    return { pts, costPts, yMin, yMax, isUp, color, toY };
  }, [displayedData, iH, iW, range]);

  const linePath = useMemo(() => smoothPath(pts), [pts]);
  const costLinePath = useMemo(() => stepPath(costPts), [costPts]);

  // Gain & Loss fill paths
  const fillValueArea = useMemo(() => {
    if (!linePath || pts.length < 2) return "";
    const first = pts[0], last = pts[pts.length - 1];
    const bottomY = H - PAD_B;
    return linePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [linePath, pts, H, PAD_B]);

  const fillCostArea = useMemo(() => {
    if (!costLinePath || costPts.length < 2) return "";
    const first = costPts[0], last = costPts[costPts.length - 1];
    const bottomY = H - PAD_B;
    return costLinePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [costLinePath, costPts, H, PAD_B]);

  // Clip path definitions using SVG path data
  const clipAboveCostPath = useMemo(() => {
    if (!costLinePath || costPts.length < 2) return "";
    const first = costPts[0], last = costPts[costPts.length - 1];
    return costLinePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [costLinePath, costPts]);

  const clipBelowCostPath = useMemo(() => {
    if (!costLinePath || costPts.length < 2) return "";
    const first = costPts[0], last = costPts[costPts.length - 1];
    const bottomY = H - PAD_B;
    return costLinePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [costLinePath, costPts, H, PAD_B]);

  const clipAboveValuePath = useMemo(() => {
    if (!linePath || pts.length < 2) return "";
    const first = pts[0], last = pts[pts.length - 1];
    return linePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [linePath, pts]);

  const stateRef = useRef();
  stateRef.current = {
    history,
    zoomRange,
    displayedData,
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
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseX >= PAD_L && mouseX <= W - PAD_R) {
      if (e.shiftKey && zoomRange) {
        setDragStart({ x: mouseX, type: "pan", startZoom: { ...zoomRange } });
      } else {
        const relX = (mouseX - PAD_L) / iW;
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
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
    if (!svgRef.current || pts.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseXInSvg = ((e.clientX - rect.left) / rect.width) * W;

    if (dragStart) {
      if (dragStart.type === "diff") {
        const boundedX = Math.max(PAD_L, Math.min(W - PAD_R, mouseXInSvg));
        const relX = (boundedX - PAD_L) / iW;
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
        const originalIdx = (zoomRange ? zoomRange.start : 0) + idx;
        updateDiffEndIdx(originalIdx);
        setHovered(null);
      } else if (dragStart.type === "pan") {
        const deltaX = mouseXInSvg - dragStart.x;
        const len = history.length;
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
    const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
    if (displayedData[idx]) {
      setHovered({
        idx,
        originalIdx: (zoomRange ? zoomRange.start : 0) + idx,
        x: pts[idx].x,
        y: pts[idx].y,
        costY: costPts[idx]?.y,
        value: displayedData[idx].value,
        cost: displayedData[idx].cost || 0,
        date: displayedData[idx].date
      });
    }
  }, [pts, costPts, displayedData, iW, W, dragStart, zoomRange, history, isDiffActive]);

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
    const el = svgRef.current;
    if (!el) return;

    const getLatest = () => stateRef.current;

    const handleWheel = (e) => {
      const { history, zoomRange, displayedData, W, iW, PAD_L } = getLatest();
      if (!history || history.length < 2) return;
      e.preventDefault();

      const isZoomIn = e.deltaY < 0;
      const len = history.length;
      const currentStart = zoomRange ? zoomRange.start : 0;
      const currentEnd = zoomRange ? zoomRange.end : len - 1;
      const rangeSize = currentEnd - currentStart;

      const rect = el.getBoundingClientRect();
      const mouseXInSvg = ((e.clientX - rect.left) / rect.width) * W;
      const relX = (mouseXInSvg - PAD_L) / iW;
      const hoveredIdx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
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
      const { history, zoomRange, displayedData, W, iW, PAD_L, PAD_R } = getLatest();
      if (!history || history.length < 2) return;

      if (e.touches.length === 1) {
        const rect = el.getBoundingClientRect();
        const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
        if (touchX >= PAD_L && touchX <= W - PAD_R) {
          const relX = (touchX - PAD_L) / iW;
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
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
        const initialZoom = zoomRange || { start: 0, end: history.length - 1 };
        touchRef.current = {
          startDist: dist,
          startZoom: { ...initialZoom },
          isPinching: true,
          centerX: (t1.clientX + t2.clientX) / 2
        };
      }
    };

    const handleTouchMove = (e) => {
      const { history, zoomRange, displayedData, W, iW, PAD_L, PAD_R } = getLatest();
      if (!history || history.length < 2) return;
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
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
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
        const len = history.length;
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
  }, [history]);


  if (!history || history.length < 2) {
    return (
      <div ref={svgRef}>
        <div className="chart-card-header">
          <span className="card-section-title" style={{ marginBottom: 0 }}>📈 มูลค่าพอร์ต</span>
          <div className="chart-range-tabs">
            {RANGES.map(r => (
              <button key={r} className={`chart-range-tab${range === r ? " active" : ""}`} onClick={() => onRangeChange(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="chart-empty">
          <BarChart2 size={36} strokeWidth={1.5} />
          <p style={{ fontSize: 13, textAlign: "center" }}>เพิ่มสินทรัพย์และรอดึงข้อมูลประวัติราคา<br/>กราฟจะแสดงมูลค่าพอร์ตย้อนหลัง</p>
        </div>
      </div>
    );
  }

  const startVal = displayedData[0]?.value || 0;
  const endVal = displayedData[displayedData.length - 1]?.value || 0;
  const totalChange = endVal - startVal;
  const totalChangePct = startVal > 0 ? (totalChange / startVal) * 100 : 0;

  // Axis labels — fewer ticks on mobile to avoid overflow
  const dateLabels = (() => {
    if (displayedData.length <= 1) return [];
    const count = Math.min(isMobile ? 3 : 5, displayedData.length);
    const step = Math.floor((displayedData.length - 1) / Math.max(count - 1, 1));
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i === count - 1 ? displayedData.length - 1 : i * step, displayedData.length - 1);
      return { idx, x: PAD_L + (idx / (displayedData.length - 1)) * iW, date: displayedData[idx].date };
    });
  })();

  const yTicks = (() => {
    if (yMax === yMin) return [];
    const rangeVal = yMax - yMin;
    const rawStep = rangeVal / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude || 10;
    const ticks = [];
    const start = Math.ceil(yMin / step) * step;
    for (let v = start; v <= yMax + step * 0.01; v += step) {
      const y = PAD_T + ((yMax - v) / (yMax - yMin)) * iH;
      if (y >= PAD_T - 4 && y <= H - PAD_B + 4) {
        ticks.push({ v, y });
      }
    }
    return ticks;
  })();

  const latestCost = displayedData[displayedData.length - 1]?.cost || 0;
  const latestVal = displayedData[displayedData.length - 1]?.value || 0;
  const pnlPercent = latestCost > 0 ? ((latestVal - latestCost) / latestCost) * 100 : 0;

  return (
    <div>
      <div className="chart-card-header">
        <div>
          <span className="card-section-title" style={{ marginBottom: 0 }}>📈 มูลค่าพอร์ต & ต้นทุนรวม</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
              {range} ประสิทธิภาพ:
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: totalChange >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {totalChange >= 0 ? "▲" : "▼"} {fmt.usd(Math.abs(totalChange))} ({fmt.pct(totalChangePct)})
            </span>
            {latestCost > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, background: pnlPercent >= 0 ? "var(--gain-light)" : "var(--loss-light)", color: pnlPercent >= 0 ? "var(--gain)" : "var(--loss)", padding: "1px 6px", borderRadius: 6 }}>
                กำไรสะสม: {fmt.pct(pnlPercent)}
              </span>
            )}
          </div>
        </div>
        <div className="chart-range-tabs">
          {RANGES.map(r => (
            <button key={r} className={`chart-range-tab${range === r ? " active" : ""}`} onClick={() => onRangeChange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="chart-area-wrapper" ref={svgRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: zoomRange ? (dragStart && dragStart.type === "pan" ? "grabbing" : "grab") : "crosshair",
          position: "relative",
          width: "100%",
          touchAction: "pan-y"
        }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="chart-svg"
          style={{ height: H, display: "block" }}
        >
          <defs>
            {/* Gradient for gain area (above cost) */}
            <linearGradient id="portGainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00B98A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00B98A" stopOpacity="0.02" />
            </linearGradient>
            {/* Gradient for loss area (below cost) */}
            <linearGradient id="portLossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4B55" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#FF4B55" stopOpacity="0.20" />
            </linearGradient>

            {/* Clipping path for Above Cost (Gain Zone) */}
            {clipAboveCostPath && (
              <clipPath id="portClipAboveCost">
                <path d={clipAboveCostPath} />
              </clipPath>
            )}
            {/* Clipping path for Below Cost (Loss Zone) */}
            {clipBelowCostPath && (
              <clipPath id="portClipBelowCost">
                <path d={clipBelowCostPath} />
              </clipPath>
            )}
            {/* Clipping path for Above Value */}
            {clipAboveValuePath && (
              <clipPath id="portClipAboveValue">
                <path d={clipAboveValuePath} />
              </clipPath>
            )}
            {/* Full Clip */}
            <clipPath id="portClipFull">
              <rect x={PAD_L} y={PAD_T} width={iW} height={iH} />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {yTicks.map(({ v, y }, i) => (
            <line key={i}
              x1={PAD_L} y1={y}
              x2={W - PAD_R} y2={y}
              stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          {dateLabels.map(({ x }, i) => (
            <line key={i} x1={x} y1={PAD_T} x2={x} y2={H - PAD_B}
              stroke="#F8FAFC" strokeWidth="1" />
          ))}

          {/* Range selection diff highlight */}
          {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && diffStartIdx !== diffEndIdx && (() => {
            const currentStart = zoomRange ? zoomRange.start : 0;
            const dispStartIdx = diffStartIdx - currentStart;
            const dispEndIdx = diffEndIdx - currentStart;

            if (dispStartIdx >= 0 && dispStartIdx < displayedData.length &&
                dispEndIdx >= 0 && dispEndIdx < displayedData.length && pts[dispStartIdx] && pts[dispEndIdx]) {
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

          {/* Fill Areas with Clipping */}
          {costLinePath && fillValueArea && fillCostArea ? (
            <>
              {/* Gain Zone (Value > Cost): Green Fill */}
              <path d={fillValueArea} fill="url(#portGainGrad)" clipPath="url(#portClipAboveCost)" />
              {/* Loss Zone (Value < Cost): Red Fill */}
              <path d={fillCostArea} fill="url(#portLossGrad)" clipPath="url(#portClipAboveValue)" />
            </>
          ) : (
            fillValueArea && <path d={fillValueArea} fill={isUp ? "url(#portGainGrad)" : "url(#portLossGrad)"} clipPath="url(#portClipFull)" />
          )}

          {/* Step-like historical Cost line (Dashed) */}
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

          {/* Dual-color Price Value Line */}
          {linePath && costLinePath ? (
            <>
              {/* Green Price Line when above Cost */}
              <path
                d={linePath}
                fill="none"
                stroke="#00B98A"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath="url(#portClipAboveCost)"
              />
              {/* Red Price Line when below Cost */}
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

          {/* Start dot */}
          {pts.length > 0 && (
            <circle cx={pts[0].x} cy={pts[0].y} r="4" fill={color} opacity="0.6" />
          )}

          {/* End dot */}
          {pts.length > 1 && (
            <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={color}>
              <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Lot Purchase markers on timeline */}
          {lotMarkers.map((m, i) => (
            <g key={i}>
              <line x1={m.x} y1={PAD_T} x2={m.x} y2={H - PAD_B}
                stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />
              <circle cx={m.x} cy={PAD_T + 10} r="7" fill="#F59E0B" style={{ cursor: "pointer" }} />
              <text x={m.x} y={PAD_T + 13} textAnchor="middle" fontSize="8" fill="white" fontWeight="800" fontFamily="Outfit,sans-serif" style={{ cursor: "pointer", pointerEvents: "none" }}>
                {m.symbol.slice(0, 1)}
              </text>
              <title>
                {m.txs.map(t => `${t.type === "BUY" ? "ซื้อ" : "ขาย"} ${t.symbol} ${t.qty.toLocaleString()} หุ้น @ ${fmt.usd(t.price)}`).join("\n")}
              </title>
            </g>
          ))}

          {/* Hover vertical crosshair */}
          {hovered && (
            <line
              x1={hovered.x} y1={PAD_T}
              x2={hovered.x} y2={H - PAD_B}
              stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4"
            />
          )}

          {/* Hover dots */}
          {hovered && (
            <>
              <circle cx={hovered.x} cy={hovered.y} r="5"
                fill="#FFFFFF" stroke={hovered.value >= hovered.cost ? "#00B98A" : "#FF4B55"} strokeWidth="2.5" />
              {hovered.cost > 0 && (
                <circle cx={hovered.x} cy={hovered.costY} r="4.5"
                  fill="#FFFFFF" stroke="#5236FF" strokeWidth="2" />
              )}
            </>
          )}

          {/* Y-axis Labels */}
          {yTicks.map(({ v, y }, i) => (
            <text key={i} x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="12"
              fill="var(--text-muted)" fontFamily="var(--font-family)" fontWeight="700">
              {v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(v >= 100 ? 0 : 2)}
            </text>
          ))}

          {dateLabels.map(({ x, date }, i) => (
            <text key={i} x={x} y={H - PAD_B + 18} textAnchor="middle" fontSize="11"
              fill="var(--text-muted)" fontFamily="var(--font-family)" fontWeight="700">
              {(() => {
                const d = new Date(date);
                if (range === "1D") return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                if (range === "5D" || range === "1W") return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: hasMultipleYears ? "2-digit" : undefined });
              })()}
            </text>
          ))}

          {/* Latest cost badge on the right end of the cost line */}
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
        </svg>

        {/* Hover Tooltip Box */}
        {hovered && (() => {
          const diff = hovered.value - hovered.cost;
          const diffPct = hovered.cost > 0 ? (diff / hovered.cost) * 100 : 0;
          const txs = transactionsByIdx[hovered.originalIdx];
          return (
            <div className="chart-tooltip-box" style={{
              top: Math.max(10, Math.min(H - 180, hovered.y - 45)) + "px",
              left: (hovered.x / W) * 100 + "%",
              opacity: 1,
              transform: hovered.x < W / 2 ? "translateX(15px)" : "translateX(calc(-100% - 15px))",
              zIndex: 100,
              pointerEvents: "none"
            }}>
              <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 2 }}>
                {(() => {
                  const d = new Date(hovered.date);
                  if (range === "1D") return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                  if (range === "5D" || range === "1W") return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
                })()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>มูลค่า:</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{fmt.usd(hovered.value)}</span>
                </div>
                {hovered.cost > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 10, color: "var(--text-faint)" }}>ต้นทุน:</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#A5B4FC" }}>{fmt.usd(hovered.cost)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 2, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "var(--text-faint)" }}>P&L:</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: diff >= 0 ? "#6EE7B7" : "#FCA5A5" }}>
                        {diff >= 0 ? "+" : ""}{fmt.usd(diff)} ({fmt.pct(diffPct)})
                      </span>
                    </div>
                  </>
                )}
                {txs && txs.length > 0 && (
                  <div style={{
                    marginTop: 6,
                    borderTop: "1px dashed rgba(255,255,255,0.2)",
                    paddingTop: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3
                  }}>
                    <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>🛒 ธุรกรรมในวันนี้:</span>
                    {txs.map((tx, idx) => (
                      <span key={idx} style={{ fontSize: 10, color: "#FFF", opacity: 0.9 }}>
                        • {tx.type === "BUY" ? "ซื้อ" : "ขาย"} {tx.symbol} {tx.qty.toLocaleString()} หุ้น @ {fmt.usd(tx.price)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {/* Floating Diff / Comparison Overlay Box */}
        {isDiffActive && diffStartIdx !== null && diffEndIdx !== null && diffStartIdx !== diffEndIdx && (() => {
          const currentStart = zoomRange ? zoomRange.start : 0;
          const dispStartIdx = diffStartIdx - currentStart;
          const dispEndIdx = diffEndIdx - currentStart;

          if (dispStartIdx >= 0 && dispStartIdx < displayedData.length &&
              dispEndIdx >= 0 && dispEndIdx < displayedData.length && pts[dispStartIdx] && pts[dispEndIdx]) {
            const pA = history[diffStartIdx];
            const pB = history[diffEndIdx];
            if (!pA || !pB) return null;

            const valA = pA.value;
            const valB = pB.value;
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

            const localFmtDate = (dateStr) => {
              const d = new Date(dateStr);
              return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
            };

            return (
              <div
                className="chart-tooltip-box"
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
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4, marginBottom: 2 }}>
                  📊 เปรียบเทียบค่าส่วนต่าง
                </div>
                <div style={{ fontSize: 10, color: "#CBD5E1" }}>
                  {localFmtDate(pA.date)} ➔ {localFmtDate(pB.date)} ({timeStr})
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 2 }}>
                  <span style={{ color: "#94A3B8" }}>เริ่ม:</span>
                  <span style={{ color: "white", fontWeight: 700 }}>{fmt.usd(valA)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "#94A3B8" }}>สิ้นสุด:</span>
                  <span style={{ color: "white", fontWeight: 700 }}>{fmt.usd(valB)}</span>
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
                    {diffVal >= 0 ? "+" : ""}{fmt.usd(diffVal)} ({diffVal >= 0 ? "+" : ""}{diffPct.toFixed(2)}%)
                  </span>
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
                  คลิก 1 ครั้งบนกราฟเพื่อล้างข้อมูลเปรียบเทียบ
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DONUT CHART (Fixed Height)
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   DONUT CHART (Fixed Height — No Layout Shift)
═══════════════════════════════════════════════════════════════ */
const DONUT_COLORS = ["#5236FF", "#00B98A", "#F59E0B", "#FF4B55", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16"];
const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ", fiat: "เงินสด" };

function DonutChart({ segments, activeAssets, hasAssets }) {
  const [drillCategory, setDrillCategory] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const R = 68, CX = 80, CY = 80, SW = 18;
  const circumference = 2 * Math.PI * R;

  // Handle mouse move to update tooltip position
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  // Reset drill-down when active assets are empty
  useEffect(() => {
    if (!activeAssets || activeAssets.length === 0) {
      setDrillCategory(null);
    }
  }, [activeAssets]);

  // If no assets or skeleton state
  if (!segments || segments.length === 0 || !activeAssets) {
    return (
      <div className="donut-card-body">
        <div className="chart-container">
          <div className="donut-wrapper">
            <svg viewBox="0 0 160 160" className="donut-chart-svg">
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={SW} />
            </svg>
            <div className="donut-center-label">
              <div className="donut-center-count" style={{ color: "var(--text-faint)" }}>
                {activeAssets?.length > 0 ? activeAssets.length : "—"}
              </div>
              <div className="donut-center-text">
                {activeAssets?.length > 0 ? "กำลังโหลด..." : "ว่างเปล่า"}
              </div>
            </div>
          </div>
          <div className="legend-list">
            {hasAssets ? (
              /* Skeleton rows when assets exist but no prices yet */
              [1,2,3,4].map(i => (
                <div key={i} className="legend-item">
                  <div className="skeleton skeleton-circle" style={{ width: 10, height: 10, flexShrink: 0 }} />
                  <div className="skeleton skeleton-text" style={{ flex: 1, height: 12 }} />
                  <div className="skeleton skeleton-text" style={{ width: 30, height: 12 }} />
                </div>
              ))
            ) : (
              /* Empty state hint */
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "12px 0", fontSize: 12, color: "var(--text-faint)" }}>
                เพิ่มสินทรัพย์เพื่อดูสัดส่วน
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate current slices depending on drill Category
  let slices = [];
  let displayCount = 0;
  let centerText = "สินทรัพย์";

  if (!drillCategory) {
    // Top-level View
    displayCount = activeAssets.length;
    centerText = "สินทรัพย์";
    let cumulative = 0;
    slices = segments.map((seg, i) => {
      const dash = (seg.pct / 100) * circumference;
      const gap  = circumference - dash;
      const strokeDashoffset = circumference - cumulative;
      cumulative += dash;
      return {
        ...seg,
        dash,
        gap,
        strokeDashoffset,
        color: DONUT_COLORS[i % DONUT_COLORS.length]
      };
    });
  } else {
    // Drilled-down View
    const filtered = activeAssets.filter(a => (a.category || "stock") === drillCategory);
    const catTotalVal = filtered.reduce((sum, a) => sum + (a.valueUSD || 0), 0);
    const sortedFiltered = [...filtered].sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));

    displayCount = sortedFiltered.length;
    centerText = CATEGORY_LABELS[drillCategory] || drillCategory;

    let childCumulative = 0;
    slices = sortedFiltered.map((a, i) => {
      const pct = catTotalVal > 0 ? (a.valueUSD / catTotalVal) * 100 : 0;
      const dash = (pct / 100) * circumference;
      const gap  = circumference - dash;
      const strokeDashoffset = circumference - childCumulative;
      childCumulative += dash;
      return {
        id: a.symbol,
        label: a.symbol,
        fullName: a.name || a.symbol,
        pct,
        value: a.valueUSD,
        dash,
        gap,
        strokeDashoffset,
        color: DONUT_COLORS[i % DONUT_COLORS.length]
      };
    });
  }

  return (
    <div className="donut-card-body" style={{ position: "relative" }}>
      {/* Back button for drilldown */}
      {drillCategory && (
        <button
          onClick={() => {
            setDrillCategory(null);
            setHoveredSlice(null);
          }}
          style={{
            background: "var(--primary-light)",
            color: "var(--primary)",
            border: "none",
            borderRadius: 10,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            transition: "var(--transition)",
            boxShadow: "var(--shadow-xs)"
          }}
          className="ripple-btn"
        >
          ← ย้อนกลับ
        </button>
      )}

      <div className="chart-container">
        <div
          className="donut-wrapper"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <svg viewBox="0 0 160 160" className="donut-chart-svg">
            {/* Background track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={SW} />
            {/* Segments */}
            {slices.map((s, i) => (
              <circle
                key={i}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hoveredSlice && hoveredSlice.id === s.id ? SW + 3 : SW}
                strokeLinecap="butt"
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={s.strokeDashoffset}
                onMouseEnter={() => setHoveredSlice(s)}
                onClick={() => {
                  if (!drillCategory) {
                    setDrillCategory(s.id);
                    setHoveredSlice(null);
                  }
                }}
                style={{
                  cursor: !drillCategory ? "pointer" : "default",
                  transition: "stroke-width 0.2s ease, stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)"
                }}
              />
            ))}
            {/* White center hole */}
            <circle cx={CX} cy={CY} r={R - SW / 2 - 2} fill="white" />
          </svg>

          <div className="donut-center-label" style={{ pointerEvents: "none" }}>
            <div className="donut-center-count">{displayCount}</div>
            <div className="donut-center-text">{centerText}</div>
          </div>

          {/* Floating Tooltip */}
          {hoveredSlice && (
            <div
              className="chart-tooltip-box"
              style={{
                position: "absolute",
                top: mousePos.y - 65,
                left: mousePos.x,
                transform: mousePos.x < 80 ? "translateX(15px)" : "translateX(calc(-100% - 15px))",
                zIndex: 1000,
                pointerEvents: "none",
                background: "var(--text-main)",
                color: "white",
                padding: "8px 12px",
                borderRadius: 12,
                boxShadow: "var(--shadow-md)",
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <div style={{ fontWeight: 800, color: "white" }}>{hoveredSlice.label}</div>
              {hoveredSlice.fullName && (
                <div style={{ fontSize: 10, color: "var(--text-faint)", whiteSpace: "normal", maxWidth: 140 }}>
                  {hoveredSlice.fullName}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                <span style={{ color: "var(--text-faint)" }}>สัดส่วน:</span>
                <span style={{ color: hoveredSlice.color, fontWeight: 800 }}>{hoveredSlice.pct.toFixed(1)}%</span>
              </div>
              {hoveredSlice.value !== undefined && (
                <div style={{ display: "flex", gap: 12, justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--text-faint)" }}>มูลค่า:</span>
                  <span style={{ fontWeight: 800, color: "white" }}>
                    ${hoveredSlice.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="legend-list">
          {slices.map((s, i) => (
            <div
              key={i}
              className="legend-item"
              onMouseEnter={() => setHoveredSlice(s)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => {
                if (!drillCategory) {
                  setDrillCategory(s.id);
                  setHoveredSlice(null);
                }
              }}
              style={{
                cursor: !drillCategory ? "pointer" : "default",
                opacity: hoveredSlice && hoveredSlice.id !== s.id ? 0.5 : 1,
                transition: "opacity 0.2s ease"
              }}
            >
              <div className="legend-color" style={{ background: s.color }} />
              <span className="legend-name" style={{ fontWeight: hoveredSlice && hoveredSlice.id === s.id ? 800 : 600 }}>{s.label}</span>
              <span className="legend-pct" style={{ color: s.color, fontWeight: 800 }}>{s.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getRealizedPnL(lots, isThai, exchangeRate) {
  if (!lots || !lots.length) return 0;
  const sortedLots = [...lots].sort((a, b) => new Date(a.date) - new Date(b.date));
  let realized = 0;
  let currentQty = 0;
  let currentAvgCost = 0;
  for (const lot of sortedLots) {
    const lotQty = lot.qty;
    let lotPrice = lot.price || 0;
    if (isThai && exchangeRate) {
      lotPrice = lotPrice / exchangeRate;
    }
    if (lotQty > 0) {
      const newQty = currentQty + lotQty;
      const newCost = (currentQty * currentAvgCost) + (lotQty * lotPrice);
      currentAvgCost = newQty > 0 ? newCost / newQty : 0;
      currentQty = newQty;
    } else if (lotQty < 0) {
      const sellQty = Math.abs(lotQty);
      const gain = (lotPrice - currentAvgCost) * sellQty;
      realized += gain;
      currentQty = Math.max(0, currentQty - sellQty);
    }
  }
  return realized;
}

function PnLDetailsModal({
  isOpen,
  onClose,
  assets,
  prices,
  exchangeRate,
  historicalRates,
  totalUSD,
  totalCostUSD,
  totalRealizedUSD,
  totalUnrealizedUSD,
  totalGainUSD,
  totalGainPct,
  initialCapitalUSD
}) {
  const [searchTerm, setSearchTerm] = useState("");

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

  const getCurrencyTicker = (symbol) => {
    if (symbol === "THB") return "USDTHB=X";
    if (symbol === "USD") return "USD";
    return `${symbol}USD=X`;
  };

  const getHistoricalRate = (dateStr) => {
    if (!dateStr) return exchangeRate;
    const targetDate = dateStr.split("T")[0];
    if (historicalRates && historicalRates[targetDate]) {
      return historicalRates[targetDate];
    }
    const dates = Object.keys(historicalRates || {}).sort();
    if (dates.length === 0) return exchangeRate;
    let bestRate = exchangeRate;
    for (const d of dates) {
      if (d <= targetDate) {
        bestRate = historicalRates[d];
      } else {
        break;
      }
    }
    return bestRate;
  };

  const getRealizedPnLInTHB = (lots, isThai) => {
    if (!lots || !lots.length) return 0;
    const sortedLots = [...lots].sort((a, b) => new Date(a.date) - new Date(b.date));
    let realizedTHB = 0;
    let currentQty = 0;
    let currentAvgCostUSD = 0;
    for (const lot of sortedLots) {
      const lotQty = lot.qty;
      let lotPriceUSD = lot.price || 0;
      const txRate = getHistoricalRate(lot.date);
      if (isThai && txRate) {
        lotPriceUSD = lotPriceUSD / txRate;
      }
      if (lotQty > 0) {
        const newQty = currentQty + lotQty;
        const newCost = (currentQty * currentAvgCostUSD) + (lotQty * lotPriceUSD);
        currentAvgCostUSD = newQty > 0 ? newCost / newQty : 0;
        currentQty = newQty;
      } else if (lotQty < 0) {
        const sellQty = Math.abs(lotQty);
        const gainUSD = (lotPriceUSD - currentAvgCostUSD) * sellQty;
        const gainTHB = gainUSD * txRate;
        realizedTHB += gainTHB;
        currentQty = Math.max(0, currentQty - sellQty);
      }
    }
    return realizedTHB;
  };

  const computeAssetMetrics = (asset) => {
    const isThai = asset.symbol.toUpperCase().endsWith(".BK");
    const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

    let priceUSD = 0;
    if (isCashAsset) {
      const ticker = getCurrencyTicker(asset.symbol);
      const p = prices[ticker]?.price;
      priceUSD = getCurrencyPriceUSD(asset.symbol, p, exchangeRate);
    } else {
      const p = prices[asset.symbol]?.price ?? 0;
      priceUSD = isThai ? p / exchangeRate : p;
    }

    const valueUSD = priceUSD * asset.qty;
    const avgCost = asset.avgCost ?? asset.avgPrice ?? 0;
    const costUSD = isCashAsset ? avgCost * asset.qty : (avgCost * asset.qty / (isThai ? exchangeRate : 1));
    const unrealized = asset.qty > 0 ? (valueUSD - costUSD) : 0;

    // Realized
    const realized = getRealizedPnL(asset.lots || [], isThai, exchangeRate);
    const realizedTHB = getRealizedPnLInTHB(asset.lots || [], isThai);

    // Initial Capital (cumulative buys)
    let totalInvested = 0;
    (asset.lots || []).forEach(l => {
      if (l.qty > 0) {
        const pUSD = isThai ? l.price / exchangeRate : l.price;
        totalInvested += l.qty * pUSD;
      }
    });
    if (totalInvested === 0 && asset.qty > 0) {
      totalInvested = costUSD;
    }

    const totalPnL = realized + unrealized;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      valueUSD,
      totalInvested,
      realized,
      realizedTHB,
      unrealized,
      totalPnL,
      totalPnLPct
    };
  };

  const breakdown = useMemo(() => {
    return assets.map(a => {
      const metrics = computeAssetMetrics(a);
      return {
        ...a,
        ...metrics
      };
    });
  }, [assets, prices, exchangeRate]);

  // Sum up THB values realistically
  const { totalRealizedTHB_Modal, totalUnrealizedTHB_Modal } = useMemo(() => {
    let relTHB = 0;
    let unrelTHB = 0;
    breakdown.forEach(b => {
      relTHB += b.realizedTHB || 0;
      unrelTHB += (b.unrealized || 0) * exchangeRate;
    });
    return {
      totalRealizedTHB_Modal: relTHB,
      totalUnrealizedTHB_Modal: unrelTHB
    };
  }, [breakdown, exchangeRate]);

  const totalGainTHB_Modal = totalRealizedTHB_Modal + totalUnrealizedTHB_Modal;

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return breakdown;
    return breakdown.filter(b =>
      b.symbol.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q)
    );
  }, [breakdown, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 840, width: "95%" }}>
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
          <span className="modal-title" style={{ fontSize: 16, fontWeight: 800 }}>📊 รายละเอียดกำไร/ขาดทุนรายสินทรัพย์ (P&L Breakdown)</span>
          <button className="btn-close" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Overview Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          marginTop: 14,
          marginBottom: 16,
          background: "#F8FAFC",
          padding: 16,
          borderRadius: 14,
          border: "1px solid var(--border)"
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>ทุนสะสมสะสมทั้งหมด</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>{fmt.usd(initialCapitalUSD)}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{fmt.thb(initialCapitalUSD * exchangeRate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>มูลค่าสินทรัพย์ปัจจุบัน</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>{fmt.usd(totalUSD)}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{fmt.thb(totalUSD * exchangeRate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>รับรู้แล้ว (Realized)</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: totalRealizedUSD >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {totalRealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalRealizedUSD)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {totalRealizedTHB_Modal >= 0 ? "+" : ""}{fmt.thb(totalRealizedTHB_Modal)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>ยังไม่รับรู้ (Unrealized)</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: totalUnrealizedUSD >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {totalUnrealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalUnrealizedUSD)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {totalUnrealizedTHB_Modal >= 0 ? "+" : ""}{fmt.thb(totalUnrealizedTHB_Modal)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>ผลตอบแทนสะสมสุทธิ</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: totalGainUSD >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {totalGainUSD >= 0 ? "+" : ""}{fmt.usd(totalGainUSD)}
            </div>
            <div style={{ fontSize: 11, color: totalGainTHB_Modal >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: 700, display: "flex", flexDirection: "column", gap: 2 }}>
              <div>{totalGainTHB_Modal >= 0 ? "+" : ""}{fmt.thb(totalGainTHB_Modal)}</div>
              <div style={{ opacity: 0.8, fontSize: 10 }}>({totalGainUSD >= 0 ? "▲" : "▼"} {fmt.pct(totalGainPct)})</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 ค้นหาตามสัญลักษณ์หรือชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ height: 38, borderRadius: 10, width: "100%", padding: "0 12px", border: "1px solid var(--border)", fontSize: 13 }}
          />
        </div>

        {/* Breakdown Table */}
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12, maxHeight: 320, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F1F5F9", position: "sticky", top: 0, zIndex: 1 }}>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)" }}>สินทรัพย์</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)" }}>สถานะ</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)", textAlign: "right" }}>จำนวนถือ</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)", textAlign: "right" }}>ทุนสะสมสะสม (USD)</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)", textAlign: "right" }}>รับรู้แล้ว (Realized)</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)", textAlign: "right" }}>ยังไม่รับรู้ (Unrealized)</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-muted)", textAlign: "right" }}>ผลตอบแทนรวม (USD)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                    ไม่พบรายการสินทรัพย์
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isSoldOut = item.qty <= 0.00001;
                  const isCash = item.type === "fiat" || item.category === "fiat";
                  const totalPnLTHB = (item.realizedTHB || 0) + (item.unrealized || 0) * exchangeRate;
                  return (
                    <tr key={item.id || item.symbol} style={{ borderTop: "1px solid var(--border)", background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13 }}>{item.symbol}</span>
                          <span className={`badge-type ${item.category || "stock"}`} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 4 }}>
                            {item.category || "stock"}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginTop: 2 }}>{item.name}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {isSoldOut ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", background: "#E2E8F0", padding: "2px 8px", borderRadius: 6 }}>ขายหมดแล้ว</span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 6 }}>กำลังถือ</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                        {isCash ? "—" : fmt.qty(item.qty)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                        <div>{fmt.usd(item.totalInvested)}</div>
                        <div style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: "normal" }}>
                          ({fmt.thb(item.totalInvested * exchangeRate)})
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: item.realized >= 0 ? "var(--gain)" : "var(--loss)" }}>
                        <div>{item.realized !== 0 ? (item.realized >= 0 ? "+" : "") + fmt.usd(item.realized) : "—"}</div>
                        {item.realized !== 0 && (
                          <div style={{ fontSize: 10, color: item.realizedTHB >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: "normal" }}>
                            ({item.realizedTHB >= 0 ? "+" : ""}{fmt.thb(item.realizedTHB)})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: item.unrealized >= 0 ? "var(--gain)" : "var(--loss)" }}>
                        <div>{item.unrealized !== 0 && !isSoldOut ? (item.unrealized >= 0 ? "+" : "") + fmt.usd(item.unrealized) : "—"}</div>
                        {item.unrealized !== 0 && !isSoldOut && (
                          <div style={{ fontSize: 10, color: item.unrealized >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: "normal" }}>
                            ({item.unrealized >= 0 ? "+" : ""}{fmt.thb(item.unrealized * exchangeRate)})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: item.totalPnL >= 0 ? "var(--gain)" : "var(--loss)" }}>
                        <div>{item.totalPnL >= 0 ? "+" : ""}{fmt.usd(item.totalPnL)}</div>
                        <div style={{ fontSize: 10, color: totalPnLTHB >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: "bold" }}>
                          ({totalPnLTHB >= 0 ? "+" : ""}{fmt.thb(totalPnLTHB)})
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>({item.totalPnL >= 0 ? "▲" : "▼"}{fmt.pct(item.totalPnLPct)})</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   KPI CARDS ROW
═══════════════════════════════════════════════════════════════ */
function KPIRow({ totalUSD, totalTHB, todayChange, todayChangeTHB, todayChangePct, totalGain, totalGainTHB, totalGainPct, bestAsset, loading }) {
  if (loading) {
    return (
      <div className="kpi-row stagger-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="kpi-card">
            <div className="skeleton skeleton-text" style={{ width: "60%", marginBottom: 10 }} />
            <div className="skeleton skeleton-text xl" style={{ width: "80%", marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: "40%" }} />
          </div>
        ))}
      </div>
    );
  }

  const todayUp   = todayChange >= 0;
  const totalUp   = totalGain  >= 0;

  return (
    <div className="kpi-row stagger-1">
      <div className="kpi-card primary">
        <div className="kpi-label">💰 มูลค่ารวม</div>
        <div className="kpi-value">{fmt.usd(totalUSD)}</div>
        <div className="kpi-sub">{fmt.thb(totalTHB)}</div>
      </div>

      <div className={`kpi-card ${todayUp ? "gain-card" : "loss-card"}`}>
        <div className="kpi-label">📅 วันนี้</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div className="kpi-value" style={{ color: todayUp ? "var(--gain)" : "var(--loss)", margin: 0, whiteSpace: "nowrap" }}>
            {todayChange !== 0 ? (todayUp ? "+" : "-") + fmt.usd(Math.abs(todayChange)) : "—"}
          </div>
          {todayChange !== 0 && (
            <span className={`kpi-badge ${todayUp ? "up" : "down"}`} style={{ margin: 0, whiteSpace: "nowrap" }}>
              {todayUp ? "▲" : "▼"} {fmt.pct(todayChangePct)}
            </span>
          )}
        </div>
        {todayChange !== 0 && (
          <div className="kpi-sub" style={{ marginTop: 2 }}>{todayUp ? "+" : "-"}{fmt.thb(Math.abs(todayChangeTHB))}</div>
        )}
      </div>

      <div className={`kpi-card ${totalUp ? "gain-card" : "loss-card"}`}>
        <div className="kpi-label">📊 กำไร/ขาดทุนรวม</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div className="kpi-value" style={{ color: totalUp ? "var(--gain)" : "var(--loss)", margin: 0, whiteSpace: "nowrap" }}>
            {totalGain !== 0 ? (totalUp ? "+" : "-") + fmt.usd(Math.abs(totalGain)) : "—"}
          </div>
          {totalGain !== 0 && (
            <span className={`kpi-badge ${totalUp ? "up" : "down"}`} style={{ margin: 0, whiteSpace: "nowrap" }}>
              {totalUp ? "▲" : "▼"} {fmt.pct(totalGainPct)}
            </span>
          )}
        </div>
        {totalGain !== 0 && (
          <div className="kpi-sub" style={{ marginTop: 2 }}>{totalUp ? "+" : "-"}{fmt.thb(Math.abs(totalGainTHB))}</div>
        )}
      </div>

      <div className="kpi-card gold-card">
        <div className="kpi-label">🏆 ดีที่สุด</div>
        {bestAsset ? (
          <>
            <div className="kpi-value small">{bestAsset.symbol}</div>
            <div className="kpi-sub" style={{ color: "var(--gain)", fontWeight: 700 }}>
              {fmt.pct(bestAsset.pct)}
            </div>
          </>
        ) : (
          <div className="kpi-value small" style={{ color: "var(--text-muted)" }}>—</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Dashboard({ user, onLogout, showToast }) {
  const [assets, setAssets]               = useState([]);
  const [prices, setPrices]               = useState({});
  const [sparklines, setSparklines]       = useState({});   // { SYM: { dates, closes } }
  const [portfolioHistory, setPortfolioHistory] = useState([]); // [{date, value}]
  const [exchangeRate, setExchangeRate]   = useState(35.0);
  const [historicalRates, setHistoricalRates] = useState({});

  const getHistoricalRate = useCallback((dateStr) => {
    if (!dateStr) return exchangeRate;
    const targetDate = dateStr.split("T")[0];
    if (historicalRates[targetDate]) {
      return historicalRates[targetDate];
    }
    const dates = Object.keys(historicalRates).sort();
    if (dates.length === 0) return exchangeRate;
    let bestRate = exchangeRate;
    for (const d of dates) {
      if (d <= targetDate) {
        bestRate = historicalRates[d];
      } else {
        break;
      }
    }
    return bestRate;
  }, [historicalRates, exchangeRate]);

  const getRealizedPnLInTHB = useCallback((lots, isThai) => {
    if (!lots || !lots.length) return 0;
    const sortedLots = [...lots].sort((a, b) => new Date(a.date) - new Date(b.date));
    let realizedTHB = 0;
    let currentQty = 0;
    let currentAvgCostUSD = 0;
    for (const lot of sortedLots) {
      const lotQty = lot.qty;
      let lotPriceUSD = lot.price || 0;
      const txRate = getHistoricalRate(lot.date);
      if (isThai && txRate) {
        lotPriceUSD = lotPriceUSD / txRate;
      }
      if (lotQty > 0) {
        const newQty = currentQty + lotQty;
        const newCost = (currentQty * currentAvgCostUSD) + (lotQty * lotPriceUSD);
        currentAvgCostUSD = newQty > 0 ? newCost / newQty : 0;
        currentQty = newQty;
      } else if (lotQty < 0) {
        const sellQty = Math.abs(lotQty);
        const gainUSD = (lotPriceUSD - currentAvgCostUSD) * sellQty;
        const gainTHB = gainUSD * txRate;
        realizedTHB += gainTHB;
        currentQty = Math.max(0, currentQty - sellQty);
      }
    }
    return realizedTHB;
  }, [getHistoricalRate]);

  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [sparklineLoading, setSparklineLoading] = useState(false);
  const [autoRefresh, setAutoRefresh]     = useState(true);
  const [chartRange, setChartRange]       = useState("1M");
  const [sortConfig, setSortConfig]       = useState({ key: "value", dir: "desc" });
  const [priceFlash, setPriceFlash]       = useState({});   // { SYM: "up"|"down" }
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingAsset, setEditingAsset]   = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [portfolioName, setPortfolioName] = useState(() => localStorage.getItem(`portfolio_name_${user.username}`) || "StockVault");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName]           = useState("");
  const [showPnLDetailsModal, setShowPnLDetailsModal] = useState(false);

  const syncProfileToServer = async (name, pic, nick) => {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          portfolioName: name,
          profilePic: pic,
          nickname: nick
        })
      });
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  };

  useEffect(() => {
    const fetchProfileSync = async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.portfolioName) {
            setPortfolioName(data.portfolioName);
            localStorage.setItem(`portfolio_name_${user.username}`, data.portfolioName);
          }
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem(`profile_pic_${user.username}`, data.profilePic);
          }
          if (data.nickname) {
            setNickname(data.nickname);
            localStorage.setItem(`profile_nickname_${user.username}`, data.nickname);
          }
        }
      } catch (err) {
        console.error("Failed to fetch synced profile:", err);
      }
    };
    fetchProfileSync();
  }, [user.token, user.username]);

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setPortfolioName(trimmed);
      localStorage.setItem(`portfolio_name_${user.username}`, trimmed);
      await syncProfileToServer(trimmed, profilePic, nickname);
    }
    setIsEditingName(false);
  };

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePic, setProfilePic]             = useState(() => localStorage.getItem(`profile_pic_${user.username}`) || "");
  const [nickname, setNickname]                 = useState(() => localStorage.getItem(`profile_nickname_${user.username}`) || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");

  useEffect(() => {
    // No hardcoded key migration — key must be entered via Settings
  }, []);

  const [newNickname, setNewNickname]           = useState("");
  const [oldPassword, setOldPassword]           = useState("");
  const [newPassword, setNewPassword]           = useState("");

  useEffect(() => {
    if (profileModalOpen) {
      setNewNickname(nickname);
      setOldPassword("");
      setNewPassword("");
    }
  }, [profileModalOpen, nickname]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("ขนาดไฟล์ต้องไม่เกิน 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const trimmedNickname = newNickname.trim();
      localStorage.setItem(`profile_nickname_${user.username}`, trimmedNickname);
      setNickname(trimmedNickname);
      localStorage.setItem(`profile_pic_${user.username}`, profilePic);
      showToast("บันทึกข้อมูลโปรไฟล์สำเร็จ!", "success");
      setProfileModalOpen(false);
      await syncProfileToServer(portfolioName, profilePic, trimmedNickname);
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึกโปรไฟล์", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showToast("กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่ให้ครบถ้วน", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ", "error");
        return;
      }
      showToast("เปลี่ยนรหัสผ่านสำเร็จแล้ว!", "success");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน", "error");
    }
  };

  const prevPricesRef = useRef({});
  const assetsRef = useRef([]);
  assetsRef.current = assets;

  /* ── FETCH PORTFOLIO ── */
  const fetchPortfolio = async () => {
    try {
      const res = await fetch("/api/portfolio", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
        await fetchPrices(data);
        if (data.length > 0) fetchSparklines(data, chartRange);
      }
    } catch (err) {
      showToast("โหลดพอร์ตไม่สำเร็จ: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── FETCH LIVE PRICES ── */
  const fetchPrices = async (portfolioAssets) => {
    setRefreshing(true);
    try {
      const symbols = portfolioAssets
        .map(a => {
          const isCashAsset = a.type === "fiat" || a.category === "fiat";
          if (isCashAsset) {
            if (a.symbol === "USD") return null;
            return getCurrencyTicker(a.symbol);
          }
          return a.symbol;
        })
        .filter(Boolean)
        .join(",");
      const res = await fetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
      if (res.ok) {
        const data = await res.json();
        const newPrices = data.quotes || {};

        // Detect price changes for flash animation
        const flash = {};
        Object.keys(newPrices).forEach(sym => {
          const prev = prevPricesRef.current[sym]?.price;
          const curr = newPrices[sym]?.price;
          if (prev != null && curr != null && curr !== prev) {
            flash[sym] = curr > prev ? "up" : "down";
          }
        });
        if (Object.keys(flash).length > 0) {
          setPriceFlash(flash);
          setTimeout(() => setPriceFlash({}), 1600);
        }

        prevPricesRef.current = newPrices;
        setPrices(newPrices);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      }
    } catch (err) {
      console.error("Price fetch error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  /* ── FETCH SPARKLINES ── */
  const fetchSparklines = async (portfolioAssets, range) => {
    if (!portfolioAssets.length) return;
    setSparklineLoading(true);
    try {
      const syms = [...new Set(portfolioAssets.map(a => {
        const isCashAsset = a.type === "fiat" || a.category === "fiat";
        if (isCashAsset) {
          if (a.symbol === "USD") return null;
          return getCurrencyTicker(a.symbol);
        }
        return a.symbol;
      }).filter(Boolean))];

      // Calculate optimal timeframe range based on earliest transaction date (including cash)
      let earliestDate = null;
      portfolioAssets.forEach(asset => {
        const assetLots = asset.lots && asset.lots.length > 0 ? asset.lots : [];
        assetLots.forEach(lot => {
          if (lot && lot.date && lot.date !== "1970-01-01") {
            if (!earliestDate || lot.date < earliestDate) {
              earliestDate = lot.date;
            }
          }
        });
      });

      let optimalRange = range;
      if (earliestDate) {
        const earliestTime = new Date(earliestDate + "T00:00:00.000Z").getTime();
        const ageInDays = (Date.now() - earliestTime) / 86400000;

        const rangeDurationDays = {
          "1D": 1,
          "1W": 7,
          "1M": 30,
          "3M": 90,
          "6M": 180,
          "YTD": 365,
          "1Y": 365,
          "5Y": 1825,
          "MAX": Infinity
        };

        const rangesOrder = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];
        let matchedRange = "1D";
        for (const r of rangesOrder) {
          matchedRange = r;
          if (rangeDurationDays[r] >= ageInDays) {
            break;
          }
        }

        const requestedIdx = rangesOrder.indexOf(range);
        const matchedIdx = rangesOrder.indexOf(matchedRange);
        if (matchedIdx < requestedIdx) {
          optimalRange = matchedRange;
        }
      }

      const res = await fetch(`/api/prices?sparkline=${encodeURIComponent(syms.join(","))}&tf=${optimalRange}`);
      if (res.ok) {
        const data = await res.json();
        setSparklines(data);
      }
    } catch (err) {
      console.error("Sparkline fetch error:", err);
    } finally {
      setSparklineLoading(false);
    }
  };

  /* ── COMPUTE PORTFOLIO HISTORY ── */
  useEffect(() => {
    if (!Object.keys(sparklines).length || !assets.length) {
      setPortfolioHistory([]);
      return;
    }

    // Check if dates are intraday (1D, 5D, 1W)
    const isShortTF = chartRange === "1D" || chartRange === "5D" || chartRange === "1W";

    // Parse and sort price points for each symbol to allow robust closest-date lookups
    const symbolPriceHistories = {};
    Object.keys(sparklines).forEach(sym => {
      const symData = sparklines[sym];
      if (symData && symData.dates && symData.dates.length > 0) {
        const points = symData.dates.map((d, idx) => ({
          dateStr: isShortTF ? d : d.split("T")[0],
          price: symData.closes[idx]
        })).filter(p => p.price != null && p.price > 0);
        // Sort by dateStr ascending
        points.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        symbolPriceHistories[sym.toUpperCase()] = points;
      }
    });

    const getPriceOnDate = (sym, targetDateStr) => {
      const points = symbolPriceHistories[sym.toUpperCase()];

      // If we are looking for today's price (or a future date), use the live price if available
      const todayStr = new Date().toISOString().split("T")[0];
      if (targetDateStr.startsWith(todayStr)) {
        const livePrice = prices[sym.toUpperCase()]?.price;
        if (livePrice != null && livePrice > 0) {
          return livePrice;
        }
      }

      if (points && points.length > 0) {
        // Find latest price on or before targetDateStr (lexicographical comparison)
        for (let i = points.length - 1; i >= 0; i--) {
          if (points[i].dateStr <= targetDateStr) {
            return points[i].price;
          }
        }
        // Fallback to first available price if targetDateStr is before the first point
        return points[0].price;
      }

      // Fallback to live price from fetchPrices
      const livePrice = prices[sym.toUpperCase()]?.price;
      if (livePrice != null && livePrice > 0) {
        return livePrice;
      }

      // Fallback to asset's own average price/cost
      const asset = assets.find(a => a.symbol.toUpperCase() === sym.toUpperCase());
      if (asset) {
        const avg = asset.avgCost ?? asset.avgPrice ?? 0;
        if (avg > 0) return avg;
      }
      return null;
    };

    // 1. Create a union of all dates across all sparklines
    const allDatesSet = new Set();
    Object.keys(sparklines).forEach(sym => {
      const symData = sparklines[sym];
      if (symData && symData.dates) {
        symData.dates.forEach(d => {
          if (d) {
            if (isShortTF) {
              allDatesSet.add(d); // Keep full ISO string for intraday
            } else {
              allDatesSet.add(d.split("T")[0]); // Keep only date part YYYY-MM-DD for daily/weekly
            }
          }
        });
      }
    });

    if (allDatesSet.size === 0) {
      setPortfolioHistory([]);
      return;
    }

    // Add current live time to the timeline so the graph ends exactly at the current live valuation
    if (isShortTF) {
      allDatesSet.add(new Date().toISOString());
    } else {
      allDatesSet.add(new Date().toISOString().split("T")[0]);
    }

    // Sort timeline ascending
    let timeline = Array.from(allDatesSet).sort((a, b) => a.localeCompare(b));

    // 2. Find the earliest transaction date across all assets (including cash)
    let earliestDate = null;
    assets.forEach(asset => {
      const assetLots = asset.lots && asset.lots.length > 0 ? asset.lots : [];
      assetLots.forEach(lot => {
        if (lot && lot.date && lot.date !== "1970-01-01") {
          if (!earliestDate || lot.date < earliestDate) {
            earliestDate = lot.date;
          }
        }
      });
    });

    // Find the raw start date of the fetched timeframe (from sparklines)
    let rawStartDateStr = null;
    Object.keys(sparklines).forEach(sym => {
      const symData = sparklines[sym];
      if (symData && symData.dates && symData.dates.length > 0) {
        const firstDate = symData.dates[0];
        if (firstDate) {
          const dStr = firstDate.split("T")[0];
          if (!rawStartDateStr || dStr < rawStartDateStr) {
            rawStartDateStr = dStr;
          }
        }
      }
    });

    if (earliestDate) {
      const earliestStr = earliestDate.split("T")[0];
      // ONLY clip or prepend the earliest purchase date if the purchase happened AFTER the timeframe started
      if (rawStartDateStr && earliestStr > rawStartDateStr) {
        timeline = timeline.filter(d => {
          const dStr = isShortTF ? d.split("T")[0] : d;
          return dStr >= earliestStr;
        });

        // Prepend exact first purchase date if the timeline starts after it
        const firstTimelineDate = timeline[0] ? (isShortTF ? timeline[0].split("T")[0] : timeline[0]) : "";
        if (timeline.length > 0 && firstTimelineDate > earliestStr) {
          timeline.unshift(isShortTF ? earliestStr + "T00:00:00.000Z" : earliestStr);
        } else if (timeline.length === 0) {
          timeline.push(isShortTF ? earliestStr + "T00:00:00.000Z" : earliestStr);
        }
      }
    }

    // 3. Compute portfolio values for each date in the timeline
    let history = timeline.map((date) => {
      let totalUSD = 0;
      let totalCostUSD = 0;
      const currentDateStr = date.split("T")[0];

      assets.forEach(asset => {
        const assetLots = asset.lots && asset.lots.length > 0
          ? asset.lots
          : [{ id: "virtual", date: "1970-01-01", qty: asset.qty, price: (asset.avgCost ?? asset.avgPrice ?? 0) }];

        // Filter lots purchased on or before this day
        const lotsBeforeOrOnDate = assetLots.filter(lot => lot && lot.date && lot.date <= currentDateStr);
        if (lotsBeforeOrOnDate.length === 0) return; // not purchased yet

        // Calculate qty on this date
        const qtyOnDate = lotsBeforeOrOnDate.reduce((sum, l) => sum + (l.qty || 0), 0);

        // Calculate cost on this date in USD
        const isThai = asset.symbol.toUpperCase().endsWith(".BK");
        const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

        const costOnDateUSD = lotsBeforeOrOnDate.reduce((sum, l) => {
          let priceUSD = isThai ? (l.price || 0) / exchangeRate : (l.price || 0);
          if (isCashAsset) {
            if (asset.symbol === "USD") {
              priceUSD = 1.0;
            } else {
              priceUSD = l.price || getCurrencyPriceUSD(asset.symbol, prices, exchangeRate);
            }
          }
          return sum + (l.qty || 0) * priceUSD;
        }, 0);

        if (isCashAsset) {
          let priceUSD = 0;
          if (asset.symbol === "USD") {
            priceUSD = 1.0;
          } else {
            const ticker = getCurrencyTicker(asset.symbol);
            const priceVal = getPriceOnDate(ticker, date);
            if (priceVal != null && priceVal > 0) {
              if (["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol)) {
                priceUSD = priceVal;
              } else {
                priceUSD = 1.0 / priceVal;
              }
            } else {
              priceUSD = asset.symbol === "THB" ? 1.0 / (exchangeRate || 35.0) : 1.0;
            }
          }

          const valueUSD = priceUSD * qtyOnDate;
          totalUSD += valueUSD;
          totalCostUSD += costOnDateUSD;
          return;
        }

        const price = getPriceOnDate(asset.symbol, date);
        // Robust fallback: if sparkline price is null/missing, use live price or purchase price
        let priceUSD = 0;
        if (price != null && price > 0) {
          priceUSD = isThai ? price / exchangeRate : price;
        } else {
          const livePrice = prices[asset.symbol.toUpperCase()]?.price;
          if (livePrice != null && livePrice > 0) {
            priceUSD = isThai ? livePrice / exchangeRate : livePrice;
          } else {
            priceUSD = qtyOnDate > 0 ? costOnDateUSD / qtyOnDate : 0;
          }
        }
        const valueUSD = priceUSD * qtyOnDate;
        totalUSD += valueUSD;
        totalCostUSD += costOnDateUSD;
      });

      const dateIso = date.includes("T") ? date : date + "T00:00:00.000Z";
      return { date: dateIso, value: totalUSD, cost: totalCostUSD };
    });

    // Clean history points
    history = history.filter(d => d.value > 0);

    // If there is only 1 historical point, pad it to the day before to prevent length < 2 guard
    if (history.length === 1) {
      const singlePoint = history[0];
      const prevDate = new Date(new Date(singlePoint.date) - 86400000).toISOString();
      history.unshift({ date: prevDate, value: singlePoint.value, cost: singlePoint.cost });
    }

    setPortfolioHistory(history);
  }, [sparklines, assets, prices, exchangeRate, chartRange]);

  /* ── CHART RANGE CHANGE ── */
  const handleRangeChange = useCallback((r) => {
    setChartRange(r);
    if (assetsRef.current.length > 0) fetchSparklines(assetsRef.current, r);
  }, []);

  /* ── AUTO-REFRESH ENGINE ── */
  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    const fetchHistoricalRates = async () => {
      try {
        const res = await fetch("/api/prices?history=THB=X&tf=MAX");
        if (res.ok) {
          const data = await res.json();
          const rates = {};
          if (data.candles) {
            data.candles.forEach(c => {
              if (c.date && c.close) {
                const dateKey = c.date.split("T")[0];
                rates[dateKey] = c.close;
              }
            });
          }
          setHistoricalRates(rates);
        }
      } catch (err) {
        console.error("Failed to fetch historical exchange rates:", err);
      }
    };
    fetchHistoricalRates();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => fetchPrices(assetsRef.current), 30000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  /* ── SORT TABLE ── */
  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  /* ── COMPUTE PER-ASSET VALUATION ── */
  const computeAsset = useCallback((asset) => {
    const isThai = asset.symbol.endsWith(".BK");
    const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

    if (isCashAsset) {
      const price = 1.0;
      const priceUSD = getCurrencyPriceUSD(asset.symbol, prices, exchangeRate);
      const valueUSD = priceUSD * asset.qty;
      const valueTHB = valueUSD * exchangeRate;

      const avgCost = asset.avgCost ?? asset.avgPrice ?? priceUSD;
      const costUSD = avgCost * asset.qty;
      const gainUSD = valueUSD - costUSD;
      const gainPct = costUSD > 0 ? (gainUSD / costUSD) * 100 : 0;

      // Calculate day changes based on Yahoo Finance ticker previousClose if available
      let todayChg = 0;
      let todayPct = 0;
      if (asset.symbol !== "USD") {
        const ticker = getCurrencyTicker(asset.symbol);
        const pData = prices[ticker];
        if (pData) {
          const prevPriceVal = pData.previousClose || pData.price;
          if (prevPriceVal > 0) {
            let prevPriceUSD = 0;
            if (["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol)) {
              prevPriceUSD = prevPriceVal;
            } else {
              prevPriceUSD = 1.0 / prevPriceVal;
            }
            todayChg = (priceUSD - prevPriceUSD) * asset.qty;
            todayPct = prevPriceUSD > 0 ? ((priceUSD - prevPriceUSD) / prevPriceUSD) * 100 : 0;
          }
        }
      }

      return {
        price,
        priceUSD,
        valueUSD,
        valueTHB,
        costUSD,
        gainUSD,
        gainPct,
        todayChg,
        todayPct,
        extPrice: null,
        extChangePct: null,
        extType: null
      };
    }

    const pData = prices[asset.symbol];
    const regPrice = pData?.price ?? 0;

    // Check for active pre-market or after-market pricing
    const isPre = pData?.marketState === "PRE" || pData?.marketState === "PREPRE";
    const isPost = pData?.marketState === "POST" || pData?.marketState === "POSTPOST";

    let extPrice = null;
    let extChangePct = null;
    let extType = null;

    if (isPre && pData.prePrice != null && pData.prePrice > 0) {
      extPrice = pData.prePrice;
      extChangePct = regPrice > 0 ? ((pData.prePrice - regPrice) / regPrice) * 100 : 0;
      extType = "Pre";
    } else if (isPost && pData.postPrice != null && pData.postPrice > 0) {
      extPrice = pData.postPrice;
      extChangePct = regPrice > 0 ? ((pData.postPrice - regPrice) / regPrice) * 100 : 0;
      extType = "After";
    }


    const price = extPrice ?? regPrice;

    const priceUSD = isThai ? price / exchangeRate : price;
    const valueUSD = priceUSD * asset.qty;
    const valueTHB = valueUSD * exchangeRate;

    // Robustly handle avgCost vs avgPrice for legacy database support
    const avgCost  = asset.avgCost ?? asset.avgPrice ?? 0;
    const costUSD  = avgCost * asset.qty;
    const gainUSD  = valueUSD - costUSD;
    const gainPct  = costUSD > 0 ? (gainUSD / costUSD) * 100 : 0;

    const activePrice = price;
    const prevClose = pData?.previousClose ?? activePrice;
    const todayChg = ((activePrice - prevClose) * asset.qty);
    const todayPct = (prevClose > 0 ? ((activePrice - prevClose) / prevClose) * 100 : 0);

    // Regular hours calculations
    const regPriceUSD = isThai ? regPrice / exchangeRate : regPrice;
    const regValueUSD = regPriceUSD * asset.qty;
    const regValueTHB = regValueUSD * exchangeRate;
    const regGainUSD  = regValueUSD - costUSD;
    const regGainPct  = costUSD > 0 ? (regGainUSD / costUSD) * 100 : 0;
    const regTodayChg = pData?.change ? (isThai ? pData.change / exchangeRate : pData.change) * asset.qty : 0;
    const regTodayPct = pData?.changePercent ?? 0;

    // Extended hours calculations
    let extPriceUSD = null;
    let extValueUSD = null;
    let extValueTHB = null;
    let extGainUSD = null;
    let extGainPct = null;
    let extTodayPct = null;

    if (extPrice != null) {
      extPriceUSD = isThai ? extPrice / exchangeRate : extPrice;
      extValueUSD = extPriceUSD * asset.qty;
      extValueTHB = extValueUSD * exchangeRate;
      extGainUSD = extValueUSD - costUSD;
      extGainPct = costUSD > 0 ? (extGainUSD / costUSD) * 100 : 0;
      extTodayPct = extChangePct ?? 0;
    }

    return {
      price,
      priceUSD,
      valueUSD,
      valueTHB,
      costUSD,
      gainUSD,
      gainPct,
      todayChg,
      todayPct,
      extPrice,
      extChangePct,
      extType,
      // Regular hours fields
      regPrice,
      regPriceUSD,
      regValueUSD,
      regValueTHB,
      regGainUSD,
      regGainPct,
      regTodayChg,
      regTodayPct,
      // Extended hours fields
      extPriceUSD,
      extValueUSD,
      extValueTHB,
      extGainUSD,
      extGainPct,
      extTodayPct
    };
  }, [prices, exchangeRate]);


  /* ── COMPUTED PORTFOLIO TOTALS ── */
  const { totalUSD, totalCostUSD, todayChangeUSD, totalRealizedUSD, totalRealizedTHB, bestAsset, sortedAssets, donutSegments } = useMemo(() => {
    if (!assets.length) return { totalUSD: 0, totalCostUSD: 0, todayChangeUSD: 0, totalRealizedUSD: 0, totalRealizedTHB: 0, bestAsset: null, sortedAssets: [], donutSegments: [] };

    let totVal = 0, totCost = 0, totToday = 0;
    let totRealized = 0;
    let totRealizedTHB = 0;
    let bestSym = null, bestPct = -Infinity;

    const computed = assets.map(a => {
      const c = computeAsset(a);
      totVal   += c.valueUSD;
      totCost  += c.costUSD;
      totToday += c.todayChg;

      const isThai = a.symbol.toUpperCase().endsWith(".BK");
      const realized = getRealizedPnL(a.lots || [], isThai, exchangeRate);
      totRealized += realized;

      const realizedTHB = getRealizedPnLInTHB(a.lots || [], isThai);
      totRealizedTHB += realizedTHB;

      const assetWithPnL = {
        ...a,
        ...c,
        realizedPnL: realized,
        realizedPnLTHB: realizedTHB,
        unrealizedPnL: a.qty > 0 ? (c.valueUSD - c.costUSD) : 0,
        totalPnL: realized + (a.qty > 0 ? (c.valueUSD - c.costUSD) : 0)
      };

      if (c.gainPct > bestPct && a.qty > 0 && (a.avgCost > 0 || a.avgPrice > 0)) {
        bestPct = c.gainPct;
        bestSym = a;
      }
      return assetWithPnL;
    });

    // Filter out assets with qty <= 0.00001 (fully sold-out) from active list
    const activeAssets = computed.filter(a => a.qty > 0.00001);

    // Sort active
    const sorted = [...activeAssets].sort((a, b) => {
      if (!sortConfig.key) return b.valueUSD - a.valueUSD;
      const dir = sortConfig.dir === "asc" ? 1 : -1;
      switch (sortConfig.key) {
        case "value"  : return dir * (a.valueUSD - b.valueUSD);
        case "gain"   : return dir * (a.gainPct - b.gainPct);
        case "today"  : return dir * (a.todayPct - b.todayPct);
        case "symbol" : return dir * a.symbol.localeCompare(b.symbol);
        default       : return 0;
      }
    });

    // Donut segments grouped by category
    const catMap = {};
    activeAssets.forEach(a => {
      const cat = a.category || "stock";
      if (!catMap[cat]) catMap[cat] = 0;
      catMap[cat] += a.valueUSD;
    });
    const donut = Object.entries(catMap)
      .map(([cat, val]) => ({ id: cat, label: CATEGORY_LABELS[cat] || cat, pct: totVal > 0 ? (val / totVal) * 100 : 0, value: val }))
      .filter(s => s.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    return {
      totalUSD: totVal,
      totalCostUSD: totCost,
      todayChangeUSD: totToday,
      totalRealizedUSD: totRealized,
      totalRealizedTHB: totRealizedTHB,
      bestAsset: bestSym ? { symbol: bestSym.symbol, pct: bestPct } : null,
      sortedAssets: sorted,
      donutSegments: donut,
    };
  }, [assets, prices, exchangeRate, sortConfig, computeAsset, getRealizedPnLInTHB]);

  const initialCapitalUSD = useMemo(() => {
    let sumBuys = 0;
    let hasBuys = false;
    assets.forEach(a => {
      const isCashAsset = a.type === "fiat" || a.category === "fiat";
      if (!isCashAsset) {
        const isThai = a.symbol.toUpperCase().endsWith(".BK");
        (a.lots || []).forEach(l => {
          if (l.qty > 0) {
            const priceUSD = isThai ? l.price / exchangeRate : l.price;
            sumBuys += l.qty * priceUSD;
            hasBuys = true;
          }
        });
      }
    });
    if (hasBuys && sumBuys > 0) return sumBuys;
    return totalCostUSD;
  }, [assets, exchangeRate, totalCostUSD]);

  const totalUnrealizedUSD = totalUSD - totalCostUSD;
  const totalUnrealizedTHB = totalUnrealizedUSD * exchangeRate;
  const totalGainTHB = totalUnrealizedTHB + totalRealizedTHB;
  const totalGainUSD = totalUnrealizedUSD + totalRealizedUSD;
  const totalGainPct = initialCapitalUSD > 0 ? (totalGainUSD / initialCapitalUSD) * 100 : 0;
  const todayChangePct = totalCostUSD > 0 ? (todayChangeUSD / (totalUSD - todayChangeUSD)) * 100 : 0;

  /* ── SAVE ASSET (Purchase Lots System) ── */
  const handleSaveAsset = async (formData) => {
    const isBatch = Array.isArray(formData);
    const transactions = isBatch ? formData : [formData];

    // Sort transactions by date ascending (oldest first)
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    try {
      let updatedAssets = [...assets];

      for (const tx of sortedTx) {
        const sym      = (tx.symbol || "").trim().toUpperCase();
        const name     = (tx.name   || sym).trim();
        const newQty   = parseFloat(tx.qty);
        const newPrice = parseFloat(tx.avgPrice ?? tx.price ?? 0);
        const buyDate  = tx.date || new Date().toISOString().split("T")[0];
        const category = tx.type ?? tx.category ?? "stock";

        if (!sym) {
          if (!isBatch) showToast("เลือกสินทรัพย์ก่อนนะครับ", "error");
          continue;
        }
        if (isNaN(newQty) || newQty <= 0) {
          if (!isBatch) showToast("ใส่จำนวนให้ถูกต้อง", "error");
          continue;
        }
        if (isNaN(newPrice) || newPrice < 0) {
          if (!isBatch) showToast("ใส่ราคาทุนให้ถูกต้อง", "error");
          continue;
        }

        const isSell = tx.transactionType === "SELL";
        const existingIdx = updatedAssets.findIndex(a => a.symbol === sym);

        if (isSell) {
          if (existingIdx < 0) {
            // Block in ALL cases — cannot sell what you don't own
            showToast(
              `❌ ไม่สามารถขาย ${sym} ได้ เพราะไม่มี ${sym} ในพอร์ตโฟลิโอ\nกรุณาเพิ่มรายการซื้อก่อน`,
              "error"
            );
            if (!isBatch) return;
            continue; // skip this tx in batch mode
          } else {
            const existing = updatedAssets[existingIdx];
            if (newQty > existing.qty) {
              showToast(
                `❌ ขาย ${sym} ไม่ได้ — จำนวนที่ขาย (${fmt.qty(newQty)}) มากกว่าที่ถืออยู่ (${fmt.qty(existing.qty)} หน่วย)`,
                "error"
              );
              if (!isBatch) return;
              continue; // skip this tx in batch mode
            }
          }
        }

        // Check for duplicates
        if (existingIdx >= 0) {
          const existingAsset = updatedAssets[existingIdx];
          const duplicateLot = (existingAsset.lots || []).find(l => {
            const sameDate = l.date === buyDate;
            const sameTime = (l.time || "") === (tx.time || "");
            const sameQty = Math.abs(l.qty - (isSell ? -newQty : newQty)) < 0.00001;
            const samePrice = Math.abs(l.price - newPrice) < 0.00001;
            return sameDate && sameTime && sameQty && samePrice;
          });
          if (duplicateLot) {
            const confirmMsg = `⚠️ ตรวจพบธุรกรรมที่อาจซ้ำซ้อน:\nมีรายการ ${isSell ? "ขาย" : "ซื้อ"} ${sym} จำนวน ${newQty} หุ้น @ $${newPrice} วันที่ ${buyDate} ${tx.time ? "เวลา " + tx.time + " น." : ""} อยู่ในระบบแล้ว\n\nคุณต้องการบันทึกธุรกรรมนี้เพิ่มอีกรายการใช่หรือไม่?`;
            if (!confirm(confirmMsg)) {
              continue; // Skip this transaction
            }
          }
        }

        const newLot = {
          id:    `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date:  buyDate,
          time:  tx.time || "",
          qty:   isSell ? -newQty : newQty,
          price: newPrice,
        };

        if (existingIdx >= 0) {
          const existing  = updatedAssets[existingIdx];
          const oldLots   = existing.lots || [];
          const allLots   = [...oldLots, newLot];
          const totalQty  = allLots.reduce((s, l) => s + l.qty, 0);

          // Recompute average cost solely from positive (buy) lots
          const buyLots = allLots.filter(l => l.qty > 0);
          const buyQty  = buyLots.reduce((s, l) => s + l.qty, 0);
          const buyCost = buyLots.reduce((s, l) => s + l.qty * l.price, 0);
          const avgCost = buyQty > 0 ? buyCost / buyQty : 0;

          updatedAssets[existingIdx] = {
            ...existing,
            lots:    allLots,
            qty:     totalQty,
            avgCost: avgCost,
          };

          if (!isBatch) {
            const isCash = category === "fiat";
            showToast(
              isSell
                ? `✅ ${isCash ? "ถอนเงินสด" : "ขายออก"} ${sym} ${fmt.qty(newQty)} หน่วยสำเร็จ`
                : `✅ ${isCash ? "ฝากเพิ่ม" : "ซื้อเพิ่ม"} ${sym} ${fmt.qty(newQty)} หน่วยสำเร็จ`,
              "success"
            );
          }
        } else {
          updatedAssets.push({
            id:       `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            symbol:   sym,
            name,
            category,
            lots:     [newLot],
            qty:      isSell ? -newQty : newQty,
            avgCost:  newPrice,
          });
          if (!isBatch) {
            const isCash = category === "fiat";
            showToast(`✅ เพิ่ม ${isCash ? "เงินสด" : "สินทรัพย์"} ${sym} เข้าพอร์ตแล้ว`, "success");
          }
        }
      }

      setAssets(updatedAssets);
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updatedAssets),
      });

      setModalOpen(false);
      setEditingAsset(null);
      await fetchPrices(updatedAssets);
      fetchSparklines(updatedAssets, chartRange);

      if (isBatch) {
        showToast(`✅ นำเข้าธุรกรรมทั้งหมด ${sortedTx.length} รายการสำเร็จ!`, "success");
      }
    } catch (err) {
      showToast("บันทึกไม่สำเร็จ: " + err.message, "error");
    }
  };

  /* ── CLEAR PORTFOLIO ── */
  const handleClearPortfolio = async () => {
    if (!confirm("⚠️ คุณต้องการล้างข้อมูลหุ้นและธุรกรรมทั้งหมดในพอร์ตใช่หรือไม่? (ชื่อเล่นและรูปโปรไฟล์ของคุณจะไม่ถูกลบ)")) return;
    try {
      setAssets([]);
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify([]),
      });
      showToast("🗑️ ล้างข้อมูลพอร์ตหุ้นเรียบร้อยแล้ว!", "success");
      setProfileModalOpen(false);
    } catch (err) {
      showToast("ล้างข้อมูลไม่สำเร็จ: " + err.message, "error");
    }
  };

  /* ── CLEAR ALL DATA ── */
  const handleClearAllData = async () => {
    if (!confirm("⚠️ คำเตือน: คุณต้องการล้างข้อมูลทุกอย่างทั้งหมด (ทั้งข้อมูลหุ้น, ชื่อเล่น, และรูปโปรไฟล์) กลับเป็นค่าเริ่มต้นใช่หรือไม่?")) return;
    try {
      setAssets([]);
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify([]),
      });

      setProfilePic("");
      setNickname("");
      setNewNickname("");
      setPortfolioName("StockVault");
      localStorage.removeItem(`profile_pic_${user.username}`);
      localStorage.removeItem(`profile_nickname_${user.username}`);
      localStorage.removeItem(`portfolio_name_${user.username}`);
      await syncProfileToServer("StockVault", "", "");

      showToast("🗑️ ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว!", "success");
      setProfileModalOpen(false);
    } catch (err) {
      showToast("ล้างข้อมูลไม่สำเร็จ: " + err.message, "error");
    }
  };

  /* ── DELETE ASSET ── */
  const handleDeleteAsset = async (assetToDelete) => {
    if (!confirm(`ลบ ${assetToDelete.symbol} ออกจากพอร์ตใช่ไหม?`)) return;
    const updated = assets.filter(a => a.id !== assetToDelete.id);
    setAssets(updated);
    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updated),
      });
      showToast(`🗑️ ลบ ${assetToDelete.symbol} เรียบร้อย`, "success");
      fetchSparklines(updated, chartRange);
    } catch (err) {
      showToast("ลบไม่สำเร็จ: " + err.message, "error");
    }
  };

  /* ── EXPORT / IMPORT ── */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ assets, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 ส่งออกข้อมูลสำเร็จ", "success");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const imported = parsed.assets || parsed;
        if (!Array.isArray(imported)) { showToast("ไฟล์ไม่ถูกต้อง", "error"); return; }
        setAssets(imported);
        await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
          body: JSON.stringify(imported),
        });
        showToast(`✅ นำเข้า ${imported.length} รายการสำเร็จ`, "success");
        fetchPrices(imported);
        fetchSparklines(imported, chartRange);
      } catch { showToast("ไฟล์ไม่ถูกต้อง", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── SORT HEADER COMPONENT ── */
  const SortTh = ({ sortKey, children, align = "left" }) => {
    const isActive = sortConfig.key === sortKey;
    const isDesc   = isActive && sortConfig.dir === "desc";
    return (
      <th style={{ textAlign: align }}>
        <span className="sort-header" onClick={() => handleSort(sortKey)}>
          {children}
          <span className={`sort-icon ${isActive ? "active" : ""} ${isDesc ? "desc" : "asc"}`}>
            {isActive ? (isDesc ? "▼" : "▲") : "⇅"}
          </span>
        </span>
      </th>
    );
  };

  /* ── MARKET STATE BADGE ── */
  const MarketBadge = ({ state }) => {
    if (!state || state === "REGULAR") return null;
    const map = { PRE: { label: "PRE", cls: "pre" }, POST: { label: "POST", cls: "post" }, CLOSED: { label: "CLOSED", cls: "post" } };
    const info = map[state] || { label: state, cls: "post" };
    return <span className={`badge-market-state ${info.cls}`}>{info.label}</span>;
  };

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <p style={{ fontWeight: 600, color: "var(--text-muted)" }}>กำลังโหลดพอร์ตโฟลิโอ...</p>
      </div>
    );
  }

  const hasPrices = Object.keys(prices).length > 0;

  return (
    <>
      <div className="fade-in">
        {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span>📈</span>
            {isEditingName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--primary)",
                    border: "1.5px solid var(--primary)",
                    borderRadius: 8,
                    padding: "2px 8px",
                    width: 120,
                    fontFamily: "Outfit, sans-serif",
                    height: 28,
                    background: "white"
                  }}
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    height: 28,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  บันทึก
                </button>
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 800 }}>{portfolioName}</span>
                <button
                  onClick={() => { setTempName(portfolioName); setIsEditingName(true); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-faint)",
                    cursor: "pointer",
                    padding: 4,
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                  title="แก้ไขชื่อพอร์ต"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
            <span className="live-dot" title="Live" />
          </div>
            <div className="navbar-actions">
              <div
                className="user-profile-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "default",
                  padding: "4px 10px",
                  borderRadius: 10,
                  background: "var(--primary-light)",
                  userSelect: "none"
                }}
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="avatar"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1.5px solid var(--primary)"
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 13 }}>👤</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                  {nickname || user?.username}
                </span>
              </div>
              <button
                onClick={() => setProfileModalOpen(true)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "var(--transition)"
                }}
                title="ตั้งค่า"
                className="ripple-btn"
              >
                <Settings size={16} />
              </button>
            </div>
        </div>
      </nav>

      <div className="app-container">

        {/* ── KPI CARDS ROW ── */}
        <KPIRow
          totalUSD={hasPrices ? totalUSD : null}
          totalTHB={hasPrices ? totalUSD * exchangeRate : null}
          totalCostUSD={totalCostUSD}
          todayChange={hasPrices ? todayChangeUSD : 0}
          todayChangeTHB={hasPrices ? todayChangeUSD * exchangeRate : 0}
          todayChangePct={hasPrices ? todayChangePct : 0}
          totalGain={hasPrices ? totalGainUSD : 0}
          totalGainTHB={hasPrices ? totalGainTHB : 0}
          totalGainPct={hasPrices ? totalGainPct : 0}
          bestAsset={hasPrices ? bestAsset : null}
          loading={!hasPrices && assets.length > 0}
        />

        {/* ── DASHBOARD GRID ── */}
        <div className="dashboard-grid">

          {/* ══ LEFT COLUMN ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Hero Net Worth Card */}
            <div className="hero-card stagger-2">
              <div className="hero-label">🏦 มูลค่าพอร์ตโฟลิโอรวม</div>
              {hasPrices ? (
                <>
                  <div className={`hero-usd${priceFlash["PORTFOLIO"] ? " num-tick" : ""}`} style={{ marginBottom: 4 }}>
                    {fmt.usd(totalUSD)}
                  </div>
                  <div className="hero-thb" style={{ fontSize: "25px", color: "#FFFFFF", opacity: 0.95, fontWeight: "800", marginTop: 4, marginBottom: 16 }}>
                    {fmt.thb(totalUSD * exchangeRate)}
                  </div>
                  {(totalCostUSD > 0 || initialCapitalUSD > 0 || totalRealizedUSD !== 0) && (
                    <div className={`hero-pnl ${totalGainUSD >= 0 ? "up" : "down"}`}
                      onClick={() => setShowPnLDetailsModal(true)}
                      style={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        gap: "4px 8px",
                        alignItems: "center",
                        cursor: "pointer",
                        background: "rgba(255, 255, 255, 0.12)",
                        padding: "6px 12px",
                        borderRadius: "10px",
                        transition: "background 0.2s, transform 0.2s",
                        border: "1px solid rgba(255, 255, 255, 0.15)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.22)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      title="คลิกเพื่อดูรายละเอียดกำไร/ขาดทุนรายสินทรัพย์">
                      <span>
                        {totalGainUSD >= 0 ? "▲" : "▼"} {fmt.usd(Math.abs(totalGainUSD))}
                      </span>
                      <span style={{ opacity: 0.8, fontSize: 12 }}>({fmt.pct(totalGainPct)})</span>
                      <span style={{ opacity: 0.5 }}>|</span>
                      <span>
                        {totalGainTHB >= 0 ? "▲" : "▼"} {"฿" + new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(totalGainTHB))}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="skeleton skeleton-text xl" style={{ width: "80%", marginBottom: 10 }} />
                  <div className="skeleton skeleton-text" style={{ width: "60%", marginBottom: 16 }} />
                  <div className="skeleton skeleton-block" style={{ width: 140, height: 32, borderRadius: 12 }} />
                </>
              )}
              <div className="hero-divider" />
              <div className="hero-meta">
                <div className="hero-meta-item">
                  <span className="hero-meta-label">สินทรัพย์ที่ถืออยู่</span>
                  <span className="hero-meta-value">{assets.filter(a => a.qty > 0.00001).length} รายการ</span>
                </div>
                <div className="hero-meta-item" style={{ textAlign: "right" }}>
                  <span className="hero-meta-label">ต้นทุนรวม</span>
                  <span className="hero-meta-value" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <span>{fmt.usd(totalCostUSD)}</span>
                    <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.9)", fontWeight: 600 }}>({ "฿" + new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalCostUSD * exchangeRate) })</span>
                  </span>
                </div>
              </div>
              <div className="hero-meta" style={{ marginTop: 10, borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: 10 }}>
                <div className="hero-meta-item">
                  <span className="hero-meta-label">รับรู้แล้ว (Realized)</span>
                  <span className="hero-meta-value" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ color: totalRealizedUSD >= 0 ? "#6EE7B7" : "#FCA5A5", fontWeight: 700 }}>
                      {totalRealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalRealizedUSD)}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.9)", fontWeight: 600 }}>
                      ({totalRealizedUSD >= 0 ? "+" : ""}{fmt.thb(totalRealizedUSD * exchangeRate)})
                    </span>
                  </span>
                </div>
                <div className="hero-meta-item" style={{ textAlign: "right" }}>
                  <span className="hero-meta-label">ยังไม่รับรู้ (Unrealized)</span>
                  <span className="hero-meta-value" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <span style={{ color: totalUnrealizedUSD >= 0 ? "#6EE7B7" : "#FCA5A5", fontWeight: 700 }}>
                      {totalUnrealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalUnrealizedUSD)}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.9)", fontWeight: 600 }}>
                      ({totalUnrealizedUSD >= 0 ? "+" : ""}{fmt.thb(totalUnrealizedUSD * exchangeRate)})
                    </span>
                  </span>
                </div>
              </div>
              <div className="hero-meta" style={{ marginTop: 10, borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: 10 }}>
                <div className="hero-meta-item">
                  <span className="hero-meta-label">ทุนสะสมทั้งหมด</span>
                  <span className="hero-meta-value" style={{ fontWeight: 700 }}>
                    {fmt.usd(initialCapitalUSD)}
                  </span>
                </div>
                <div className="hero-meta-item" style={{ textAlign: "right" }}>
                  <span className="hero-meta-label">มูลค่าทุนสะสม (THB)</span>
                  <span className="hero-meta-value" style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.9)", fontWeight: 600 }}>
                    ({fmt.thb(initialCapitalUSD * exchangeRate)})
                  </span>
                </div>
              </div>
              {hasPrices && todayChangeUSD !== 0 && (
                <div style={{
                  marginTop: 14,
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>กำไร/ขาดทุนวันนี้</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: todayChangeUSD >= 0 ? "#6EE7B7" : "#FCA5A5" }}>
                    {todayChangeUSD >= 0 ? "+" : ""}{fmt.usd(todayChangeUSD)}{" "}
                    <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 700 }}>
                      ({todayChangeUSD >= 0 ? "+" : ""}{"฿" + new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(todayChangeUSD * exchangeRate)})
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Donut Allocation Card */}
            <div className="card stagger-3">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div className="card-section-title">
                  <PieChart size={16} /> สัดส่วนสินทรัพย์
                </div>
              </div>
              <DonutChart
                segments={hasPrices && donutSegments.length > 0 ? donutSegments : []}
                activeAssets={sortedAssets}
                hasAssets={sortedAssets.length > 0}
              />
            </div>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Portfolio Performance Chart */}
            <div className="card stagger-2" style={{ padding: "16px 14px 10px" }}>
              <PortfolioChart
                history={portfolioHistory}
                range={chartRange}
                onRangeChange={handleRangeChange}
                assets={assets}
                exchangeRate={exchangeRate}
              />
            </div>

            {/* Assets Table Card */}
            <div className="card stagger-3">
              <div className="control-bar">
                <div className="section-title" style={{ flexWrap: "wrap", gap: 10 }}>
                  📋 สินทรัพย์ของฉัน
                  {sortedAssets.length > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", background: "#F1F5F9", padding: "2px 10px", borderRadius: 8 }}>
                      {sortedAssets.length} รายการ
                    </span>
                  )}
                  <div className="exchange-badge" style={{ fontSize: 12, height: "fit-content", padding: "4px 10px", margin: 0 }}>
                    💱 1 USD = <strong>{exchangeRate.toFixed(2)}</strong> THB
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className={`btn-icon ripple-btn${refreshing ? " spin" : ""}`}
                    onClick={() => fetchPrices(assets)}
                    title="รีเฟรชราคา"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button className="btn-action ripple-btn" onClick={() => { setEditingAsset(null); setModalOpen(true); }}>
                    <Plus size={16} /> เพิ่มสินทรัพย์
                  </button>
                </div>
              </div>

              {/* ── EMPTY STATE ── */}
              {sortedAssets.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <div className="empty-title">พอร์ตยังว่างอยู่</div>
                  <div className="empty-subtitle">กด "เพิ่มสินทรัพย์" เพื่อเริ่มติดตามการลงทุน</div>
                  <button className="btn btn-primary ripple-btn" style={{ width: "auto", marginTop: 8, paddingInline: 28, height: 48 }}
                    onClick={() => { setEditingAsset(null); setModalOpen(true); }}>
                    <Plus size={18} /> เพิ่มสินทรัพย์แรก
                  </button>
                </div>
              ) : (
                <>
                  {/* ── DESKTOP TABLE ── */}
                  <div className="table-wrapper">
                    <table className="asset-table">
                      <thead>
                        <tr>
                          <th><span className="sort-header" onClick={() => handleSort("symbol")}>
                            สินทรัพย์
                            <span className={`sort-icon${sortConfig.key === "symbol" ? " active" : ""}`}>
                              {sortConfig.key === "symbol" ? (sortConfig.dir === "asc" ? "▲" : "▼") : "⇅"}
                            </span>
                          </span></th>
                          <th style={{ textAlign: "right" }}>ราคา</th>
                          <SortTh sortKey="value" align="right">มูลค่า</SortTh>
                          <SortTh sortKey="gain"  align="right">กำไร/ขาดทุน</SortTh>
                          <SortTh sortKey="today" align="right">วันนี้</SortTh>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAssets.map((asset, idx) => {
                          const pData = prices[asset.symbol];
                          const flash = priceFlash[asset.symbol];
                          const weightPct = totalUSD > 0 ? (asset.valueUSD / totalUSD) * 100 : 0;
                          const isBest = bestAsset?.symbol === asset.symbol;
                          const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

                          const isSelected = selectedAsset?.id === asset.id;
                          return (
                            <tr key={asset.id || asset.symbol}
                              className={`asset-row-clickable ${isSelected ? "selected" : ""} ${flash ? `price-flash-${flash}` : ""}`}
                              onClick={(e) => {
                                if (e.target.closest("button") || e.target.closest("td:last-child")) return;
                                setSelectedAsset(asset);
                              }}
                              style={{ animationDelay: `${idx * 0.04}s` }}>

                              {/* Symbol */}
                              <td>
                                <div className="asset-name-col">
                                  <AssetLogo symbol={asset.symbol} category={asset.category} />
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                      <span className="asset-symbol">{asset.symbol}</span>
                                      <span className={`badge-type ${asset.category || "stock"}`}>{asset.category || "stock"}</span>
                                      {!isCashAsset && isBest && (
                                        <span className="best-badge">🏆 Best</span>
                                      )}
                                    </div>
                                    <div className="asset-fullname">{asset.name}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                      <MarketBadge state={pData?.marketState} />
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", background: "#F1F5F9", padding: "1px 6px", borderRadius: 4 }}>
                                        {weightPct.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Price */}
                              <td style={{ textAlign: "right" }}>
                                {!hasPrices ? (
                                  <div className="skeleton skeleton-text" style={{ width: 70, height: 16, marginLeft: "auto" }} />
                                ) : isCashAsset ? (
                                  <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                                    <div>
                                      {/* Line 1: Regular Price */}
                                      <div className={`num-tick`} style={{ fontWeight: 700, fontSize: 14 }}>
                                        {fmt.usd(asset.regPriceUSD)}
                                      </div>
                                      <div className="price-thb">{fmt.thb(asset.regPriceUSD * exchangeRate)}</div>

                                      {/* Line 2: Extended Hours Price */}
                                      {asset.extPrice != null && (
                                        <div style={{ fontSize: 10, fontWeight: 700, color: asset.extChangePct >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 2 }}>
                                          {asset.extType}: {fmt.usd(asset.extPriceUSD)} ({fmt.pct(asset.extChangePct)})
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Value */}
                              <td style={{ textAlign: "right" }}>
                                {!hasPrices ? (
                                  <div className="skeleton skeleton-text" style={{ width: 80, height: 16, marginLeft: "auto" }} />
                                ) : (
                                  <div>
                                    {/* Line 1: Regular Value */}
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

                                    {/* Line 2: Extended Hours Value */}
                                    {!isCashAsset && asset.extPrice != null && (
                                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                        {asset.extType}: {fmt.usd(asset.extValueUSD)} ({fmt.thb(asset.extValueTHB)})
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Gain/Loss */}
                              <td style={{ textAlign: "right" }}>
                                {!hasPrices || asset.costUSD === 0 || isCashAsset ? (
                                  <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
                                ) : (
                                  <div>
                                    {/* Line 1: Regular Gain/Loss */}
                                    <div className={`pnl-cell ${asset.regGainUSD >= 0 ? "positive" : "negative"}`}>
                                      <div>{asset.regGainUSD >= 0 ? "+" : ""}{fmt.usd(asset.regGainUSD)}</div>
                                      <div style={{ fontSize: 12 }}>{fmt.pct(asset.regGainPct)}</div>
                                    </div>

                                    {/* Line 2: Extended Gain/Loss */}
                                    {asset.extPrice != null && (
                                      <div className={`pnl-cell ${asset.extGainUSD >= 0 ? "positive" : "negative"}`} style={{ fontSize: 10, marginTop: 2 }}>
                                        <div>{asset.extType}: {asset.extGainUSD >= 0 ? "+" : ""}{fmt.usd(asset.extGainUSD)} ({fmt.pct(asset.extGainPct)})</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Today */}
                              <td style={{ textAlign: "right" }}>
                                {!hasPrices || isCashAsset ? (
                                  <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
                                ) : (
                                  <div>
                                    {/* Line 1: Regular Today Return */}
                                    <div className={`pnl-cell ${asset.regTodayPct >= 0 ? "positive" : "negative"}`}>
                                      <div style={{ fontSize: 13 }}>{fmt.pct(asset.regTodayPct)}</div>
                                    </div>

                                    {/* Line 2: Extended Today Return */}
                                    {asset.extPrice != null && (
                                      <div className={`pnl-cell ${asset.extChangePct >= 0 ? "positive" : "negative"}`} style={{ fontSize: 10, marginTop: 2 }}>
                                        <div>{asset.extType}: {fmt.pct(asset.extChangePct)}</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button className="btn-delete" title={asset.category === "fiat" || asset.type === "fiat" ? "ฝากเงินสด / ถอนเงินสด" : "ซื้อ / ขายสินทรัพย์"} style={{ color: "var(--primary)" }}
                                    onClick={() => { setEditingAsset(asset); setModalOpen(true); }}>
                                    <Plus size={14} />
                                  </button>
                                  <button className="btn-delete" title="ลบออกจากพอร์ต" onClick={() => handleDeleteAsset(asset)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── MOBILE CARDS ── */}
                  <div className="mobile-assets-list">
                    {sortedAssets.map((asset, idx) => {
                      const pData = prices[asset.symbol];
                      const flash = priceFlash[asset.symbol];
                      const sp    = (asset.symbol === "THB" || asset.symbol === "USD") ? [1.0, 1.0, 1.0] : sparklines[asset.symbol]?.closes;
                      const isBest = bestAsset?.symbol === asset.symbol;
                      const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

                      return (
                        <div key={asset.id || asset.symbol}
                          className={`mobile-asset-card${flash ? ` price-flash-${flash}` : ""}`}
                          onClick={(e) => {
                            if (e.target.closest("button")) return;
                            setSelectedAsset(asset);
                          }}
                          style={{ animationDelay: `${idx * 0.06}s`, cursor: "pointer" }}>

                          <div className="mobile-card-top">
                            <div className="mobile-card-left">
                              <AssetLogo symbol={asset.symbol} category={asset.category} />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                  <span className="asset-symbol">{asset.symbol}</span>
                                  {!isCashAsset && isBest && <span className="best-badge">🏆</span>}
                                </div>
                                <div className="asset-fullname">{asset.name}</div>
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
                              {isCashAsset ? "📥 ฝาก / 📤 ถอน" : "🟢 ซื้อ / 🔴 ขาย"}
                            </button>
                            <button className="btn-icon ripple-btn" style={{ flex: "0 0 38px" }}
                              onClick={() => handleDeleteAsset(asset)} title="ลบ">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* ── ASSET MODAL ── */}
      {modalOpen && (
        <AssetModal
          isOpen={modalOpen}
          editingAsset={editingAsset}
          onClose={() => { setModalOpen(false); setEditingAsset(null); }}
          onSave={handleSaveAsset}
          exchangeRate={exchangeRate}
          showToast={showToast}
        />
      )}

      {/* ── P&L DETAILS MODAL ── */}
      {showPnLDetailsModal && (
        <PnLDetailsModal
          isOpen={showPnLDetailsModal}
          onClose={() => setShowPnLDetailsModal(false)}
          assets={assets}
          prices={prices}
          exchangeRate={exchangeRate}
          historicalRates={historicalRates}
          totalUSD={totalUSD}
          totalCostUSD={totalCostUSD}
          totalRealizedUSD={totalRealizedUSD}
          totalUnrealizedUSD={totalUnrealizedUSD}
          totalGainUSD={totalGainUSD}
          totalGainPct={totalGainPct}
          initialCapitalUSD={initialCapitalUSD}
        />
      )}

      {/* ── ASSET DETAIL PANEL ── */}
      {selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset}
          price={
            (selectedAsset.type === "fiat" || selectedAsset.category === "fiat")
              ? prices[getCurrencyTicker(selectedAsset.symbol)]
              : prices[selectedAsset.symbol]
          }
          exchangeRate={exchangeRate}
          historicalRates={historicalRates}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* ── SETTINGS MODAL ── */}
      {profileModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setProfileModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">⚙️ ตั้งค่าระบบ (Settings)</span>
              <button className="btn-close" onClick={() => setProfileModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* SECTION 1: PROFILE INFO */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", borderBottom: "1.5px solid var(--primary-light)", paddingBottom: 6, display: "block" }}>
                  👤 ข้อมูลส่วนตัว (Profile Info)
                </span>

                {/* Avatar Upload */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={profilePic || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23F1F5F9'/><text x='50%' y='55%' font-family='sans-serif' font-size='32' text-anchor='middle' fill='%2394A3B8'>👤</text></svg>"}
                      alt="profile avatar"
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid var(--primary)",
                        boxShadow: "var(--shadow-md)"
                      }}
                    />
                    <label
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        background: "var(--primary)",
                        color: "white",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "var(--shadow-md)",
                        border: "2px solid white"
                      }}
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      <Plus size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textAlign: "center" }}>รองรับไฟล์รูปภาพ JPG, PNG, WebP (ไม่เกิน 2MB)</span>
                </div>

                {/* Nickname Input */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ชื่อเล่น / ชื่อเรียก</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="กรอกชื่อเล่นเพื่อแสดงแทนชื่อผู้ใช้"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary ripple-btn"
                  onClick={handleSaveProfile}
                  style={{ height: 44, fontSize: 13 }}
                >
                  บันทึกข้อมูลส่วนตัว
                </button>
              </div>

              {/* SECTION 2: CHANGE PASSWORD */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", borderBottom: "1.5px solid var(--loss-light)", paddingBottom: 6, display: "block" }}>
                  🔑 เปลี่ยนรหัสผ่านใหม่ (Change Password)
                </span>

                {/* Password Inputs */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">รหัสผ่านเดิม</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="ตั้งรหัสผ่านใหม่"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <button
                  className="btn ripple-btn"
                  onClick={handleChangePassword}
                  style={{ height: 44, fontSize: 13, background: "var(--loss)", color: "white", boxShadow: "0 4px 12px var(--loss-glow)", border: "none" }}
                >
                  ยืนยันเปลี่ยนรหัสผ่าน
                </button>
              </div>

              {/* SECTION 3: BACKUP & RESTORE */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", borderBottom: "1.5px solid var(--primary-light)", paddingBottom: 6, display: "block" }}>
                  💾 สำรองข้อมูล (Backup & Restore)
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary ripple-btn" style={{ height: 44, fontSize: 13, flex: 1 }} onClick={handleExport}>
                    <Download size={15} /> ส่งออก JSON
                  </button>
                  <label className="btn btn-secondary ripple-btn" style={{ height: 44, fontSize: 13, flex: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Upload size={15} /> นำเข้า JSON
                    <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
                  </label>
                </div>
              </div>

              {/* SECTION 4: AI OCR CONFIG */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", borderBottom: "1.5px solid var(--primary-light)", paddingBottom: 6, display: "block" }}>
                  🤖 ตั้งค่า AI OCR (Gemini API Key)
                </span>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    Google Gemini API Key
                    {geminiKey
                      ? <span style={{ fontSize: 10, background: "#E3FAF2", color: "#00B98A", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>✓ ตั้งค่าแล้ว</span>
                      : <span style={{ fontSize: 10, background: "#FFEBEB", color: "#FF4B55", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>⚠ ยังไม่ได้ตั้งค่า</span>
                    }
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="วาง API Key ที่นี่ (AQ.Ab8...)"
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      localStorage.setItem("gemini_api_key", e.target.value);
                    }}
                  />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6, background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                    <strong>วิธีรับ key ฟรี:</strong><br/>
                    1. เปิด <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700 }}>aistudio.google.com/app/apikey</a><br/>
                    2. กด <strong>"Create API key"</strong> → เลือก project<br/>
                    3. Copy key แล้ววางในช่องด้านบน<br/>
                    <span style={{ color: "var(--text-faint)", fontSize: 10 }}>🔒 Key เก็บในเครื่องคุณเท่านั้น ไม่ถูกส่งไปที่ server</span>
                  </div>
                </div>
              </div>


              {/* SECTION 5: DATA MANAGEMENT */}
              <div style={{
                background: "#FFF5F5",
                border: "1px solid #FEE2E2",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#EF4444", borderBottom: "1.5px solid #FCA5A5", paddingBottom: 6, display: "block" }}>
                  ⚠️ การจัดการข้อมูล (Data Management)
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    className="btn ripple-btn"
                    onClick={handleClearPortfolio}
                    style={{
                      height: 40,
                      fontSize: 12,
                      background: "white",
                      color: "#EF4444",
                      border: "1.5px solid #EF4444",
                      fontWeight: 700,
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    🗑️ ล้างเฉพาะข้อมูลพอร์ตหุ้น
                  </button>
                  <button
                    className="btn ripple-btn"
                    onClick={handleClearAllData}
                    style={{
                      height: 40,
                      fontSize: 12,
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      fontWeight: 700,
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
                    }}
                  >
                    🔥 ล้างข้อมูลทั้งหมดในระบบ (ลบทุกอย่าง)
                  </button>
                </div>
              </div>

              {/* SECTION 6: USER ACCOUNT & LOGOUT */}
              <div style={{
                background: "#FFF5F5",
                border: "1px solid #FEE2E2",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#EF4444", borderBottom: "1.5px solid #FCA5A5", paddingBottom: 6, display: "block" }}>
                  🚪 บัญชีผู้ใช้งาน (User Account)
                </span>
                <button
                  className="btn ripple-btn"
                  onClick={onLogout}
                  style={{
                    height: 44,
                    fontSize: 13,
                    background: "#EF4444",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                    border: "none",
                    fontWeight: 700,
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  <LogOut size={16} /> ออกจากระบบ (Logout)
                </button>
              </div>

            </div>

            {/* Close modal */}
            <div className="modal-footer" style={{ padding: "8px 24px 16px" }}>
              <button
                className="btn btn-secondary ripple-btn"
                onClick={() => setProfileModalOpen(false)}
                style={{ height: 44, fontSize: 13 }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
