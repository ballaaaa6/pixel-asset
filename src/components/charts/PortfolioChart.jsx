import React, { useMemo } from "react";
import { BarChart2 } from "lucide-react";
import { fmtUSD, fmtPct, fmtQty } from "../../utils/formatters";
import { usePortfolioChart } from "../../hooks/usePortfolioChart";
import { PortfolioChartSVG } from "./PortfolioChartSVG";
import { PortfolioChartTooltip } from "./PortfolioChartTooltip";

const RANGES = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

export function PortfolioChart({ history, range, onRangeChange, assets, exchangeRate, prices, hideValues }) {
  const {
    containerRef,
    hovered,
    zoomRange,
    dragStart,
    dragEnd,
    diffStartIdx,
    diffEndIdx,
    isDiffActive,
    displayedData,
    findClosestPtByTimestamp,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    ...chartData
  } = usePortfolioChart({ history, range, assets, exchangeRate, prices });

  const fmt = useMemo(() => ({
    usd: (n) => fmtUSD(n, hideValues),
    pct: fmtPct,
    qty: (n) => fmtQty(n, hideValues),
  }), [hideValues]);

  if (!history || history.length < 2) {
    return (
      <div ref={containerRef}>
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

      <div className="chart-area-wrapper" ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onSelectStart={(e) => e.preventDefault()}
        style={{
          cursor: zoomRange ? (dragStart && dragStart.type === "pan" ? "grabbing" : "grab") : "crosshair",
          position: "relative",
          width: "100%",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}>
        
        {/* SVG chart canvas */}
        <PortfolioChartSVG
          W={chartData.W} H={chartData.H}
          PAD_L={chartData.PAD_L} PAD_R={chartData.PAD_R} PAD_T={chartData.PAD_T} PAD_B={chartData.PAD_B}
          iW={chartData.iW} iH={chartData.iH}
          yTicks={chartData.yTicks} dateLabels={chartData.dateLabels} lotMarkers={chartData.lotMarkers}
          costPts={chartData.costPts} pts={chartData.pts}
          isDiffActive={isDiffActive} diffStartIdx={diffStartIdx} diffEndIdx={diffEndIdx}
          findClosestPtByTimestamp={findClosestPtByTimestamp}
          fillValueArea={chartData.fillValueArea} fillCostArea={chartData.fillCostArea}
          clipAboveCostPath={chartData.clipAboveCostPath} clipBelowCostPath={chartData.clipBelowCostPath} clipAboveValuePath={chartData.clipAboveValuePath}
          costLinePath={chartData.costLinePath} linePath={chartData.linePath}
          isUp={chartData.isUp} color={chartData.color}
          hovered={hovered} visibleDurationMs={chartData.visibleDurationMs} hasMultipleYears={chartData.hasMultipleYears}
          fmt={fmt} hideValues={hideValues}
        />

        {/* Tooltips / diff panel */}
        <PortfolioChartTooltip
          hovered={hovered}
          W={chartData.W} H={chartData.H}
          visibleDurationMs={chartData.visibleDurationMs} hasMultipleYears={chartData.hasMultipleYears}
          transactionsByIdx={chartData.transactionsByIdx}
          isDiffActive={isDiffActive} diffStartIdx={diffStartIdx} diffEndIdx={diffEndIdx}
          findClosestPtByTimestamp={findClosestPtByTimestamp}
          history={history}
          fmt={fmt}
        />
      </div>
    </div>
  );
}

export default PortfolioChart;
