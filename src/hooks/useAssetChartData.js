import { useState, useEffect, useRef, useMemo } from "react";
import { smoothPath, stepPath, smoothPoints, interpolateData } from "../components/charts/chartUtils";

/* ── EMA calculation (pure function, exported for reuse) ── */
export const calculateEMA = (data, period) => {
  if (!data || data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaValues = new Array(data.length);
  let firstValidIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i].value != null) { firstValidIdx = i; break; }
  }
  if (firstValidIdx === -1) return emaValues;
  emaValues[firstValidIdx] = data[firstValidIdx].value;
  let prevEMA = data[firstValidIdx].value;
  for (let i = firstValidIdx + 1; i < data.length; i++) {
    if (data[i] && data[i].value != null) {
      const emaVal = data[i].value * k + prevEMA * (1 - k);
      emaValues[i] = emaVal;
      prevEMA = emaVal;
    } else {
      emaValues[i] = null;
    }
  }
  return emaValues;
};

/**
 * useAssetChartData — derives all chart geometry from raw props.
 * Covers: EMA toggles, zoom/dim state, all useMemo computations, lot markers, ticks.
 * Event handlers live in useAssetChart.js.
 */
export function useAssetChartData({ candles, avgCost, lots, tf, isThai, exchangeRate, asset, zoomRange }) {
  const isCashAsset = asset?.type === "fiat" || asset?.category === "fiat";
  const [dims, setDims] = useState({ w: 600, h: 280 });

  // ── EMA toggles (persisted to localStorage) ───────────────────────────────
  const [showEma10, setShowEma10] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("ema_showEma10");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showEma20, setShowEma20] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("ema_showEma20");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showEma50, setShowEma50] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("ema_showEma50");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showEma200, setShowEma200] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("ema_showEma200");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => { localStorage.setItem("ema_showEma10", JSON.stringify(showEma10)); }, [showEma10]);
  useEffect(() => { localStorage.setItem("ema_showEma20", JSON.stringify(showEma20)); }, [showEma20]);
  useEffect(() => { localStorage.setItem("ema_showEma50", JSON.stringify(showEma50)); }, [showEma50]);
  useEffect(() => { localStorage.setItem("ema_showEma200", JSON.stringify(showEma200)); }, [showEma200]);

  // ── Padding / inner dimensions ────────────────────────────────────────────
  const { W, H, PAD_L, PAD_R, PAD_T, PAD_B } = useMemo(() => {
    const isMobile = dims.w < 500;
    return { W: dims.w, H: dims.h, PAD_L: isMobile ? 40 : 58, PAD_R: isMobile ? 12 : 24, PAD_T: 24, PAD_B: 40 };
  }, [dims]);
  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;

  // ── Zoomed slice ──────────────────────────────────────────────────────────
  const rawDisplayedCandles = useMemo(() => {
    if (!candles) return [];
    return zoomRange ? candles.slice(zoomRange.start, zoomRange.end + 1) : candles;
  }, [candles, zoomRange]);

  const visibleDurationMs = useMemo(() => {
    if (!rawDisplayedCandles || rawDisplayedCandles.length < 2) return 0;
    return new Date(rawDisplayedCandles[rawDisplayedCandles.length - 1].date).getTime() -
           new Date(rawDisplayedCandles[0].date).getTime();
  }, [rawDisplayedCandles]);

  const transactionsByDate = useMemo(() => {
    if (!lots) return {};
    const map = {};
    [...lots].filter(l => l && l.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((lot, i) => {
        const key = lot.date.split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push({ num: i + 1, type: lot.type || (lot.qty >= 0 ? "BUY" : "SELL"), qty: Math.abs(lot.qty), price: lot.price, date: lot.date, time: lot.time });
      });
    return map;
  }, [lots]);

  const hasMultipleYears = useMemo(() => {
    if (!rawDisplayedCandles || rawDisplayedCandles.length < 2) return false;
    return new Date(rawDisplayedCandles[0].date).getFullYear() !== new Date(rawDisplayedCandles[rawDisplayedCandles.length - 1].date).getFullYear();
  }, [rawDisplayedCandles]);

  // ── Main geometry useMemo ─────────────────────────────────────────────────
  const {
    pts, costPts, yMin, yMax, isUp, interpolatedData,
    renderPts, ema10Path, ema20Path, ema50Path, ema200Path,
  } = useMemo(() => {
    const empty = { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true, interpolatedData: [], renderPts: [], ema10Path: "", ema20Path: "", ema50Path: "", ema200Path: "" };
    if (!rawDisplayedCandles || rawDisplayedCandles.length < 2) return empty;

    const isCash = asset?.type === "fiat" || asset?.category === "fiat";
    const sortedLots = lots && lots.length > 0
      ? [...lots].sort((a, b) => new Date(a.date) - new Date(b.date))
      : [{ id: "virtual", date: "1970-01-01", qty: 1, price: avgCost }];

    // Full price timeline across all candles
    const fullPriceData = candles.map(c => {
      let priceUSD = 0;
      if (isCash) {
        priceUSD = asset.symbol === "USD" ? 1.0
          : ["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol) ? c.close : 1.0 / c.close;
      } else {
        priceUSD = isThai ? c.close / exchangeRate : c.close;
      }
      return { date: c.date, value: priceUSD };
    });

    let e10 = [], e20 = [], e50 = [], e200 = [];
    if (!isCash) {
      e10 = calculateEMA(fullPriceData, 10);
      e20 = calculateEMA(fullPriceData, 20);
      e50 = calculateEMA(fullPriceData, 50);
      e200 = calculateEMA(fullPriceData, 200);
    }

    const fullWithEmas = fullPriceData.map((d, i) => ({ ...d, ema10: e10[i] ?? null, ema20: e20[i] ?? null, ema50: e50[i] ?? null, ema200: e200[i] ?? null }));
    const rawPriceData = zoomRange ? fullWithEmas.slice(zoomRange.start, zoomRange.end + 1) : fullWithEmas;
    const interpPriceData = interpolateData(rawPriceData, visibleDurationMs);

    // Map lots to interpolated indices
    const lotsWithIdx = sortedLots.map(lot => {
      if (!lot || !lot.date) return null;
      const lotTime = new Date(lot.date + "T" + (lot.time || "00:00") + ":00.000Z").getTime();
      let bestIdx = 0, bestDiff = Infinity;
      interpPriceData.forEach((d, idx) => {
        const diff = Math.abs(new Date(d.date).getTime() - lotTime);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
      });
      return { ...lot, mappedIdx: bestIdx };
    }).filter(Boolean);

    const firstBuyIdx = lotsWithIdx[0]?.mappedIdx ?? 0;

    const getStats = (idx) => {
      let qty = 0, avgC = 0;
      lotsWithIdx.filter(l => l.mappedIdx <= idx).forEach(l => {
        const q = l.qty || 0, p = l.price || 0;
        if (q > 0) { const nc = qty * avgC + q * p; qty += q; avgC = qty > 0 ? nc / qty : 0; }
        else if (q < 0) { qty = Math.max(0, qty - Math.abs(q)); }
      });
      return { qty, avgCost: avgC };
    };

    const interpolatedData = interpPriceData.map((d, i) => {
      if (i < firstBuyIdx) return { date: d.date, value: d.value, ema10: d.ema10, ema20: d.ema20, ema50: d.ema50, ema200: d.ema200, cost: null, hasPurchased: false };
      const stats = getStats(i);
      let costUSD = stats.qty > 0
        ? (isCash ? stats.avgCost : (isThai ? stats.avgCost / exchangeRate : stats.avgCost))
        : (isThai ? avgCost / exchangeRate : avgCost);
      return { date: d.date, value: d.value, ema10: d.ema10, ema20: d.ema20, ema50: d.ema50, ema200: d.ema200, cost: costUSD, hasPurchased: true };
    });

    const valuesUSD = interpolatedData.map(d => d.value).filter(v => v != null);
    const costsUSD = interpolatedData.filter(d => d.hasPurchased).map(d => d.cost).filter(c => c != null);
    if (valuesUSD.length === 0) return { ...empty, interpolatedData };

    const isShortTF = tf === "1D" || tf === "5D" || tf === "1W";
    const activeEmas = [];
    if (!isCash) {
      interpolatedData.forEach(d => {
        if (showEma10 && d.ema10 != null) activeEmas.push(d.ema10);
        if (showEma20 && d.ema20 != null) activeEmas.push(d.ema20);
        if (showEma50 && d.ema50 != null) activeEmas.push(d.ema50);
        if (showEma200 && d.ema200 != null) activeEmas.push(d.ema200);
      });
    }

    const dataMin = isShortTF ? Math.min(...valuesUSD, ...activeEmas) : Math.min(...valuesUSD, ...costsUSD, ...activeEmas);
    const dataMax = isShortTF ? Math.max(...valuesUSD, ...activeEmas) : Math.max(...valuesUSD, ...costsUSD, ...activeEmas);
    const rangeVal = dataMax - dataMin || dataMin * 0.02 || 1;
    const pad = rangeVal * 0.05;
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;
    const yRange = yMax - yMin;

    const toY = v => PAD_T + ((yMax - v) / yRange) * iH;
    const toX = i => PAD_L + (i / (interpolatedData.length - 1)) * iW;

    const pts = interpolatedData.map((d, i) =>
      d.value == null ? null : { x: toX(i), y: toY(d.value), value: d.value, date: d.date, hasPurchased: d.hasPurchased });
    const costPts = interpolatedData.map((d, i) =>
      (!d.hasPurchased || d.cost == null) ? null : { x: toX(i), y: toY(d.cost), cost: d.cost, date: d.date });
    const renderPts = smoothPoints(pts, toY);

    const ema10Pts = !isCash ? interpolatedData.map((d, i) => d.ema10 != null ? { x: toX(i), y: toY(d.ema10) } : null).filter(Boolean) : [];
    const ema20Pts = !isCash ? interpolatedData.map((d, i) => d.ema20 != null ? { x: toX(i), y: toY(d.ema20) } : null).filter(Boolean) : [];
    const ema50Pts = !isCash ? interpolatedData.map((d, i) => d.ema50 != null ? { x: toX(i), y: toY(d.ema50) } : null).filter(Boolean) : [];
    const ema200Pts = !isCash ? interpolatedData.map((d, i) => d.ema200 != null ? { x: toX(i), y: toY(d.ema200) } : null).filter(Boolean) : [];

    const isUp = valuesUSD.length >= 2 ? valuesUSD[valuesUSD.length - 1] >= valuesUSD[0] : true;

    return {
      pts, costPts, yMin, yMax, isUp, interpolatedData, renderPts,
      ema10Path: smoothPath(ema10Pts), ema20Path: smoothPath(ema20Pts),
      ema50Path: smoothPath(ema50Pts), ema200Path: smoothPath(ema200Pts),
    };
  }, [rawDisplayedCandles, visibleDurationMs, avgCost, lots, isThai, exchangeRate, PAD_T, iH, PAD_L, iW, tf, asset, candles, zoomRange, showEma10, showEma20, showEma50, showEma200]);

  // ── Ticks ─────────────────────────────────────────────────────────────────
  const yTicks = useMemo(() => {
    if (yMax === yMin) return [];
    const rawStep = (yMax - yMin) / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude || 10;
    const ticks = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax + step * 0.01; v += step) {
      const y = PAD_T + ((yMax - v) / (yMax - yMin)) * iH;
      if (y >= PAD_T - 4 && y <= H - PAD_B + 4) ticks.push({ v, y });
    }
    return ticks;
  }, [yMin, yMax, PAD_T, iH, H, PAD_B]);

  const xTicks = useMemo(() => {
    if (!interpolatedData || interpolatedData.length < 2) return [];
    const isShortTF = tf === "1D" || tf === "5D" || tf === "1W";
    const isMobile = dims.w < 500;
    const maxTicks = isMobile ? (isShortTF ? 3 : 5) : (isShortTF ? 8 : 12);
    const count = Math.min(maxTicks, interpolatedData.length);
    const step = Math.floor((interpolatedData.length - 1) / Math.max(count - 1, 1));
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i === count - 1 ? interpolatedData.length - 1 : i * step, interpolatedData.length - 1);
      return { idx, x: PAD_L + (idx / (interpolatedData.length - 1)) * iW, date: interpolatedData[idx].date };
    });
  }, [interpolatedData, PAD_L, iW, tf, dims]);

  // ── Path derivations ──────────────────────────────────────────────────────
  const activePts = useMemo(() => renderPts.filter(Boolean), [renderPts]);
  const activeCostPts = useMemo(() => costPts.filter(Boolean), [costPts]);

  const linePath = useMemo(() => smoothPath(activePts), [activePts]);
  const costLinePath = useMemo(() => {
    if (activeCostPts.length === 0) return "";
    if (activeCostPts.length === 1) {
      const pt = activeCostPts[0];
      return `M ${pt.x.toFixed(2)},${pt.y.toFixed(2)} L ${(W - PAD_R).toFixed(2)},${pt.y.toFixed(2)}`;
    }
    return stepPath(activeCostPts);
  }, [activeCostPts, W, PAD_R]);

  const fillValueArea = useMemo(() => {
    if (!linePath || activePts.length < 2) return "";
    const first = activePts[0], last = activePts[activePts.length - 1];
    return linePath + ` L ${last.x},${H - PAD_B} L ${first.x},${H - PAD_B} Z`;
  }, [linePath, activePts, H, PAD_B]);

  const fillCostArea = useMemo(() => {
    if (!costLinePath || activeCostPts.length === 0) return "";
    const first = activeCostPts[0];
    const lastX = activeCostPts.length === 1 ? (W - PAD_R) : activeCostPts[activeCostPts.length - 1].x;
    return costLinePath + ` L ${lastX.toFixed(2)},${(H - PAD_B).toFixed(2)} L ${first.x.toFixed(2)},${(H - PAD_B).toFixed(2)} Z`;
  }, [costLinePath, activeCostPts, H, PAD_B, W, PAD_R]);

  const clipAboveCostPath = useMemo(() => {
    if (!costLinePath || activeCostPts.length === 0) return "";
    const first = activeCostPts[0];
    const lastX = activeCostPts.length === 1 ? (W - PAD_R) : activeCostPts[activeCostPts.length - 1].x;
    return costLinePath + ` L ${lastX.toFixed(2)},0 L ${first.x.toFixed(2)},0 Z`;
  }, [costLinePath, activeCostPts, W, PAD_R]);

  const clipBelowCostPath = useMemo(() => {
    if (!costLinePath || activeCostPts.length === 0) return "";
    const first = activeCostPts[0];
    const lastX = activeCostPts.length === 1 ? (W - PAD_R) : activeCostPts[activeCostPts.length - 1].x;
    return costLinePath + ` L ${lastX.toFixed(2)},${(H - PAD_B).toFixed(2)} L ${first.x.toFixed(2)},${(H - PAD_B).toFixed(2)} Z`;
  }, [costLinePath, activeCostPts, H, PAD_B, W, PAD_R]);

  const clipAboveValuePath = useMemo(() => {
    if (!linePath || activePts.length < 2) return "";
    const first = activePts[0], last = activePts[activePts.length - 1];
    return linePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [linePath, activePts]);

  // ── Lot markers ───────────────────────────────────────────────────────────
  const lotMarkers = useMemo(() => {
    if (!lots || !candles || candles.length < 2 || !interpolatedData || interpolatedData.length < 2) return [];
    const sorted = [...lots].filter(l => l && l.date)
      .sort((a, b) => new Date(a.date + "T" + (a.time || "00:00") + ":00.000Z") - new Date(b.date + "T" + (b.time || "00:00") + ":00.000Z"));

    const dispStart = new Date(interpolatedData[0].date).getTime();
    const dispEnd = new Date(interpolatedData[interpolatedData.length - 1].date).getTime();

    const rawMarkers = [];
    sorted.forEach((lot, i) => {
      const lotTime = new Date(lot.date + "T" + (lot.time || "00:00") + ":00.000Z").getTime();
      if (lotTime < dispStart || lotTime > dispEnd) return;
      let bestIdx = -1, bestDiff = Infinity;
      interpolatedData.forEach((d, idx) => {
        const diff = Math.abs(new Date(d.date).getTime() - lotTime);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
      });
      if (bestIdx !== -1) {
        rawMarkers.push({ x: PAD_L + (bestIdx / (interpolatedData.length - 1)) * iW, num: i + 1, isBuy: (lot.qty || 0) >= 0, lot });
      }
    });

    rawMarkers.sort((a, b) => a.x - b.x);
    const groups = [];
    rawMarkers.forEach(m => {
      const last = groups[groups.length - 1];
      if (last && Math.abs(m.x - last.xSum / last.count) < 18) {
        last.xSum += m.x; last.count++; last.nums.push(m.num);
        if (m.isBuy) last.buysCount++; else last.sellsCount++;
        last.txs.push(m);
      } else {
        groups.push({ xSum: m.x, count: 1, nums: [m.num], buysCount: m.isBuy ? 1 : 0, sellsCount: m.isBuy ? 0 : 1, txs: [m] });
      }
    });

    return groups.map(g => {
      const x = g.xSum / g.count;
      const colorType = g.buysCount > 0 && g.sellsCount === 0 ? "buy" : g.buysCount === 0 && g.sellsCount > 0 ? "sell" : "mixed";
      g.nums.sort((a, b) => a - b);
      let consec = true;
      for (let k = 1; k < g.nums.length; k++) { if (g.nums[k] !== g.nums[k - 1] + 1) { consec = false; break; } }
      const label = g.nums.length === 1 ? String(g.nums[0])
        : consec ? `${g.nums[0]}-${g.nums[g.nums.length - 1]}` : g.nums.join(",");
      return { x, colorType, label, numsCount: g.nums.length, txs: g.txs };
    });
  }, [lots, candles, interpolatedData, PAD_L, iW, isThai, exchangeRate]);

  return {
    dims, setDims, isCashAsset,
    showEma10, setShowEma10, showEma20, setShowEma20, showEma50, setShowEma50, showEma200, setShowEma200,
    W, H, PAD_L, PAD_R, PAD_T, PAD_B, iW, iH,
    pts, costPts, yMin, yMax, isUp, interpolatedData, renderPts,
    ema10Path, ema20Path, ema50Path, ema200Path,
    yTicks, xTicks,
    activePts, activeCostPts,
    linePath, costLinePath,
    fillValueArea, fillCostArea,
    clipAboveCostPath, clipBelowCostPath, clipAboveValuePath,
    lotMarkers,
    visibleDurationMs, hasMultipleYears, transactionsByDate,
  };
}
