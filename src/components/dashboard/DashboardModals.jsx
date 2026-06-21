import React, { useMemo } from "react";
import AssetModal from "../AssetModal";
import AssetDetailPanel from "../AssetDetailPanel";
import CustomConfirmModal from "../common/CustomConfirmModal";
import DimeImportPreviewModal from "../modal/DimeImportPreviewModal";
import RetroOfficeWindows from "./RetroOfficeWindows";
import PnLDetailsModal from "./PnLDetailsModal";
import KPIDetailsModal from "./KPIDetailsModal";
import ProfileModal from "./ProfileModal";
import InvestorProfileModal from "./InvestorProfileModal";
import { getCurrencyTicker } from "../../utils/assetHelpers";

export default function DashboardModals({
  activeModal,
  setActiveModal,
  showPnLDetailsModal,
  setShowPnLDetailsModal,
  activeKpiDetail,
  setActiveKpiDetail,
  selectedAsset,
  setSelectedAsset,
  investorModalOpen,
  setInvestorModalOpen,
  profileModalOpen,
  setProfileModalOpen,
  modalOpen,
  setModalOpen,
  confirmConfig,
  setConfirmConfig,
  dimePreviewData,
  setDimePreviewData,

  // Data props
  assets,
  prices,
  sparklines,
  exchangeRate,
  historicalRates,
  totalUSD,
  totalCostUSD,
  todayChangeUSD,
  todayChangePct,
  totalGainUSD,
  totalGainTHB,
  totalGainPct,
  bestAsset,
  sortedAssets,
  donutSegments,
  initialCapitalUSD,
  totalRealizedUSD,
  totalUnrealizedUSD,
  dividendData,
  dividendLoading,
  fetchDividendEvents,
  hideValues,
  setHideValues,
  hoveredSymbol,
  setHoveredSymbol,
  hoveredCategory,
  setHoveredCategory,
  editingAsset,
  setEditingAsset,
  editingLot,
  setEditingLot,
  priceFlash,
  refreshing,
  sortConfig,
  handleSort,
  fetchPrices,

  // Handler props
  handleClearAsset,
  handleDeleteAsset,
  handleDeleteLot,
  handleSaveTransaction,
  handleLogoutConfirm,
  handleDimeReportUpload,
  onConfirmDimeImport,
  handleImport,
  handleExport,
  showToast,
  onSessionExpired,
  askConfirm,
  profileProps
}) {
  const currentSelectedAsset = useMemo(() => 
    selectedAsset ? (assets.find(a => a.id === selectedAsset.id) || null) : null, 
    [assets, selectedAsset]
  );

  const hasPrices = Object.keys(prices).length > 0;

  return (
    <>
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
          onClearAsset={handleClearAsset}
          onDeleteAsset={handleDeleteAsset}
        />
      )}

      {activeKpiDetail && (
        <KPIDetailsModal
          isOpen={!!activeKpiDetail}
          type={activeKpiDetail}
          onClose={() => setActiveKpiDetail(null)}
          assets={assets}
          prices={prices}
          exchangeRate={exchangeRate}
          totalUSD={totalUSD}
          totalCostUSD={totalCostUSD}
          todayChangeUSD={todayChangeUSD}
          todayChangePct={todayChangePct}
          totalGainUSD={totalGainUSD}
          totalGainPct={totalGainPct}
          totalGainTHB={totalGainTHB}
          totalRealizedUSD={totalRealizedUSD}
          totalUnrealizedUSD={totalUnrealizedUSD}
          bestAsset={bestAsset}
          sortedAssets={sortedAssets}
          donutSegments={donutSegments}
          initialCapitalUSD={initialCapitalUSD}
          historicalRates={historicalRates}
        />
      )}

      {currentSelectedAsset && (
        <AssetDetailPanel
          asset={currentSelectedAsset}
          price={
            (currentSelectedAsset.type === "fiat" || currentSelectedAsset.category === "fiat")
              ? prices[getCurrencyTicker(currentSelectedAsset.symbol)]
              : prices[currentSelectedAsset.symbol]
          }
          exchangeRate={exchangeRate}
          historicalRates={historicalRates}
          onClose={() => setSelectedAsset(null)}
          hideValues={hideValues}
          onEditLot={(asset, lot) => {
            setEditingAsset(asset);
            setEditingLot(lot);
            setModalOpen(true);
          }}
        />
      )}

      <InvestorProfileModal
        isOpen={investorModalOpen}
        onClose={() => setInvestorModalOpen(false)}
        askConfirm={askConfirm}
        totalUSD={totalUSD}
        totalGainUSD={totalGainUSD}
        totalGainPct={totalGainPct}
        assetsCount={sortedAssets.length}
        {...profileProps}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        handleClearPortfolio={handleClearPortfolio}
        handleClearAllData={handleClearAllData}
        onLogout={handleLogoutConfirm}
        handleDimeReportUpload={handleDimeReportUpload}
        {...profileProps}
      />

      {modalOpen && (
        <AssetModal
          isOpen={modalOpen}
          editingAsset={editingAsset}
          editingLot={editingLot}
          onClose={() => {
            setModalOpen(false);
            setEditingAsset(null);
            setEditingLot(null);
          }}
          onDeleteLot={async (assetId, lotId) => {
            if (await handleDeleteLot(assetId, lotId)) {
              setModalOpen(false);
              setEditingAsset(null);
              setEditingLot(null);
            }
          }}
          onSave={handleSaveTransaction}
          exchangeRate={exchangeRate}
          showToast={showToast}
          onSessionExpired={onSessionExpired}
        />
      )}

      {confirmConfig && (
        <CustomConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={() => {
            confirmConfig.resolve(true);
            setConfirmConfig(null);
          }}
          onCancel={() => {
            confirmConfig.resolve(false);
            setConfirmConfig(null);
          }}
        />
      )}

      <RetroOfficeWindows
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        hasPrices={hasPrices}
        totalUSD={totalUSD}
        exchangeRate={exchangeRate}
        totalCostUSD={totalCostUSD}
        todayChangeUSD={todayChangeUSD}
        todayChangePct={todayChangePct}
        totalGainUSD={totalGainUSD}
        totalGainTHB={totalGainTHB}
        totalGainPct={totalGainPct}
        bestAsset={bestAsset}
        assets={assets}
        sortedAssets={sortedAssets}
        prices={prices}
        sparklines={sparklines}
        priceFlash={priceFlash}
        refreshing={refreshing}
        hideValues={hideValues}
        hoveredSymbol={hoveredSymbol}
        hoveredCategory={hoveredCategory}
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
        setShowPnLDetailsModal={setShowPnLDetailsModal}
        setActiveKpiDetail={setActiveKpiDetail}
        setHoveredSymbol={setHoveredSymbol}
        setHoveredCategory={setHoveredCategory}
        fetchPrices={fetchPrices}
        setHideValues={setHideValues}
        setEditingAsset={setEditingAsset}
        setModalOpen={setModalOpen}
        sortConfig={sortConfig}
        handleSort={handleSort}
        handleDeleteAsset={handleDeleteAsset}
        totalRealizedUSD={totalRealizedUSD}
        totalUnrealizedUSD={totalUnrealizedUSD}
        initialCapitalUSD={initialCapitalUSD}
        handleDimeReportUpload={handleDimeReportUpload}
        handleImport={handleImport}
        handleExport={handleExport}
        dividendData={dividendData}
        dividendLoading={dividendLoading}
        fetchDividendEvents={fetchDividendEvents}
        showToast={showToast}
      />

      <DimeImportPreviewModal
        isOpen={!!dimePreviewData}
        transactions={dimePreviewData || []}
        existingAssets={assets}
        onClose={() => setDimePreviewData(null)}
        onConfirm={onConfirmDimeImport}
      />
    </>
  );
}
