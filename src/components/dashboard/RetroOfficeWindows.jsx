import React from "react";
import RetroWindow from "../common/RetroWindow";
import KPIRow from "./KPIRow";
import PortfolioSummary from "./PortfolioSummary";
import AssetTable from "./AssetTable";
import StockAnalyzer from "./StockAnalyzer";
import DividendTracker from "./DividendTracker";
import PortfolioCorrelation from "./PortfolioCorrelation";

export default function RetroOfficeWindows({
  activeModal,
  setActiveModal,
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
  sparklines,
  priceFlash,
  refreshing,
  hideValues,
  hoveredSymbol,
  hoveredCategory,
  selectedAsset,
  setSelectedAsset,
  setShowPnLDetailsModal,
  setActiveKpiDetail,
  setHoveredSymbol,
  setHoveredCategory,
  fetchPrices,
  setHideValues,
  setEditingAsset,
  setModalOpen,
  sortConfig,
  handleSort,
  handleDeleteAsset,
  totalRealizedUSD,
  totalUnrealizedUSD,
  initialCapitalUSD,
  handleDimeReportUpload,
  handleImport,
  handleExport,
  dividendData,
  dividendLoading,
  fetchDividendEvents,
  showToast
}) {
  if (!activeModal) return null;

  return (
    <>
      {/* 1. Summary Popup */}
      {activeModal === "summary" && (
        <RetroWindow title="สรุปมูลค่าพอร์ต & KPIs" onClose={() => setActiveModal(null)}>
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
          <div style={{ height: "20px" }} />
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
        </RetroWindow>
      )}

      {/* 2. Ledger Popup */}
      {activeModal === "ledger" && (
        <RetroWindow title="สมุดบัญชีรายการหุ้น (Ledger)" onClose={() => setActiveModal(null)}>
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
        </RetroWindow>
      )}

      {/* 3. Reception & Import/Export Popup */}
      {activeModal === "import" && (
        <RetroWindow title="เคาน์เตอร์ฝ่ายประชาสัมพันธ์ & นำเข้าข้อมูล" onClose={() => setActiveModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px", alignItems: "center" }}>
            <h3 style={{ fontFamily: "var(--font-family)", fontSize: "24px" }}>🏢 จัดการธุรกรรมของคุณ</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
              <button 
                onClick={() => { setModalOpen(true); setActiveModal(null); }} 
                className="btn-retro"
                style={{ padding: "12px 24px", fontSize: "18px" }}
              >
                📸 อัปโหลดใบเสร็จเทรดหุ้น (OCR)
              </button>
              
              <label className="btn-retro" style={{ padding: "12px 24px", fontSize: "18px", display: "inline-block", cursor: "pointer" }}>
                📄 นำเข้าไฟล์ Dime PDF / Text
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  onChange={handleDimeReportUpload} 
                  style={{ display: "none" }} 
                />
              </label>
            </div>
            
            <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
              <label className="btn-retro" style={{ padding: "8px 16px", fontSize: "15px", display: "inline-block", cursor: "pointer", background: "var(--primary-light)" }}>
                📥 นำเข้าพอร์ตจากไฟล์ Backup (.json)
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport} 
                  style={{ display: "none" }} 
                />
              </label>
              <button 
                onClick={handleExport} 
                className="btn-retro"
                style={{ padding: "8px 16px", fontSize: "15px", background: "var(--primary-light)" }}
              >
                📤 ส่งออกไฟล์ Backup (.json)
              </button>
            </div>
          </div>
        </RetroWindow>
      )}

      {/* 4. Stock Analyzer Popup */}
      {activeModal === "analyzer" && (
        <RetroWindow title="นักวิเคราะห์ตลาด (Stock Analyzer)" onClose={() => setActiveModal(null)}>
          <StockAnalyzer showToast={showToast} />
        </RetroWindow>
      )}

      {/* 5. Dividends Popup */}
      {activeModal === "dividends" && (
        <RetroWindow title="พนักงานปันผล (Dividend Tracker)" onClose={() => setActiveModal(null)}>
          <DividendTracker
            assets={assets}
            prices={prices}
            exchangeRate={exchangeRate}
            hideValues={hideValues}
            showToast={showToast}
            dividendData={dividendData}
            dividendLoading={dividendLoading}
            fetchDividendEvents={fetchDividendEvents}
            setSelectedAsset={setSelectedAsset}
          />
        </RetroWindow>
      )}

      {/* 6. Risk / Correlation Popup */}
      {activeModal === "risk" && (
        <RetroWindow title="ฝ่ายบริหารความเสี่ยง (Risk Correlation)" onClose={() => setActiveModal(null)}>
          <PortfolioCorrelation
            assets={sortedAssets}
            exchangeRate={exchangeRate}
            hideValues={hideValues}
          />
        </RetroWindow>
      )}
    </>
  );
}
