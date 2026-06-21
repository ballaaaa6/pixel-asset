import React, { useState } from "react";
import KPIRow from "./KPIRow";
import CostValueBar from "./CostValueBar";
import PortfolioSummary from "./PortfolioSummary";
import DonutChart from "./DonutChart";
import PortfolioChart from "../charts/PortfolioChart";
import AssetTable from "./AssetTable";
import GlowTiltCard from "../common/GlowTiltCard";
import EconomicSentimentWidget from "./EconomicSentimentWidget";
import OfficeRoom from "./OfficeRoom";

export default function DashboardMainView({
  hasPrices,
  totalUSD,
  exchangeRate,
  totalCostUSD,
  todayChangeUSD,
  todayChangePct,
  totalGainUSD,
  totalGainTHB,
  totalGainPct,
  bestAsset,
  assets,
  sortedAssets,
  donutSegments,
  filteredAssets,
  portfolioHistory,
  chartRange,
  handleRangeChange,
  chartCategory,
  setChartCategory,
  hideValues,
  setActiveKpiDetail,
  setShowPnLDetailsModal,
  hoveredSymbol,
  setHoveredSymbol,
  hoveredCategory,
  setHoveredCategory,
  setSelectedAsset,
  selectedAsset,
  prices,
  priceFlash,
  refreshing,
  fetchPrices,
  setHideValues,
  setEditingAsset,
  setModalOpen,
  sortConfig,
  handleSort,
  handleDeleteAsset,
  sparklines,
  totalRealizedUSD,
  totalUnrealizedUSD,
  initialCapitalUSD,
  onSelectFeature
}) {
  const [viewMode, setViewMode] = useState("office");

  return (
    <div className="fade-in">
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
        hideValues={hideValues}
        onCardClick={setActiveKpiDetail}
      />

      {hasPrices && (
        <CostValueBar
          totalUSD={totalUSD}
          totalCostUSD={totalCostUSD}
          totalGainUSD={totalGainUSD}
          totalGainPct={totalGainPct}
          exchangeRate={exchangeRate}
          hideValues={hideValues}
          onCardClick={setActiveKpiDetail}
        />
      )}

      <div className="dashboard-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <PortfolioSummary
            hasPrices={hasPrices}
            totalUSD={totalUSD}
            exchangeRate={exchangeRate}
            totalCostUSD={totalCostUSD}
            totalGainUSD={totalGainUSD}
            totalGainPct={totalGainPct}
            totalGainTHB={totalGainTHB}
            assets={assets}
            totalRealizedUSD={totalRealizedUSD}
            totalUnrealizedUSD={totalUnrealizedUSD}
            initialCapitalUSD={initialCapitalUSD}
            todayChangeUSD={todayChangeUSD}
            setShowPnLDetailsModal={setShowPnLDetailsModal}
            hideValues={hideValues}
          />

          <GlowTiltCard className="card stagger-3">
            <DonutChart
              segments={hasPrices && donutSegments.length > 0 ? donutSegments : []}
              activeAssets={sortedAssets}
              hasAssets={sortedAssets.length > 0}
              hoveredSymbol={hoveredSymbol}
              setHoveredSymbol={setHoveredSymbol}
              hoveredCategory={hoveredCategory}
              setHoveredCategory={setHoveredCategory}
              hideValues={hideValues}
              setSelectedAsset={setSelectedAsset}
            />
          </GlowTiltCard>

          <GlowTiltCard className="card stagger-4" style={{ padding: 0 }}>
            <EconomicSentimentWidget assets={sortedAssets} />
          </GlowTiltCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GlowTiltCard className="card stagger-2" style={{ padding: "16px 14px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px solid #000", paddingBottom: "8px" }}>
              <span style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "var(--font-family)" }}>📊 พอร์ตโฟลิโอ</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setViewMode("office")} 
                  className={`btn-retro ${viewMode === "office" ? "active" : ""}`}
                  style={{ padding: "4px 8px", fontSize: "14px" }}
                >
                  🏢 ออฟฟิศเทรดเดอร์
                </button>
                <button 
                  onClick={() => setViewMode("chart")} 
                  className={`btn-retro ${viewMode === "chart" ? "active" : ""}`}
                  style={{ padding: "4px 8px", fontSize: "14px" }}
                >
                  📈 กราฟประวัติ
                </button>
              </div>
            </div>

            {viewMode === "office" ? (
              <OfficeRoom 
                assets={sortedAssets} 
                prices={prices} 
                setSelectedAsset={setSelectedAsset} 
                onSelectFeature={onSelectFeature}
              />
            ) : (
              <PortfolioChart
                history={portfolioHistory}
                range={chartRange}
                onRangeChange={handleRangeChange}
                assets={filteredAssets}
                exchangeRate={exchangeRate}
                prices={prices}
                hideValues={hideValues}
                chartCategory={chartCategory}
                setChartCategory={setChartCategory}
              />
            )}
          </GlowTiltCard>

          <AssetTable
            sortedAssets={sortedAssets}
            prices={prices}
            priceFlash={priceFlash}
            bestAsset={bestAsset}
            totalUSD={totalUSD}
            exchangeRate={exchangeRate}
            setSelectedAsset={setSelectedAsset}
            selectedAsset={selectedAsset}
            refreshing={refreshing}
            fetchPrices={fetchPrices}
            assets={assets}
            setHideValues={setHideValues}
            hideValues={hideValues}
            setEditingAsset={setEditingAsset}
            setModalOpen={setModalOpen}
            sortConfig={sortConfig}
            handleSort={handleSort}
            handleDeleteAsset={handleDeleteAsset}
            hasPrices={hasPrices}
            sparklines={sparklines}
            hoveredSymbol={hoveredSymbol}
            setHoveredSymbol={setHoveredSymbol}
            hoveredCategory={hoveredCategory}
            setHoveredCategory={setHoveredCategory}
          />
        </div>
      </div>
    </div>
  );
}
