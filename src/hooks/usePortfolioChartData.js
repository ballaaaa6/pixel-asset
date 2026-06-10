import { useState, useMemo } from "react";
import { smoothPath, stepPath, smoothPoints, interpolateData } from "../components/charts/chartUtils";
import { calculatePortfolioHistoryCost } from "../utils/assetHelpers";

/**
 * usePortfolioChartData — derives all portfolio chart geometry from raw history, assets, and prices.
 */
export function usePortfolioChartData({ history, range, assets, exchangeRate, prices, zoomRange }) {
  const [dims, setDims] = useState({ w: 800, h: 350 });

  const { W, H, PAD_L, PAD_R, PAD_T, PAD_B, isMobile } = useMemo(() => {
    const w = dims.w;
    const h = dims.h;
    const isMobile = w < 500;
    return {
      W: w,
      H: h,
      isMobile,
      PAD_L: isMobile ? 30 : 42,
      PAD_R: isMobile ? 12 : 24,
      PAD_T: isMobile ? 4 : 6,
      PAD_B: isMobile ? 18 : 24
    };
  }, [dims]);

  const iW = W - PAD_L - PAD_R;
  const iH = H - PAD_T - PAD_B;

  const rawDisplayedData = useMemo(() => {
    if (!history) return [];
    if (!zoomRange) return history;
    return history.slice(zoomRange.start, zoomRange.end + 1);
  }, [history, zoomRange]);

  const visibleDurationMs = useMemo(() => {
    if (!rawDisplayedData || rawDisplayedData.length < 2) return 0;
    const firstTime = new Date(rawDisplayedData[0].date).getTime();
    const lastTime = new Date(rawDisplayedData[rawDisplayedData.length - 1].date).getTime();
    return lastTime - firstTime;
  }, [rawDisplayedData]);

  const displayedData = useMemo(() => {
    const interpolated = interpolateData(rawDisplayedData, visibleDurationMs);
    return calculatePortfolioHistoryCost(interpolated, assets, prices, exchangeRate);
  }, [rawDisplayedData, visibleDurationMs, assets, prices, exchangeRate]);

  const hasMultipleYears = useMemo(() => {
    if (!rawDisplayedData || rawDisplayedData.length < 2) return false;
    const firstYear = new Date(rawDisplayedData[0].date).getFullYear();
    const lastYear = new Date(rawDisplayedData[rawDisplayedData.length - 1].date).getFullYear();
    return firstYear !== lastYear;
  }, [rawDisplayedData]);

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

        if (lotDateStr < startStr || lotDateStr > endStr) return;

        let bestIdx = history.findIndex(h => h.date.split("T")[0] === lotDateStr);

        if (bestIdx === -1) {
          const targetTime = new Date(lotDateStr + "T00:00:00.000Z").getTime();
          let bestDiff = Infinity;
          history.forEach((h, i) => {
            const hTime = new Date(h.date).getTime();
            const diff = Math.abs(hTime - targetTime);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestIdx = i;
            }
          });
        }

        if (bestIdx >= 0) {
          if (!map[bestIdx]) map[bestIdx] = [];
          map[bestIdx].push({
            symbol: asset.symbol,
            type: lot.type || "BUY",
            qty: lot.qty,
            price: lot.price,
            date: lot.date,
            time: lot.time
          });
        }
      });
    });
    return map;
  }, [assets, history]);

  // Unique lot purchase dates for markers
  const lotMarkers = useMemo(() => {
    if (!displayedData || displayedData.length < 2 || !assets || !history || history.length < 2) return [];

    const displayStart = new Date(displayedData[0].date).getTime();
    const displayEnd = new Date(displayedData[displayedData.length - 1].date).getTime();

    const rawMarkers = [];
    assets.forEach(asset => {
      (asset.lots || []).forEach(lot => {
        if (!lot || !lot.date) return;
        const lotTime = new Date(lot.date + "T" + (lot.time || "00:00") + ":00.000Z").getTime();

        if (lotTime < displayStart || lotTime > displayEnd) return;

        let bestDisplayIdx = -1, bestDiff = Infinity;
        displayedData.forEach((d, idx) => {
          const diff = Math.abs(new Date(d.date).getTime() - lotTime);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestDisplayIdx = idx;
          }
        });

        if (bestDisplayIdx !== -1) {
          const isBuy = (lot.qty || 0) >= 0;
          const x = PAD_L + (bestDisplayIdx / (displayedData.length - 1)) * iW;
          rawMarkers.push({
            x,
            isBuy,
            symbol: asset.symbol,
            lot,
            time: lotTime
          });
        }
      });
    });

    rawMarkers.sort((a, b) => a.x - b.x);

    const grouped = [];
    rawMarkers.forEach(m => {
      if (grouped.length === 0) {
        grouped.push({
          xSum: m.x,
          count: 1,
          buysCount: m.isBuy ? 1 : 0,
          sellsCount: !m.isBuy ? 1 : 0,
          txs: [m]
        });
      } else {
        const lastGroup = grouped[grouped.length - 1];
        const avgX = lastGroup.xSum / lastGroup.count;
        if (Math.abs(m.x - avgX) < 18) {
          lastGroup.xSum += m.x;
          lastGroup.count += 1;
          if (m.isBuy) lastGroup.buysCount++;
          else lastGroup.sellsCount++;
          lastGroup.txs.push(m);
        } else {
          grouped.push({
            xSum: m.x,
            count: 1,
            buysCount: m.isBuy ? 1 : 0,
            sellsCount: !m.isBuy ? 1 : 0,
            txs: [m]
          });
        }
      }
    });

    return grouped.map(group => {
      const x = group.xSum / group.count;
      let colorType = "mixed";
      if (group.buysCount > 0 && group.sellsCount === 0) colorType = "buy";
      else if (group.buysCount === 0 && group.sellsCount > 0) colorType = "sell";

      const uniqueSymbols = Array.from(new Set(group.txs.map(t => t.symbol)));
      let label = uniqueSymbols.length === 1 ? uniqueSymbols[0].slice(0, 1) : String(group.txs.length);

      return {
        x,
        colorType,
        label,
        symbol: uniqueSymbols.length === 1 ? uniqueSymbols[0] : "*",
        txs: group.txs.map(t => ({
          symbol: t.symbol,
          type: t.lot.type || (t.lot.qty >= 0 ? "BUY" : "SELL"),
          qty: Math.abs(t.lot.qty),
          price: t.lot.price,
          date: t.lot.date,
          time: t.lot.time
        }))
      };
    });
  }, [assets, displayedData, history, iW, PAD_L]);

  const { pts, costPts, yMin, yMax, isUp, color, renderPts } = useMemo(() => {
    if (!displayedData || displayedData.length < 2) {
      return { pts: [], costPts: [], yMin: 0, yMax: 1, isUp: true, color: "var(--gain)", renderPts: [] };
    }

    const vals = displayedData.map(h => h.value);
    const costs = displayedData.map(h => h.cost || 0);

    const isShortTF = range === "1D" || range === "5D" || range === "1W";
    const dataMin = isShortTF ? Math.min(...vals) : Math.min(...vals, ...costs.filter(c => c > 0));
    const dataMax = isShortTF ? Math.max(...vals) : Math.max(...vals, ...costs);
    const rangeVal = dataMax - dataMin || dataMin * 0.02 || 1;

    const pad = rangeVal * 0.05;
    const yMin = Math.max(0, dataMin - pad);
    const yMax = dataMax + pad;
    const yRange = yMax - yMin;

    const toY = (v) => PAD_T + ((yMax - v) / yRange) * iH;
    const toX = (i) => PAD_L + (i / (displayedData.length - 1)) * iW;

    const pts = displayedData.map((h, i) => ({ x: toX(i), y: toY(h.value), value: h.value, date: h.date }));
    const costPts = displayedData.map((h, i) => ({ x: toX(i), y: toY(h.cost || 0), cost: h.cost || 0, date: h.date }));

    const renderPts = smoothPoints(pts, toY);
    const isUp = vals[vals.length - 1] >= vals[0];
    const color = isUp ? "var(--gain)" : "var(--loss)";

    return { pts, costPts, yMin, yMax, isUp, color, renderPts };
  }, [displayedData, iH, iW, range, PAD_T, PAD_L]);

  const linePath = useMemo(() => smoothPath(renderPts), [renderPts]);
  const costLinePath = useMemo(() => stepPath(costPts), [costPts]);

  // Gain & Loss fill paths
  const fillValueArea = useMemo(() => {
    if (!linePath || renderPts.length < 2) return "";
    const first = renderPts[0], last = renderPts[renderPts.length - 1];
    const bottomY = H - PAD_B;
    return linePath + ` L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [linePath, renderPts, H, PAD_B]);

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
    if (!linePath || renderPts.length < 2) return "";
    const first = renderPts[0], last = renderPts[renderPts.length - 1];
    return linePath + ` L ${last.x},0 L ${first.x},0 Z`;
  }, [linePath, renderPts]);

  // Axis labels
  const dateLabels = useMemo(() => {
    if (displayedData.length <= 1) return [];
    const isShortTF = range === "1D" || range === "5D" || range === "1W";
    const maxTicks = isMobile ? (isShortTF ? 3 : 5) : (isShortTF ? 8 : 12);
    const count = Math.min(maxTicks, displayedData.length);
    const step = Math.floor((displayedData.length - 1) / Math.max(count - 1, 1));
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i === count - 1 ? displayedData.length - 1 : i * step, displayedData.length - 1);
      return { idx, x: PAD_L + (idx / (displayedData.length - 1)) * iW, date: displayedData[idx].date };
    });
  }, [displayedData, isMobile, range, PAD_L, iW]);

  const yTicks = useMemo(() => {
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
  }, [yMax, yMin, PAD_T, iH, H, PAD_B]);

  return {
    dims,
    setDims,
    W,
    H,
    PAD_L,
    PAD_R,
    PAD_T,
    PAD_B,
    iW,
    iH,
    isMobile,
    rawDisplayedData,
    visibleDurationMs,
    displayedData,
    hasMultipleYears,
    transactionsByIdx,
    lotMarkers,
    pts,
    costPts,
    yMin,
    yMax,
    isUp,
    color,
    renderPts,
    linePath,
    costLinePath,
    fillValueArea,
    fillCostArea,
    clipAboveCostPath,
    clipBelowCostPath,
    clipAboveValuePath,
    dateLabels,
    yTicks
  };
}
