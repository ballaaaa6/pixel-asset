import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, RefreshCw, LogOut, TrendingUp, TrendingDown,
  Trash2, Download, Upload, PieChart, Star, BarChart2, Pencil, X
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


function AssetLogo({ symbol, category, style }) {
  const [error, setError] = useState(false);

  const cleanSymbol = symbol ? symbol.split(".")[0].toUpperCase() : "";

  const logoUrl = useMemo(() => {
    if (!symbol) return null;
    const cat = category || "stock";
    if (cat === "fiat") {
      const getCurrencyCountryCode = (sym) => {
        const map = {
          THB: "th", USD: "us", EUR: "eu", JPY: "jp", GBP: "gb",
          AUD: "au", CAD: "ca", SGD: "sg", CHF: "ch", CNY: "cn",
          HKD: "hk", KRW: "kr", INR: "in", NZD: "nz", SEK: "se",
          NOK: "no", DKK: "dk", MYR: "my", IDR: "id", PHP: "ph",
          VND: "vn", TWD: "tw", BRL: "br", RUB: "ru", ZAR: "za",
          TRY: "tr", MXN: "mx", PLN: "pl", SAR: "sa", AED: "ae",
          KWD: "kw", QAR: "qa", OMR: "om", BHD: "bh", ILS: "il"
        };
        return map[sym] || sym.slice(0, 2).toLowerCase();
      };
      return `https://flagcdn.com/w80/${getCurrencyCountryCode(symbol)}.png`;
    }
    if (cat === "crypto") {
      return `https://assets.coincap.io/assets/icons/${cleanSymbol.toLowerCase()}@2x.png`;
    }
    if (cat === "gold" || symbol === "XAU") {
      return `https://images.financialmodelingprep.com/symbol/GLD.png`;
    }
    
    // Stock (Clearbit Logo API with Domain Mapping)
    const getStockDomain = (sym) => {
      const map = {
        AAPL: "apple.com",
        MSFT: "microsoft.com",
        GOOG: "google.com",
        GOOGL: "google.com",
        AMZN: "amazon.com",
        META: "meta.com",
        TSLA: "tesla.com",
        NVDA: "nvidia.com",
        NFLX: "netflix.com",
        SNDK: "sandisk.com",
        AMD: "amd.com",
        INTC: "intel.com",
        QCOM: "qualcomm.com",
        BABA: "alibaba.com",
        COIN: "coinbase.com",
        PYPL: "paypal.com",
        SQ: "block.xyz",
        DIS: "disney.com",
        V: "visa.com",
        MA: "mastercard.com",
        NKE: "nike.com",
        SBUX: "starbucks.com",
        KO: "cocacola.com",
        PEP: "pepsico.com",
        WMT: "walmart.com",
        JPM: "jpmorganchase.com",
        BAC: "bankofamerica.com",
        XOM: "exxonmobil.com",
        CVX: "chevron.com",
        JNJ: "jnj.com",
        PG: "pg.com",
        MRK: "merck.com",
        ABV: "abbvie.com",
        LLY: "lilly.com",
        PFE: "pfizer.com",
        WDC: "westerndigital.com",
        PTT: "ptt.co.th",
        KBANK: "kasikornbank.com",
        CPALL: "cpall.co.th",
        AOT: "airportthai.co.th",
        BDMS: "bdms.co.th",
        ADVANC: "ais.co.th",
        SCB: "scb.co.th",
        BBL: "bangkokbank.com",
        GULF: "gulf.co.th",
        CPN: "cpn.co.th",
        SCC: "scg.com",
        BANPU: "banpu.com",
        TRUE: "true.th"
      };
      return map[sym] || `${sym.toLowerCase()}.com`;
    };
    
    return `https://logo.clearbit.com/${getStockDomain(cleanSymbol)}`;
  }, [symbol, category, cleanSymbol]);

  if (error || !logoUrl) {
    return (
      <div className={`asset-icon-wrapper ${category || "stock"}`} style={style}>
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={symbol}
      onError={() => setError(true)}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        objectFit: "contain",
        background: "#FFFFFF",
        padding: 4,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
        flexShrink: 0,
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
  const [hovered, setHovered] = useState(null); // { idx, x, y, value, date }
  const [dims, setDims] = useState({ w: 800, h: 220 });

  // Responsive resizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: Math.min(300, Math.max(180, e.contentRect.width * 0.32)) });
    });
    if (svgRef.current) obs.observe(svgRef.current);
    return () => obs.disconnect();
  }, []);

  const W = dims.w;
  const H = dims.h;
  const PAD_L = 58;
  const PAD_R = 16;
  const PAD_T = 24;
  const PAD_B = 40;

  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;

  const RANGES = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

  // Unique lot purchase dates for markers
  const lotMarkers = useMemo(() => {
    if (!assets || !history || history.length < 2) return [];
    const markers = [];
    assets.forEach(asset => {
      (asset.lots || []).forEach(lot => {
        // Find closest date in history
        let bestIdx = -1, bestDiff = Infinity;
        history.forEach((h, i) => {
          const diff = Math.abs(new Date(h.date) - new Date(lot.date + "T00:00:00"));
          if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
        });
        if (bestIdx >= 0 && bestDiff < 7 * 86400000) {
          markers.push({ date: lot.date, symbol: asset.symbol, idx: bestIdx });
        }
      });
    });
    // Deduplicate by index (if multiple buys on same date)
    const seenIdx = new Set();
    const uniqueMarkers = [];
    markers.forEach(m => {
      if (!seenIdx.has(m.idx)) {
        seenIdx.add(m.idx);
        const x = PAD_L + (m.idx / (history.length - 1)) * iW;
        uniqueMarkers.push({ ...m, x });
      }
    });
    return uniqueMarkers;
  }, [assets, history, iW]);

  const { pts, costPts, yMin, yMax, isUp, color } = useMemo(() => {
    if (!history || history.length < 2) return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true, color: "var(--gain)" };
    
    const vals = history.map(h => h.value);
    const costs = history.map(h => h.cost || 0);

    const isShortTF = range === "1D" || range === "5D" || range === "1W";
    const dataMin = isShortTF ? Math.min(...vals) : Math.min(...vals, ...costs.filter(c => c > 0));
    const dataMax = isShortTF ? Math.max(...vals) : Math.max(...vals, ...costs);
    const rangeVal = dataMax - dataMin || dataMin * 0.02 || 1;

    // Adaptive padding (shows movement clearly)
    const pad = rangeVal * 0.12;
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;
    const yRange = yMax - yMin;

    const toY = (v) => PAD_T + ((yMax - v) / yRange) * iH;
    const toX = (i) => PAD_L + (i / (history.length - 1)) * iW;

    const pts = history.map((h, i) => ({ x: toX(i), y: toY(h.value), value: h.value, date: h.date }));
    const costPts = history.map((h, i) => ({ x: toX(i), y: toY(h.cost || 0), cost: h.cost || 0, date: h.date }));

    const isUp = vals[vals.length - 1] >= vals[0];
    const color = isUp ? "var(--gain)" : "var(--loss)";

    return { pts, costPts, yMin, yMax, isUp, color, toY };
  }, [history, iH, iW, range]);

  const linePath = useMemo(() => smoothPath(pts), [pts]);
  const costLinePath = useMemo(() => stepPath(costPts), [costPts]);

  // Gain & Loss fill paths
  const fillValueArea = useMemo(() => {
    if (!linePath || pts.length < 2) return "";
    const first = pts[0], last = pts[pts.length - 1];
    const bottomY = H - PAD_B;
    return linePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [linePath, pts, H]);

  const fillCostArea = useMemo(() => {
    if (!costLinePath || costPts.length < 2) return "";
    const first = costPts[0], last = costPts[costPts.length - 1];
    const bottomY = H - PAD_B;
    return costLinePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [costLinePath, costPts, H]);

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
  }, [costLinePath, costPts, H]);

  const clipAboveValuePath = useMemo(() => {
    if (!linePath || pts.length < 2) return "";
    const first = pts[0], last = pts[pts.length - 1];
    return linePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [linePath, pts]);

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || pts.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left - PAD_L) / iW;
    const idx = Math.max(0, Math.min(Math.round(relX * (pts.length - 1)), pts.length - 1));
    if (history[idx]) {
      setHovered({
        idx,
        x: pts[idx].x,
        y: pts[idx].y,
        costY: costPts[idx]?.y,
        value: history[idx].value,
        cost: history[idx].cost || 0,
        date: history[idx].date
      });
    }
  }, [pts, costPts, history, iW]);

  const handleMouseLeave = () => setHovered(null);

  if (!history || history.length < 2) {
    return (
      <div>
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

  const startVal = history[0]?.value || 0;
  const endVal = history[history.length - 1]?.value || 0;
  const totalChange = endVal - startVal;
  const totalChangePct = startVal > 0 ? (totalChange / startVal) * 100 : 0;

  // Axis labels
  const dateLabels = (() => {
    if (history.length <= 1) return [];
    const count = Math.min(5, history.length);
    const step = Math.floor(history.length / count);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i * step, history.length - 1);
      return { idx, x: PAD_L + (idx / (history.length - 1)) * iW, date: history[idx].date };
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

  const latestCost = history[history.length - 1]?.cost || 0;
  const latestVal = history[history.length - 1]?.value || 0;
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
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ cursor: "crosshair", position: "relative" }}>
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
              <circle cx={m.x} cy={PAD_T + 10} r="6" fill="#F59E0B" />
              <text x={m.x} y={PAD_T + 13} textAnchor="middle" fontSize="8" fill="white" fontWeight="800" fontFamily="Outfit,sans-serif">
                {m.symbol.slice(0, 1)}
              </text>
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

          {/* X-axis Labels */}
          {dateLabels.map(({ x, date }, i) => (
            <text key={i} x={x} y={H - PAD_B + 18} textAnchor="middle" fontSize="11"
              fill="var(--text-muted)" fontFamily="var(--font-family)" fontWeight="700">
              {(() => {
                const d = new Date(date);
                if (range === "1D") return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                if (range === "5D" || range === "1W") return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
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
          return (
            <div className="chart-tooltip-box" style={{
              top: Math.max(0, (hovered.y / H) * H - 76) + "px",
              left: (hovered.x / W) * 100 + "%",
              opacity: 1,
              transform: "translateX(-50%)",
              zIndex: 100
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
              </div>
            </div>
          );
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

function DonutChart({ segments, totalAssets, hasAssets }) {
  const R = 68, CX = 80, CY = 80, SW = 18;
  const circumference = 2 * Math.PI * R;

  // Always reserve fixed height to prevent layout shift
  if (!segments || segments.length === 0) {
    return (
      <div className="donut-card-body">
        <div className="chart-container">
          <div className="donut-wrapper">
            <svg viewBox="0 0 160 160" className="donut-chart-svg">
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={SW} />
            </svg>
            <div className="donut-center-label">
              <div className="donut-center-count" style={{ color: "var(--text-faint)" }}>
                {totalAssets > 0 ? totalAssets : "—"}
              </div>
              <div className="donut-center-text">
                {totalAssets > 0 ? "กำลังโหลด..." : "ว่างเปล่า"}
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

  // Compute slices with correct strokeDashoffset
  // SVG circle starts at 3 o'clock → we rotate SVG -90deg via CSS to start at 12 o'clock
  // strokeDashoffset = circumference - cumulative_offset so each segment picks up where the last ended
  let cumulative = 0;
  const slices = segments.map((seg, i) => {
    const dash = (seg.pct / 100) * circumference;
    const gap  = circumference - dash;
    const strokeDashoffset = circumference - cumulative;
    cumulative += dash;
    return { ...seg, dash, gap, strokeDashoffset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  return (
    <div className="donut-card-body">
      <div className="chart-container">
        <div className="donut-wrapper">
          {/* rotate -90deg so segments start at top */}
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
                strokeWidth={SW}
                strokeLinecap="butt"
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={s.strokeDashoffset}
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
              />
            ))}
            {/* White center hole */}
            <circle cx={CX} cy={CY} r={R - SW / 2 - 2} fill="white" />
          </svg>
          <div className="donut-center-label">
            <div className="donut-center-count">{totalAssets}</div>
            <div className="donut-center-text">สินทรัพย์</div>
          </div>
        </div>
        <div className="legend-list">
          {slices.map((s, i) => (
            <div key={i} className="legend-item">
              <div className="legend-color" style={{ background: s.color }} />
              <span className="legend-name">{s.label}</span>
              <span className="legend-pct" style={{ color: s.color, fontWeight: 800 }}>{s.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   KPI CARDS ROW
═══════════════════════════════════════════════════════════════ */
function KPIRow({ totalUSD, totalTHB, todayChange, todayChangePct, totalGain, totalGainPct, bestAsset, loading }) {
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
        <div className="kpi-value" style={{ color: todayUp ? "var(--gain)" : "var(--loss)" }}>
          {todayChange !== 0 ? (todayUp ? "+" : "") + fmt.usd(Math.abs(todayChange)) : "—"}
        </div>
        {todayChange !== 0 && (
          <div className={`kpi-badge ${todayUp ? "up" : "down"}`}>
            {todayUp ? "▲" : "▼"} {fmt.pct(todayChangePct)}
          </div>
        )}
      </div>

      <div className={`kpi-card ${totalUp ? "gain-card" : "loss-card"}`}>
        <div className="kpi-label">📊 กำไร/ขาดทุนรวม</div>
        <div className="kpi-value" style={{ color: totalUp ? "var(--gain)" : "var(--loss)" }}>
          {totalGain !== 0 ? (totalUp ? "+" : "") + fmt.usd(Math.abs(totalGain)) : "—"}
        </div>
        {totalGain !== 0 && (
          <div className={`kpi-badge ${totalUp ? "up" : "down"}`}>
            {totalUp ? "▲" : "▼"} {fmt.pct(totalGainPct)}
          </div>
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
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [sparklineLoading, setSparklineLoading] = useState(false);
  const [autoRefresh, setAutoRefresh]     = useState(true);
  const [chartRange, setChartRange]       = useState("1M");
  const [sortConfig, setSortConfig]       = useState({ key: null, dir: "asc" });
  const [priceFlash, setPriceFlash]       = useState({});   // { SYM: "up"|"down" }
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingAsset, setEditingAsset]   = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [portfolioName, setPortfolioName] = useState(() => localStorage.getItem(`portfolio_name_${user.username}`) || "StockVault");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName]           = useState("");

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setPortfolioName(trimmed);
      localStorage.setItem(`portfolio_name_${user.username}`, trimmed);
    }
    setIsEditingName(false);
  };

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePic, setProfilePic]             = useState(() => localStorage.getItem(`profile_pic_${user.username}`) || "");
  const [nickname, setNickname]                 = useState(() => localStorage.getItem(`profile_nickname_${user.username}`) || "");

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

  const handleSaveProfile = () => {
    try {
      const trimmedNickname = newNickname.trim();
      localStorage.setItem(`profile_nickname_${user.username}`, trimmedNickname);
      setNickname(trimmedNickname);
      localStorage.setItem(`profile_pic_${user.username}`, profilePic);
      showToast("บันทึกข้อมูลโปรไฟล์สำเร็จ!", "success");
      setProfileModalOpen(false);
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
      const res = await fetch(`/api/prices?sparkline=${encodeURIComponent(syms.join(","))}&tf=${range}`);
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

    // Find a reference symbol to get dates (uppercase matching)
    const refSym = Object.keys(sparklines).find(k => sparklines[k]?.dates?.length > 1);
    if (!refSym) { setPortfolioHistory([]); return; }

    const refDates = sparklines[refSym].dates;
    let history = refDates.map((date, dayIdx) => {
      let totalUSD = 0;
      let totalCostUSD = 0;

      assets.forEach(asset => {
        // Fallback to virtual lot if lots are empty/undefined (older data format or imported backup)
        const assetLots = asset.lots && asset.lots.length > 0
          ? asset.lots
          : [{ id: "virtual", date: "1970-01-01", qty: asset.qty, price: (asset.avgCost ?? asset.avgPrice ?? 0) }];

        // Filter lots purchased on or before this day
        const lotsBeforeOrOnDate = assetLots.filter(lot => lot && lot.date && lot.date <= date.split("T")[0]);
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
            const symData = sparklines[ticker];
            if (symData) {
              const targetIdx = symData.dates.indexOf(date);
              const priceVal = targetIdx >= 0 ? symData.closes[targetIdx] : symData.closes[dayIdx];
              if (priceVal != null && priceVal > 0) {
                if (["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol)) {
                  priceUSD = priceVal;
                } else {
                  priceUSD = 1.0 / priceVal;
                }
              } else {
                priceUSD = asset.symbol === "THB" ? 1.0 / (exchangeRate || 35.0) : 1.0;
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

        const symData = sparklines[asset.symbol.toUpperCase()];
        if (!symData) return;
        const targetIdx = symData.dates.indexOf(date);
        const price = targetIdx >= 0 ? symData.closes[targetIdx] : symData.closes[dayIdx];

        if (price != null && price > 0) {
          const priceUSD = isThai ? price / exchangeRate : price;
          const valueUSD = priceUSD * qtyOnDate;
          totalUSD += valueUSD;
          totalCostUSD += costOnDateUSD;
        }
      });

      return { date, value: totalUSD, cost: totalCostUSD };
    }).filter(d => d.value > 0);

    // Filter out leading flatlines before the first major purchase
    let earliestDate = null;
    const hasNonCash = assets.some(a => a.type !== "fiat" && a.category !== "fiat");
    assets.forEach(asset => {
      const isCash = asset.type === "fiat" || asset.category === "fiat";
      if (hasNonCash && isCash) return;
      const assetLots = asset.lots && asset.lots.length > 0 ? asset.lots : [];
      assetLots.forEach(lot => {
        if (lot && lot.date && lot.date !== "1970-01-01") {
          if (!earliestDate || lot.date < earliestDate) {
            earliestDate = lot.date;
          }
        }
      });
    });

    if (earliestDate) {
      const earliestStr = earliestDate.split("T")[0];
      history = history.filter(d => d.date.split("T")[0] >= earliestStr);
    }

    // If there is only 1 historical point (e.g. bought asset today), pad it to the day before
    // to prevent the chart from disappearing due to length < 2 guard!
    if (history.length === 1) {
      const singlePoint = history[0];
      const prevDate = new Date(new Date(singlePoint.date) - 86400000).toISOString().split("T")[0];
      history.unshift({ date: prevDate, value: singlePoint.value, cost: singlePoint.cost });
    }

    setPortfolioHistory(history);
  }, [sparklines, assets, exchangeRate]);

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
  const { totalUSD, totalCostUSD, todayChangeUSD, bestAsset, sortedAssets, donutSegments } = useMemo(() => {
    if (!assets.length) return { totalUSD: 0, totalCostUSD: 0, todayChangeUSD: 0, bestAsset: null, sortedAssets: [], donutSegments: [] };

    let totVal = 0, totCost = 0, totToday = 0;
    let bestSym = null, bestPct = -Infinity;

    const computed = assets.map(a => {
      const c = computeAsset(a);
      totVal   += c.valueUSD;
      totCost  += c.costUSD;
      totToday += c.todayChg;
      if (c.gainPct > bestPct && (a.avgCost > 0 || a.avgPrice > 0)) { bestPct = c.gainPct; bestSym = a; }
      return { ...a, ...c };
    });

    // Sort
    const sorted = [...computed].sort((a, b) => {
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
    computed.forEach(a => {
      const cat = a.category || "stock";
      if (!catMap[cat]) catMap[cat] = 0;
      catMap[cat] += a.valueUSD;
    });
    const donut = Object.entries(catMap)
      .map(([cat, val]) => ({ label: CATEGORY_LABELS[cat] || cat, pct: totVal > 0 ? (val / totVal) * 100 : 0 }))
      .filter(s => s.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    return {
      totalUSD: totVal,
      totalCostUSD: totCost,
      todayChangeUSD: totToday,
      bestAsset: bestSym ? { symbol: bestSym.symbol, pct: bestPct } : null,
      sortedAssets: sorted,
      donutSegments: donut,
    };
  }, [assets, prices, exchangeRate, sortConfig, computeAsset]);

  const totalGainUSD = totalUSD - totalCostUSD;
  const totalGainPct = totalCostUSD > 0 ? (totalGainUSD / totalCostUSD) * 100 : 0;
  const todayChangePct = totalCostUSD > 0 ? (todayChangeUSD / (totalUSD - todayChangeUSD)) * 100 : 0;

  /* ── SAVE ASSET (Purchase Lots System) ── */
  const handleSaveAsset = async (formData) => {
    // AssetModal sends: symbol, name, type (=category), qty, avgPrice (=price per unit), date
    const sym      = (formData.symbol || "").trim().toUpperCase();
    const name     = (formData.name   || sym).trim();
    const newQty   = parseFloat(formData.qty);
    const newPrice = parseFloat(formData.avgPrice ?? formData.price ?? 0);
    const buyDate  = formData.date || new Date().toISOString().split("T")[0];
    const category = formData.type ?? formData.category ?? "stock";

    if (!sym)                              { showToast("เลือกสินทรัพย์ก่อนนะครับ", "error"); return; }
    if (isNaN(newQty) || newQty <= 0)     { showToast("ใส่จำนวนให้ถูกต้อง", "error"); return; }
    if (isNaN(newPrice) || newPrice < 0)  { showToast("ใส่ราคาทุนให้ถูกต้อง", "error"); return; }

    try {
      let updatedAssets = [...assets];
      const existingIdx = updatedAssets.findIndex(a => a.symbol === sym);

      /* ── New lot to add ── */
      const newLot = {
        id:    `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date:  buyDate,
        qty:   newQty,
        price: newPrice,
      };

      if (existingIdx >= 0) {
        /* ── Buy more: append lot and recompute totals ── */
        const existing  = updatedAssets[existingIdx];
        const oldLots   = existing.lots || [];
        const allLots   = [...oldLots, newLot];
        const totalQty  = allLots.reduce((s, l) => s + l.qty, 0);
        const totalCost = allLots.reduce((s, l) => s + l.qty * l.price, 0);
        const avgCost   = totalQty > 0 ? totalCost / totalQty : 0;

        updatedAssets[existingIdx] = {
          ...existing,
          lots:    allLots,
          qty:     totalQty,
          avgCost: avgCost,
        };
        showToast(
          `✅ ซื้อเพิ่ม ${sym} ${fmt.qty(newQty)} หน่วย — ราคาเฉลี่ยใหม่: ${fmt.usd(avgCost)}`,
          "success"
        );
      } else {
        /* ── Brand new asset ── */
        updatedAssets.push({
          id:       Date.now().toString(),
          symbol:   sym,
          name,
          category,
          lots:     [newLot],
          qty:      newQty,
          avgCost:  newPrice,
        });
        showToast(`✅ เพิ่ม ${sym} เข้าพอร์ตแล้ว`, "success");
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
    } catch (err) {
      showToast("บันทึกไม่สำเร็จ: " + err.message, "error");
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
            <div className="exchange-badge">
              💱 1 USD = <strong>{exchangeRate.toFixed(2)}</strong> THB
            </div>
            <div
              className="user-profile-btn"
              onClick={() => setProfileModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 10,
                background: "var(--primary-light)",
                transition: "var(--transition)",
                userSelect: "none"
              }}
              title="โปรไฟล์ของฉัน"
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
            <button className="btn-logout ripple-btn" onClick={onLogout}>ออกจากระบบ</button>
          </div>
        </div>
      </nav>

      <div className="app-container">

        {/* ── KPI CARDS ROW ── */}
        <KPIRow
          totalUSD={hasPrices ? totalUSD : null}
          totalTHB={hasPrices ? totalUSD * exchangeRate : null}
          todayChange={hasPrices ? todayChangeUSD : 0}
          todayChangePct={hasPrices ? todayChangePct : 0}
          totalGain={hasPrices ? totalGainUSD : 0}
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
                  <div className={`hero-usd${priceFlash["PORTFOLIO"] ? " num-tick" : ""}`}>
                    {fmt.usd(totalUSD)}
                  </div>
                  <div className="hero-thb">{fmt.thb(totalUSD * exchangeRate)}</div>
                  {totalCostUSD > 0 && (
                    <div className={`hero-pnl ${totalGainUSD >= 0 ? "up" : "down"}`}>
                      {totalGainUSD >= 0 ? "▲" : "▼"}
                      {fmt.usd(Math.abs(totalGainUSD))}
                      <span style={{ opacity: 0.8, fontSize: 12 }}>({fmt.pct(totalGainPct)})</span>
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
                  <span className="hero-meta-label">สินทรัพย์</span>
                  <span className="hero-meta-value">{assets.length} รายการ</span>
                </div>
                <div className="hero-meta-item" style={{ textAlign: "right" }}>
                  <span className="hero-meta-label">ต้นทุนรวม</span>
                  <span className="hero-meta-value">{fmt.usd(totalCostUSD)}</span>
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
                  <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 600 }}>กำไร/ขาดทุนวันนี้</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: todayChangeUSD >= 0 ? "#6EE7B7" : "#FCA5A5" }}>
                    {todayChangeUSD >= 0 ? "+" : ""}{fmt.usd(todayChangeUSD)}
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
                totalAssets={assets.length}
                hasAssets={assets.length > 0}
              />
            </div>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Portfolio Performance Chart */}
            <div className="card stagger-2">
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
                <div className="section-title">
                  📋 สินทรัพย์ของฉัน
                  {assets.length > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", background: "#F1F5F9", padding: "2px 10px", borderRadius: 8 }}>
                      {assets.length} รายการ
                    </span>
                  )}
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
              {assets.length === 0 ? (
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
                                    <MarketBadge state={pData?.marketState} />
                                    {/* Weight bar */}
                                    <div className="weight-bar-track" title={`${weightPct.toFixed(1)}% ของพอร์ต`}>
                                      <div className="weight-bar-fill" style={{ width: `${Math.min(100, weightPct)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Price + Sparkline */}
                              <td style={{ textAlign: "right" }}>
                                {!hasPrices ? (
                                  <div className="skeleton skeleton-text" style={{ width: 70, height: 16, marginLeft: "auto" }} />
                                ) : isCashAsset ? (
                                  <span style={{ color: "var(--text-faint)", fontSize: 13 }}>—</span>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                                    {!isCashAsset && sparklines[asset.symbol]?.closes && (
                                      <SparklineChart closes={sparklines[asset.symbol].closes} />
                                    )}
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
                                  <button className="btn-delete" title="ซื้อเพิ่ม" style={{ color: "var(--primary)" }}
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

                          {/* Sparkline full row */}
                          {!isCashAsset && sp && (
                            <div className="mobile-sparkline">
                              <SparklineChart closes={sp} />
                              <span style={{ fontSize: 11, marginLeft: 8, color: sp[sp.length-1] >= sp[0] ? "var(--gain)" : "var(--loss)", fontWeight: 700 }}>
                                {sp.length > 1 ? fmt.pct(((sp[sp.length-1] - sp[0]) / sp[0]) * 100) : ""} (7 วัน)
                              </span>
                            </div>
                          )}

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
                              <Plus size={13} /> ซื้อเพิ่ม
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

        {/* Backup & Restore Card (Very Bottom) */}
        <div className="card stagger-4" style={{ marginTop: 16 }}>
          <div className="card-section-title">💾 สำรองข้อมูล</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary ripple-btn" style={{ height: 44, fontSize: 13, flex: 1 }} onClick={handleExport}>
              <Download size={15} /> ส่งออก JSON
            </button>
            <label className="btn btn-secondary ripple-btn" style={{ height: 44, fontSize: 13, flex: 1, cursor: "pointer" }}>
              <Upload size={15} /> นำเข้า JSON
              <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
            </label>
          </div>

          {/* Auto-refresh toggle */}
          <div style={{ marginTop: 14 }}>
            <label className="auto-refresh-toggle" onClick={() => setAutoRefresh(p => !p)}>
              <div className={`toggle-track${autoRefresh ? " on" : ""}`}>
                <div className="toggle-thumb" />
              </div>
              <span>{autoRefresh ? "🔄 รีเฟรชอัตโนมัติ (30 วิ)" : "⏸ หยุดรีเฟรช"}</span>
            </label>
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
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* ── PROFILE MODAL ── */}
      {profileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">👤 โปรไฟล์ของฉัน</span>
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
                  📝 ข้อมูลส่วนตัว
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
                  🔑 เปลี่ยนรหัสผ่านใหม่
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
                  style={{ height: 44, fontSize: 13, background: "var(--loss)", color: "white", boxShadow: "0 4px 12px var(--loss-glow)" }}
                >
                  ยืนยันเปลี่ยนรหัสผ่าน
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
    </div>
  );
}
