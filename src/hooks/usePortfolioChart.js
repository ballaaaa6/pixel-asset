import { useState, useEffect, useRef, useCallback } from "react";
import { usePortfolioChartData } from "./usePortfolioChartData";

/**
 * usePortfolioChart — top-level portfolio chart hook.
 * Owns: zoom/diff/hover/drag state, all event handlers (mouse + touch + wheel).
 */
export function usePortfolioChart({ history, range, assets, exchangeRate, prices }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [zoomRange, setZoomRange] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [diffStartIdx, setDiffStartIdx] = useState(null);
  const [diffEndIdx, setDiffEndIdx] = useState(null);
  const [isDiffActive, setIsDiffActive] = useState(false);

  const touchRef = useRef({ lastX: 0, lastY: 0, type: null, startDist: 0, startZoom: null, isPinching: false, centerX: 0 });
  const lastTouchTime = useRef(0);

  const diffStartIdxRef = useRef(null);
  const diffEndIdxRef = useRef(null);

  const updateDiffStartIdx = (val) => { setDiffStartIdx(val); diffStartIdxRef.current = val; };
  const updateDiffEndIdx = (val) => { setDiffEndIdx(val); diffEndIdxRef.current = val; };

  useEffect(() => { setZoomRange(null); }, [history, range]);

  const { setDims, ...chartData } = usePortfolioChartData({ history, range, assets, exchangeRate, prices, zoomRange });

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
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [history, setDims]);

  const { W, H, PAD_L, PAD_R, PAD_T, PAD_B, iW, iH, pts, costPts, renderPts, displayedData } = chartData;

  const stateRef = useRef();
  stateRef.current = { history, zoomRange, displayedData, W, H, iW, iH, PAD_L, PAD_R, PAD_T, PAD_B, diffStartIdx, diffEndIdx, pts, costPts, isDiffActive };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseX >= PAD_L && mouseX <= W - PAD_R) {
      if (e.shiftKey && zoomRange) {
        setDragStart({ x: mouseX, type: "pan", startZoom: { ...zoomRange } });
      } else {
        const relX = (mouseX - PAD_L) / iW;
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
        const ts = new Date(displayedData[idx].date).getTime();
        setIsDiffActive(true);
        updateDiffStartIdx(ts);
        updateDiffEndIdx(ts);
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
        const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
        updateDiffEndIdx(new Date(displayedData[idx].date).getTime());
        setHovered(null);
      } else if (dragStart.type === "pan") {
        const deltaX = mouseXInSvg - dragStart.x;
        const len = history.length;
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
    const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
    if (displayedData[idx]) {
      let originalIdx = 0, bestDiff = Infinity;
      history.forEach((h, i) => {
        const diff = Math.abs(new Date(h.date) - new Date(displayedData[idx].date));
        if (diff < bestDiff) { bestDiff = diff; originalIdx = i; }
      });
      setHovered({
        idx, originalIdx,
        x: renderPts[idx]?.x || pts[idx].x,
        y: renderPts[idx]?.y || pts[idx].y,
        costY: costPts[idx]?.y,
        value: displayedData[idx].value,
        cost: displayedData[idx].cost || 0,
        date: displayedData[idx].date
      });
    }
  }, [renderPts, pts, costPts, displayedData, iW, W, dragStart, zoomRange, history, isDiffActive, PAD_L, PAD_R]);

  const handleMouseUp = () => {
    if (dragStart?.type === "diff" && diffStartIdxRef.current === diffEndIdxRef.current) {
      setIsDiffActive(false); updateDiffStartIdx(null); updateDiffEndIdx(null);
    }
    setDragStart(null); setDragEnd(null);
  };

  const handleMouseLeave = () => { setHovered(null); setDragStart(null); setDragEnd(null); };

  const findClosestPtByTimestamp = useCallback((ts) => {
    if (!pts || pts.length === 0 || ts == null) return null;
    let bestPt = pts[0], bestDiff = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      if (!pt) continue;
      const diff = Math.abs(new Date(pt.date).getTime() - ts);
      if (diff < bestDiff) { bestDiff = diff; bestPt = pt; }
    }
    return bestPt;
  }, [pts]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const get = () => stateRef.current;

    const handleWheel = (e) => {
      const { history, zoomRange, displayedData, W, iW, PAD_L } = get();
      if (!history || history.length < 2) return;
      e.preventDefault();

      const isZoomIn = e.deltaY < 0;
      const len = history.length;
      const cs = zoomRange ? zoomRange.start : 0;
      const ce = zoomRange ? zoomRange.end : len - 1;
      const rangeSize = ce - cs;

      const rect = el.getBoundingClientRect();
      const relX = (((e.clientX - rect.left) / rect.width) * W - PAD_L) / iW;
      const hoveredIdx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
      
      let centerIdx = cs, bestDiff = Infinity;
      history.forEach((h, i) => {
        const d = Math.abs(new Date(h.date) - new Date(displayedData[hoveredIdx].date));
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
      const { history, zoomRange, displayedData, W, iW, PAD_L, PAD_R } = get();
      if (!history || history.length < 2) return;

      if (e.touches.length === 1) {
        const rect = el.getBoundingClientRect();
        const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
        if (touchX >= PAD_L && touchX <= W - PAD_R) {
          const relX = (touchX - PAD_L) / iW;
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
          let origIdx = zoomRange ? zoomRange.start : 0, bestDiff = Infinity;
          history.forEach((h, i) => {
            const d = Math.abs(new Date(h.date) - new Date(displayedData[idx].date));
            if (d < bestDiff) { bestDiff = d; origIdx = i; }
          });
          touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY, type: null, startIdx: origIdx, isPinching: false };
          setHovered(null);
        }
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        touchRef.current = { startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY), startZoom: { ...(zoomRange || { start: 0, end: history.length - 1 }) }, isPinching: true, centerX: (t1.clientX + t2.clientX) / 2 };
      }
    };

    const handleTouchMove = (e) => {
      const { history, zoomRange, displayedData, W, iW, PAD_L, PAD_R } = get();
      if (!history || history.length < 2) return;
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
          const idx = Math.max(0, Math.min(Math.round(relX * (displayedData.length - 1)), displayedData.length - 1));
          let origIdx = zoomRange ? zoomRange.start : 0, bestDiff = Infinity;
          history.forEach((h, i) => {
            const d = Math.abs(new Date(h.date) - new Date(displayedData[idx].date));
            if (d < bestDiff) { bestDiff = d; origIdx = i; }
          });
          updateDiffEndIdx(origIdx); setHovered(null); e.preventDefault();
        }
      } else if (e.touches.length === 2 && ref.isPinching) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const len = history.length;
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

    const handleTouchStartWithDoubleTap = (e) => {
      const now = Date.now();
      if (now - lastTouchTime.current < 300) { e.preventDefault(); setZoomRange(null); return; }
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

  return {
    containerRef, hovered, zoomRange, dragStart, dragEnd, diffStartIdx, diffEndIdx, isDiffActive, displayedData, findClosestPtByTimestamp, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, ...chartData
  };
}
