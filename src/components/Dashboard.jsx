import React, { useState, useEffect, useMemo } from "react";
import { PieChart } from "lucide-react";
import AssetModal from "./AssetModal";
import AssetDetailPanel from "./AssetDetailPanel";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { useProfile } from "../hooks/useProfile";
import { getCurrencyTicker, getDisplaySymbol } from "../utils/assetHelpers";

import DashboardHeader from "./dashboard/DashboardHeader";
import KPIRow from "./dashboard/KPIRow";
import PortfolioSummary from "./dashboard/PortfolioSummary";
import DonutChart from "./dashboard/DonutChart";
import AssetTable from "./dashboard/AssetTable";
import PnLDetailsModal from "./dashboard/PnLDetailsModal";
import ProfileModal from "./dashboard/ProfileModal";
import PortfolioChart from "./charts/PortfolioChart";

export default function Dashboard({ user, onLogout, showToast, onSessionExpired }) {
  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem("hide_portfolio_values") === "true";
  });

  useEffect(() => {
    localStorage.setItem("hide_portfolio_values", hideValues ? "true" : "false");
  }, [hideValues]);

  // Hooks for Data & Profile
  const {
    assets,
    prices,
    sparklines,
    portfolioHistory,
    chartCategory,
    setChartCategory,
    exchangeRate,
    historicalRates,
    loading,
    refreshing,
    sparklineLoading,
    autoRefresh,
    setAutoRefresh,
    chartRange,
    sortConfig,
    priceFlash,
    getHistoricalRate,
    getRealizedPnLInTHB,
    handleClearAsset,
    handleDeleteAsset,
    handleRangeChange,
    handleSort,
    handleSaveAsset,
    fetchPrices,
    fetchSparklines,
    savePortfolio,
    totalUSD,
    totalCostUSD,
    todayChangeUSD,
    totalRealizedUSD,
    totalRealizedTHB,
    bestAsset,
    sortedAssets,
    donutSegments,
    initialCapitalUSD,
    totalUnrealizedUSD,
    totalUnrealizedTHB,
    totalGainTHB,
    totalGainUSD,
    totalGainPct,
    todayChangePct
  } = usePortfolioData({ user, showToast, onSessionExpired });

  const filteredAssets = useMemo(() => {
    return chartCategory === "all"
      ? assets
      : assets.filter(a => (a.category || a.type || "stock") === chartCategory);
  }, [assets, chartCategory]);

  const {
    portfolioName,
    setPortfolioName,
    isEditingName,
    setIsEditingName,
    tempName,
    setTempName,
    profileModalOpen,
    setProfileModalOpen,
    profilePic,
    setProfilePic,
    avatarPreviewOpen,
    setAvatarPreviewOpen,
    avatarHovered,
    setAvatarHovered,
    presetModalOpen,
    setPresetModalOpen,
    nickname,
    setNickname,
    newNickname,
    setNewNickname,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    handleSaveName,
    handleAvatarUpload,
    handleSaveProfile,
    handleChangePassword,
    syncProfileToServer
  } = useProfile({ user, showToast, onSessionExpired });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPnLDetailsModal, setShowPnLDetailsModal] = useState(false);

  /* ── CLEAR PORTFOLIO ── */
  const handleClearPortfolio = async () => {
    if (!confirm("⚠️ คุณต้องการล้างข้อมูลหุ้นและธุรกรรมทั้งหมดในพอร์ตใช่หรือไม่? (ชื่อเล่นและรูปโปรไฟล์ของคุณจะไม่ถูกลบ)")) return;
    try {
      await savePortfolio([]);
      showToast("🗑️ ล้างข้อมูลพอร์ตหุ้นเรียบร้อยแล้ว!", "success");
      setProfileModalOpen(false);
    } catch (err) {
      showToast("ล้างข้อมูลไม่สำเร็จ: " + err.message, "error");
    }
  };

  /* ── CLEAR ALL DATA ── */
  const handleClearAllData = async () => {
    if (!confirm("⚠️ คำเตือน: คุณต้องการล้างข้อมูลทุกอย่างทั้งหมด (ทั้งข้อมูลหุ้น, ชื่อเล่น, และรูปโปรไฟล์) กลับเป็นค่าเริ่มต้นใช่หรือไม่?")) return;
    try {
      await savePortfolio([]);
      setProfilePic("");
      setNickname("");
      setNewNickname("");
      setPortfolioName("StockVault");
      localStorage.removeItem(`profile_pic_${user.username}`);
      localStorage.removeItem(`profile_nickname_${user.username}`);
      localStorage.removeItem(`portfolio_name_${user.username}`);
      await syncProfileToServer("StockVault", "", "");
      showToast("🗑️ ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว!", "success");
      setProfileModalOpen(false);
    } catch (err) {
      showToast("ล้างข้อมูลไม่สำเร็จ: " + err.message, "error");
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
        await savePortfolio(imported);
        showToast(`✅ นำเข้า ${imported.length} รายการสำเร็จ`, "success");
        fetchPrices(imported);
        fetchSparklines(imported, chartRange);
      } catch { showToast("ไฟล์ไม่ถูกต้อง", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

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
    <>
      <div className="fade-in">
        <DashboardHeader
          portfolioName={portfolioName}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          tempName={tempName}
          setTempName={setTempName}
          handleSaveName={handleSaveName}
          nickname={nickname}
          user={user}
          profilePic={profilePic}
          setProfileModalOpen={setProfileModalOpen}
        />

        <div className="app-container">
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
          />

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

              <div className="card stagger-3">
                <DonutChart
                  segments={hasPrices && donutSegments.length > 0 ? donutSegments : []}
                  activeAssets={sortedAssets}
                  hasAssets={sortedAssets.length > 0}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card stagger-2" style={{ padding: "16px 14px 10px" }}>
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
              </div>

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
              />
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <AssetModal
          isOpen={modalOpen}
          editingAsset={editingAsset}
          onClose={() => { setModalOpen(false); setEditingAsset(null); }}
          onSave={handleSaveAsset}
          exchangeRate={exchangeRate}
          showToast={showToast}
          onSessionExpired={onSessionExpired}
        />
      )}

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

      {selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset}
          price={
            (selectedAsset.type === "fiat" || selectedAsset.category === "fiat")
              ? prices[getCurrencyTicker(selectedAsset.symbol)]
              : prices[selectedAsset.symbol]
          }
          exchangeRate={exchangeRate}
          historicalRates={historicalRates}
          onClose={() => setSelectedAsset(null)}
          hideValues={hideValues}
        />
      )}

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profilePic={profilePic}
        setProfilePic={setProfilePic}
        nickname={nickname}
        newNickname={newNickname}
        setNewNickname={setNewNickname}
        oldPassword={oldPassword}
        setOldPassword={setOldPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        avatarHovered={avatarHovered}
        setAvatarHovered={setAvatarHovered}
        avatarPreviewOpen={avatarPreviewOpen}
        setAvatarPreviewOpen={setAvatarPreviewOpen}
        presetModalOpen={presetModalOpen}
        setPresetModalOpen={setPresetModalOpen}
        handleAvatarUpload={handleAvatarUpload}
        handleSaveProfile={handleSaveProfile}
        handleChangePassword={handleChangePassword}
        handleExport={handleExport}
        handleImport={handleImport}
        handleClearPortfolio={handleClearPortfolio}
        handleClearAllData={handleClearAllData}
        onLogout={onLogout}
      />
    </>
  );
}
