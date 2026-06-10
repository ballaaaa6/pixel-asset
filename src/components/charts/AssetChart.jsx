import React from "react";
import { RefreshCw } from "lucide-react";
import { useAssetChart } from "../../hooks/useAssetChart";
import { AssetChartSVG } from "./AssetChartSVG";
import { AssetChartTooltip } from "./AssetChartTooltip";

/**
 * AssetChart — orchestrator component.
 *
 * Delegates:
 *   - All state + event logic  → useAssetChart (hook)
 *   - SVG rendering            → AssetChartSVG
 *   - Tooltip / diff panel     → AssetChartTooltip
 *
 * This file is intentionally thin (<120 lines).
 */
export function AssetChart({ candles, avgCost, lots, tf, isThai, exchangeRate, asset, hideValues, getHistoricalRate }) {
  const chart = useAssetChart({ candles, avgCost, lots, tf, isThai, exchangeRate, asset });

  const {
    containerRef,
    hovered, zoomRange, dragStart,
    diffStartIdx, diffEndIdx, isDiffActive,
    showEma10, setShowEma10,
    showEma20, setShowEma20,
    showEma50, setShowEma50,
    showEma200, setShowEma200,
    W, H, PAD_L, PAD_R, PAD_T, PAD_B, iW, iH,
    pts, costPts, yMin, yMax, isUp, interpolatedData,
    renderPts, ema10Path, ema20Path, ema50Path, ema200Path,
    yTicks, xTicks,
    activePts, activeCostPts,
    linePath, costLinePath,
    fillValueArea, fillCostArea,
    clipAboveCostPath, clipBelowCostPath, clipAboveValuePath,
    lotMarkers,
    displayedCandles,
    visibleDurationMs, hasMultipleYears,
    transactionsByDate,
    isCashAsset,
    findClosestPtByTimestamp,
    handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
  } = chart;

  const hasCostLine = activeCostPts.length > 0 && (avgCost > 0 || (lots && lots.length > 0));

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (!candles || candles.length < 2) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
        <RefreshCw size={18} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} /> กำลังโหลดข้อมูลกราฟ...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onSelectStart={(e) => e.preventDefault()}
      style={{
        width: "100%",
        position: "relative",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        cursor: zoomRange ? (dragStart && dragStart.type === "pan" ? "grabbing" : "grab") : "crosshair",
        touchAction: "pan-y"
      }}
    >
      {/* ── Floating EMA Toggle Panel ── */}
      {!isCashAsset && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          style={{
            position: "absolute", top: "8px", right: "24px",
            display: "flex", alignItems: "center", gap: "12px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            border: "1px solid var(--border)", borderRadius: "10px",
            padding: "4px 10px", boxShadow: "var(--shadow-xs)",
            zIndex: 10, pointerEvents: "auto", fontFamily: "Outfit, sans-serif"
          }}
        >
          <label title="EMA 10 — Short-term trend (10 periods)" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", userSelect: "none" }}>
            <input type="checkbox" checked={showEma10} onChange={e => setShowEma10(e.target.checked)} style={{ cursor: "pointer", accentColor: "#00d2ff" }} />
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#00d2ff" }}></span>
            EMA 10
          </label>
          <label title="EMA 20 — Medium-term trend (20 periods)" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", userSelect: "none" }}>
            <input type="checkbox" checked={showEma20} onChange={e => setShowEma20(e.target.checked)} style={{ cursor: "pointer", accentColor: "#FBBF24" }} />
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "1px", border: "1px dashed #FBBF24", background: "transparent" }}></span>
            EMA 20
          </label>
          <label title="EMA 50 — Long-term trend (50 periods)" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", userSelect: "none" }}>
            <input type="checkbox" checked={showEma50} onChange={e => setShowEma50(e.target.checked)} style={{ cursor: "pointer", accentColor: "#F97316" }} />
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#F97316" }}></span>
            EMA 50
          </label>
          <label title="EMA 200 — Major long-term trend (200 periods)" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", userSelect: "none" }}>
            <input type="checkbox" checked={showEma200} onChange={e => setShowEma200(e.target.checked)} style={{ cursor: "pointer", accentColor: "#DC2626" }} />
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#DC2626" }}></span>
            EMA 200
          </label>
        </div>
      )}

      {/* ── SVG chart canvas ── */}
      <AssetChartSVG
        W={W} H={H} PAD_L={PAD_L} PAD_R={PAD_R} PAD_T={PAD_T} PAD_B={PAD_B} iW={iW} iH={iH}
        isUp={isUp} isCashAsset={isCashAsset}
        linePath={linePath} costLinePath={costLinePath}
        fillValueArea={fillValueArea} fillCostArea={fillCostArea}
        clipAboveCostPath={clipAboveCostPath} clipBelowCostPath={clipBelowCostPath} clipAboveValuePath={clipAboveValuePath}
        showEma10={showEma10} showEma20={showEma20} showEma50={showEma50} showEma200={showEma200}
        ema10Path={ema10Path} ema20Path={ema20Path} ema50Path={ema50Path} ema200Path={ema200Path}
        activePts={activePts} activeCostPts={activeCostPts}
        hasCostLine={hasCostLine}
        yTicks={yTicks} xTicks={xTicks}
        visibleDurationMs={visibleDurationMs} hasMultipleYears={hasMultipleYears}
        lotMarkers={lotMarkers}
        hovered={hovered}
        isDiffActive={isDiffActive} diffStartIdx={diffStartIdx} diffEndIdx={diffEndIdx}
        findClosestPtByTimestamp={findClosestPtByTimestamp}
        hideValues={hideValues}
      />

      {/* ── Tooltips / diff panel ── */}
      <AssetChartTooltip
        hovered={hovered}
        W={W} H={H}
        visibleDurationMs={visibleDurationMs} hasMultipleYears={hasMultipleYears}
        transactionsByDate={transactionsByDate}
        isCashAsset={isCashAsset} isThai={isThai} exchangeRate={exchangeRate}
        asset={asset} hideValues={hideValues}
        isDiffActive={isDiffActive} diffStartIdx={diffStartIdx} diffEndIdx={diffEndIdx}
        findClosestPtByTimestamp={findClosestPtByTimestamp}
        candles={candles}
        getHistoricalRate={getHistoricalRate}
      />
    </div>
  );
}

export default AssetChart;
