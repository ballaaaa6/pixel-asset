import { useState, useEffect, useRef, useCallback } from "react";
import { useAssetChartData } from "./useAssetChartData";

/**
 * useAssetChart — top-level chart hook.
 * Owns: zoom/diff/hover/drag state, all event handlers (mouse + touch + wheel).
 * Delegates geometry derivation to useAssetChartData.
 */
export function useAssetChart({ candles, avgCost, lots, tf, isThai, exchangeRate, asset }) {
  const containerRef = useRef(null);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [hovered, setHovered] = useState(null);
  const [zoomRange, setZoomRange] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [diffStartIdx, setDiffStartIdx] = useState(null);
  const [diffEndIdx, setDiffEndIdx] = useState(null);
  const [isDiffActive, setIsDiffActive] = useState(false);

  const touchRef = useRef({ lastX: 0, lastY: 0, type: null, startDist: 0, startZoom: null, isPinching: false, centerX: 0 });
  const lastTouchTime = useRef(0);

  // ── Refs for stale-closure-free event handlers ────────────────────────────
  const diffStartIdxRef = useRef(null);
  const diffEndIdxRef = useRef(null);

  const updateDiffStartIdx = (val) => { setDiffStartIdx(val); diffStartIdxRef.current = val; };
  const updateDiffEndIdx = (val) => { setDiffEndIdx(val); diffEndIdxRef.current = val; };

  // Reset zoom when candles/tf change
  useEffect(() => { setZoomRange(null); }, [candles, tf]);

  // Responsive container resize
  const { setDims, ...chartData } = useAssetChartData({ candles, avgCost, lots, tf, isThai, exchangeRate, asset, zoomRange });

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: Math.min(300, Math.max(200, e.contentRect.width * 0.42)) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [candles]);

  const { W, H, PAD_L, PAD_R, PAD_T, PAD_B, iW, iH, pts, costPts, renderPts, displayedCandles: _dc } = chartData;
  const displayedCandles = chartData.interpolatedData;

  // ── stateRef allows event handlers to always read fresh state ─────────────
  const stateRef = useRef();
  stateRef.current = {
    candles, zoomRange, displayedCandles,
    W, H, iW, iH, PAD_L, PAD_R, PAD_T, PAD_B,
    diffStartIdx, diffEndIdx, pts, costPts, isDiffActive
  };

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) e.preventDefault(); // Prevent browser autoscroll trigger
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseX < PAD_L || mouseX > W - PAD_R) return;
    
    const isPanAction = (e.button === 1 || (e.button === 0 && e.shiftKey)) && zoomRange;

    if (isPanAction) {
      setDragStart({ x: mouseX, type: "pan", startZoom: { ...zoomRange } });
      setHovered(null);
    } else if (e.button === 0) {
      const relX = (mouseX - PAD_L) / iW;
      const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
      const ts = new Date(displayedCandles[idx].date).getTime();
      setIsDiffActive(true);
      updateDiffStartIdx(ts);
      updateDiffEndIdx(ts);
      setDragStart({ x: mouseX, type: "diff" });
      setHovered(null);
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
        updateDiffEndIdx(new Date(displayedCandles[idx].date).getTime());
        setHovered(null);
      } else if (dragStart.type === "pan") {
        const deltaX = mouseXInSvg - dragStart.x;
        const len = candles.length;
        const { start: cs, end: ce } = dragStart.startZoom;
        const rangeSize = ce - cs;
        const indexShift = Math.round(-deltaX / (iW / Math.max(1, rangeSize)));
        if (indexShift !== 0) {
          let ns = cs + indexShift, ne = ce + indexShift;
          if (ns < 0) { ns = 0; ne = rangeSize; }
          if (ne >= len) { ne = len - 1; ns = Math.max(0, ne - rangeSize); }
          setZoomRange({ start: ns, end: ne });
        }
        setHovered(null);
      }
      return;
    }

    if (isDiffActive) return;

    const relX = (mouseXInSvg - PAD_L) / iW;
    const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
    const pt = renderPts[idx];
    if (pt) {
      const costPt = costPts[idx];
      const rawPt = pts[idx];
      setHovered({ idx, x: pt.x, y: pt.y, costY: costPt ? costPt.y : null, value: rawPt?.value || pt.value, cost: costPt ? costPt.cost : null, date: pt.date, hasPurchased: pt.hasPurchased });
    }
  }, [renderPts, pts, costPts, displayedCandles, PAD_L, iW, W, dragStart, zoomRange, candles, isDiffActive]);

  const handleMouseUp = () => {
    if (dragStart?.type === "diff" && diffStartIdxRef.current === diffEndIdxRef.current) {
      setIsDiffActive(false); updateDiffStartIdx(null); updateDiffEndIdx(null);
    }
    setDragStart(null); setDragEnd(null);
  };

  const handleMouseLeave = () => { setHovered(null); setDragStart(null); setDragEnd(null); };

  const findClosestPtByTimestamp = useCallback((ts) => {
    if (!renderPts || renderPts.length === 0 || ts == null) return null;
    let bestPt = renderPts[0], bestDiff = Infinity;
    for (let i = 0; i < renderPts.length; i++) {
      const pt = renderPts[i];
      if (!pt) continue;
      const diff = Math.abs(new Date(pt.date).getTime() - ts);
      if (diff < bestDiff) { bestDiff = diff; bestPt = pt; }
    }
    return bestPt;
  }, [renderPts]);

  // ── Wheel + Touch event listeners (non-passive) ───────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const get = () => stateRef.current;

    const handleWheel = (e) => {
      const { candles, zoomRange, displayedCandles, W, iW, PAD_L } = get();
      if (!candles || candles.length < 2) return;
      e.preventDefault();
      const isZoomIn = e.deltaY < 0;
      const len = candles.length;
      const cs = zoomRange ? zoomRange.start : 0;
      const ce = zoomRange ? zoomRange.end : len - 1;
      const rangeSize = ce - cs;
      const rect = el.getBoundingClientRect();
      const relX = (((e.clientX - rect.left) / rect.width) * W - PAD_L) / iW;
      const hoveredIdx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
      let centerIdx = cs, bestDiff = Infinity;
      candles.forEach((h, i) => {
        const d = Math.abs(new Date(h.date) - new Date(displayedCandles[hoveredIdx].date));
        if (d < bestDiff) { bestDiff = d; centerIdx = i; }
      });
      if (isZoomIn) {
        if (rangeSize <= 2) return;
        const crop = Math.max(1, Math.floor(rangeSize * 0.12));
        const nrs = Math.max(2, rangeSize - crop * 2);
        let ns = Math.round(centerIdx - relX * nrs), ne = ns + nrs;
        if (ns < 0) { ns = 0; ne = nrs; }
        if (ne >= len) { ne = len - 1; ns = Math.max(0, ne - nrs); }
        setZoomRange({ start: ns, end: ne });
      } else {
        if (!zoomRange) return;
        const exp = Math.max(1, Math.floor(rangeSize * 0.12));
        const nrs = Math.min(len - 1, rangeSize + exp * 2);
        let ns = Math.round(centerIdx - relX * nrs), ne = ns + nrs;
        if (ns < 0) { ns = 0; ne = nrs; }
        if (ne >= len) { ne = len - 1; ns = Math.max(0, ne - nrs); }
        setZoomRange(ns === 0 && ne === len - 1 ? null : { start: ns, end: ne });
      }
    };

    const handleDblClick = (e) => { e.preventDefault(); setZoomRange(null); };

    const handleTouchStart = (e) => {
      const { candles, zoomRange, displayedCandles, W, iW, PAD_L, PAD_R } = get();
      if (!candles || candles.length < 2) return;
      if (e.touches.length === 1) {
        const rect = el.getBoundingClientRect();
        const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
        if (touchX < PAD_L || touchX > W - PAD_R) return;
        const relX = (touchX - PAD_L) / iW;
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
        let origIdx = zoomRange ? zoomRange.start : 0, bestDiff = Infinity;
        candles.forEach((h, i) => {
          const d = Math.abs(new Date(h.date) - new Date(displayedCandles[idx].date));
          if (d < bestDiff) { bestDiff = d; origIdx = i; }
        });
        touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY, type: null, startIdx: origIdx, isPinching: false };
        setHovered(null);
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        touchRef.current = { startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY), startZoom: { ...(zoomRange || { start: 0, end: candles.length - 1 }) }, isPinching: true, centerX: (t1.clientX + t2.clientX) / 2 };
      }
    };

    const handleTouchMove = (e) => {
      const { candles, zoomRange, displayedCandles, W, iW, PAD_L, PAD_R } = get();
      if (!candles || candles.length < 2) return;
      const ref = touchRef.current;
      if (!ref) return;

      if (e.touches.length === 1 && !ref.isPinching) {
        const cx = e.touches[0].clientX, cy = e.touches[0].clientY;
        if (ref.type === null) {
          const dx = Math.abs(cx - ref.startX), dy = Math.abs(cy - ref.startY);
          if (dx > 5 || dy > 5) {
            if (dx > dy) { ref.type = "diff"; setIsDiffActive(true); updateDiffStartIdx(ref.startIdx); updateDiffEndIdx(ref.startIdx); }
            else ref.type = "scroll";
          }
        }
        if (ref.type === "diff") {
          const rect = el.getBoundingClientRect();
          const touchX = ((cx - rect.left) / rect.width) * W;
          const boundedX = Math.max(PAD_L, Math.min(W - PAD_R, touchX));
          const relX = (boundedX - PAD_L) / iW;
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedCandles.length - 1)), displayedCandles.length - 1));
          let origIdx = zoomRange ? zoomRange.start : 0, bestDiff = Infinity;
          candles.forEach((h, i) => {
            const d = Math.abs(new Date(h.date) - new Date(displayedCandles[idx].date));
            if (d < bestDiff) { bestDiff = d; origIdx = i; }
          });
          updateDiffEndIdx(origIdx); setHovered(null); e.preventDefault();
        }
      } else if (e.touches.length === 2 && ref.isPinching) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const len = candles.length;
        const initRS = ref.startZoom.end - ref.startZoom.start;
        let nrs = Math.max(2, Math.min(len - 1, Math.round(initRS * (ref.startDist / dist))));
        const rect = el.getBoundingClientRect();
        const relX = (ref.centerX - rect.left) / rect.width;
        let ns = Math.round((ref.startZoom.start + initRS * relX) - relX * nrs), ne = ns + nrs;
        if (ns < 0) { ns = 0; ne = nrs; }
        if (ne >= len) { ne = len - 1; ns = Math.max(0, ne - nrs); }
        setZoomRange(ns === 0 && ne === len - 1 ? null : { start: ns, end: ne });
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      const ref = touchRef.current;
      if (ref) {
        if (ref.type === "diff") {
          if (diffStartIdxRef.current === diffEndIdxRef.current) { setIsDiffActive(false); updateDiffStartIdx(null); updateDiffEndIdx(null); }
        } else if (ref.type === null) { setIsDiffActive(false); updateDiffStartIdx(null); updateDiffEndIdx(null); }
      }
      touchRef.current = { lastX: 0, startDist: 0, startZoom: null, isPinching: false, centerX: 0 };
    };

    const handleTouchStartWithDblTap = (e) => {
      const now = Date.now();
      if (now - lastTouchTime.current < 300) { e.preventDefault(); setZoomRange(null); return; }
      lastTouchTime.current = now;
      handleTouchStart(e);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("dblclick", handleDblClick);
    el.addEventListener("touchstart", handleTouchStartWithDblTap, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("dblclick", handleDblClick);
      el.removeEventListener("touchstart", handleTouchStartWithDblTap);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [candles]);

  return {
    containerRef,
    hovered, zoomRange, dragStart, dragEnd,
    diffStartIdx, diffEndIdx, isDiffActive,
    displayedCandles,
    findClosestPtByTimestamp,
    handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
    ...chartData,
  };
}
