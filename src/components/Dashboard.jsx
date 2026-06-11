import React, { useState, useEffect, useMemo } from "react";
import { PieChart } from "lucide-react";
import AssetModal from "./AssetModal";
import AssetDetailPanel from "./AssetDetailPanel";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { useProfile } from "../hooks/useProfile";
import { getCurrencyTicker, getDisplaySymbol } from "../utils/assetHelpers";
import { isTransactionDuplicate } from "../utils/portfolioTransactionHelpers";
import CustomConfirmModal from "./common/CustomConfirmModal";

import DashboardHeader from "./dashboard/DashboardHeader";
import KPIRow from "./dashboard/KPIRow";
import PortfolioSummary from "./dashboard/PortfolioSummary";
import DonutChart from "./dashboard/DonutChart";
import AssetTable from "./dashboard/AssetTable";
import PnLDetailsModal from "./dashboard/PnLDetailsModal";
import ProfileModal from "./dashboard/ProfileModal";
import PortfolioChart from "./charts/PortfolioChart";
import CostValueBar from "./dashboard/CostValueBar";
import TickerTape from "./dashboard/TickerTape";

export default function Dashboard({ user, onLogout, showToast, onSessionExpired }) {
  const [confirmConfig, setConfirmConfig] = useState(null);
  const askConfirm = (message, title = "ยืนยันการทำรายการ") => new Promise(r => setConfirmConfig({ title, message, resolve: r }));

  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem("hide_portfolio_values") === "true";
  });

  useEffect(() => {
    localStorage.setItem("hide_portfolio_values", hideValues ? "true" : "false");
  }, [hideValues]);

  // Hooks for Data & Profile
  const {
    assets, prices, sparklines, portfolioHistory, chartCategory, setChartCategory, exchangeRate, historicalRates,
    loading, refreshing, sparklineLoading, autoRefresh, setAutoRefresh, chartRange, sortConfig, priceFlash,
    getHistoricalRate, getRealizedPnLInTHB, handleClearAsset, handleDeleteAsset, handleDeleteLot, handleEditLot,
    handleRangeChange, handleSort, handleSaveAsset, fetchPrices, fetchSparklines, savePortfolio, totalUSD,
    totalCostUSD, todayChangeUSD, totalRealizedUSD, totalRealizedTHB, bestAsset, sortedAssets, donutSegments,
    initialCapitalUSD, totalUnrealizedUSD, totalUnrealizedTHB, totalGainTHB, totalGainUSD, totalGainPct, todayChangePct, isDirty
  } = usePortfolioData({ user, showToast, onSessionExpired, askConfirm });

  const filteredAssets = useMemo(() => {
    return chartCategory === "all"
      ? assets
      : assets.filter(a => (a.category || a.type || "stock") === chartCategory);
  }, [assets, chartCategory]);

  const {
    portfolioName, setPortfolioName, isEditingName, setIsEditingName, tempName, setTempName, profileModalOpen,
    setProfileModalOpen, profilePic, setProfilePic, avatarPreviewOpen, setAvatarPreviewOpen, avatarHovered,
    setAvatarHovered, presetModalOpen, setPresetModalOpen, nickname, setNickname, newNickname, setNewNickname,
    oldPassword, setOldPassword, newPassword, setNewPassword, handleSaveName, handleAvatarUpload, handleSaveProfile,
    handleChangePassword, syncProfileToServer
  } = useProfile({ user, showToast, onSessionExpired });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingLot, setEditingLot] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPnLDetailsModal, setShowPnLDetailsModal] = useState(false);
  const [hoveredSymbol, setHoveredSymbol] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const currentSelectedAsset = useMemo(() => {
    if (!selectedAsset) return null;
    return assets.find(a => a.id === selectedAsset.id) || null;
  }, [assets, selectedAsset]);

  /* ── CLEAR PORTFOLIO ── */
  const handleClearPortfolio = async () => {
    if (!await askConfirm("คุณต้องการล้างข้อมูลหุ้นและธุรกรรมทั้งหมดในพอร์ตใช่หรือไม่? (ชื่อเล่นและรูปโปรไฟล์ของคุณจะไม่ถูกลบ)", "⚠️ ยืนยันการล้างข้อมูลพอร์ต")) return;
    try {
      await savePortfolio([]); showToast("🗑️ ล้างข้อมูลพอร์ตหุ้นเรียบร้อยแล้ว!", "success"); setProfileModalOpen(false);
    } catch (err) { showToast("ล้างข้อมูลไม่สำเร็จ: " + err.message, "error"); }
  };

  /* ── CLEAR ALL DATA ── */
  const handleClearAllData = async () => {
    if (!await askConfirm("คำเตือน: คุณต้องการล้างข้อมูลทุกอย่างทั้งหมด (ทั้งข้อมูลหุ้น, ชื่อเล่น, และรูปโปรไฟล์) กลับเป็นค่าเริ่มต้นใช่หรือไม่?", "⚠️ ยืนยันการล้างข้อมูลทั้งหมด")) return;
    try {
      await savePortfolio([]); setProfilePic(""); setNickname(""); setNewNickname(""); setPortfolioName("StockVault");
      localStorage.removeItem(`profile_pic_${user.username}`); localStorage.removeItem(`profile_nickname_${user.username}`); localStorage.removeItem(`portfolio_name_${user.username}`);
      await syncProfileToServer("StockVault", "", ""); showToast("🗑️ ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว!", "success"); setProfileModalOpen(false);
    } catch (err) { showToast("ล้างข้อมูลไม่สำเร็จ: " + err.message, "error"); }
  };

  const handleLogoutConfirm = async () => { if (await askConfirm("คุณแน่ใจหรือไม่ที่จะออกจากระบบพอร์ตของคุณ?", "🚪 ยืนยันการออกจากระบบ")) onLogout(); };

  /* ── EXPORT / IMPORT ── */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ assets, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    showToast("📥 ส่งออกข้อมูลสำเร็จ", "success");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result).assets || JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) { showToast("ไฟล์ไม่ถูกต้อง", "error"); return; }
        await savePortfolio(imported); showToast(`✅ นำเข้า ${imported.length} รายการสำเร็จ`, "success"); fetchPrices(imported); fetchSparklines(imported, chartRange);
      } catch { showToast("ไฟล์ไม่ถูกต้อง", "error"); }
    };
    reader.readAsText(file); e.target.value = "";
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
        <TickerTape assets={sortedAssets} prices={prices} />

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
          isDirty={isDirty}
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
            hideValues={hideValues}
          />

          {hasPrices && (
            <CostValueBar
              totalUSD={totalUSD}
              totalCostUSD={totalCostUSD}
              totalGainUSD={totalGainUSD}
              totalGainPct={totalGainPct}
              hideValues={hideValues}
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

              <div className="card stagger-3">
                <DonutChart
                  segments={hasPrices && donutSegments.length > 0 ? donutSegments : []}
                  activeAssets={sortedAssets}
                  hasAssets={sortedAssets.length > 0}
                  hoveredSymbol={hoveredSymbol}
                  setHoveredSymbol={setHoveredSymbol}
                  hoveredCategory={hoveredCategory}
                  setHoveredCategory={setHoveredCategory}
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
                hoveredSymbol={hoveredSymbol}
                setHoveredSymbol={setHoveredSymbol}
                hoveredCategory={hoveredCategory}
                setHoveredCategory={setHoveredCategory}
              />
            </div>
          </div>
        </div>
      </div>

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
        onLogout={handleLogoutConfirm}
        askConfirm={askConfirm}
      />

      {modalOpen && (
        <AssetModal
          isOpen={modalOpen}
          editingAsset={editingAsset}
          editingLot={editingLot}
          onClose={() => { setModalOpen(false); setEditingAsset(null); setEditingLot(null); }}
          onDeleteLot={async (assetId, lotId) => {
            if (await handleDeleteLot(assetId, lotId)) {
              setModalOpen(false);
              setEditingAsset(null);
              setEditingLot(null);
            }
          }}
          onSave={async (formData) => {
            if (editingLot) {
              if (await handleEditLot(editingAsset.id, editingLot.id, formData)) {
                setModalOpen(false);
                setEditingAsset(null);
                setEditingLot(null);
              }
              return;
            }
            const isBatch = Array.isArray(formData);
            const transactions = isBatch ? formData : [formData];
            const cleanTransactions = [];

            for (const tx of transactions) {
              if (isTransactionDuplicate(tx, assets)) {
                const typeText = tx.transactionType === "BUY" 
                  ? ((tx.type === "fiat" || tx.category === "fiat") ? "ฝากเงินสด" : "ซื้อ")
                  : ((tx.type === "fiat" || tx.category === "fiat") ? "ถอนเงินสด" : "ขาย");
                const qtyText = (tx.type === "fiat" || tx.category === "fiat") ? `${tx.qty} THB` : `${tx.qty} หน่วย`;
                const priceText = (tx.type === "fiat" || tx.category === "fiat") ? "" : ` @ ${tx.symbol.endsWith(".BK") ? "฿" : "$"}${tx.avgPrice}`;

                const confirmMsg = `⚠️ ตรวจพบธุรกรรมที่อาจซ้ำซ้อน:\nมีรายการ ${typeText} ${tx.symbol} จำนวน ${qtyText}${priceText} วันที่ ${tx.date} ${tx.time ? "เวลา " + tx.time + " น." : ""} อยู่ในระบบแล้ว\n\nคุณต้องการบันทึกธุรกรรมนี้เพิ่มอีกรายการใช่หรือไม่?`;
                if (!await askConfirm(confirmMsg, "⚠️ ตรวจพบธุรกรรมซ้ำซ้อน")) {
                  continue;
                }
              }
              cleanTransactions.push(tx);
            }

            if (cleanTransactions.length === 0) {
              return;
            }

            const success = await handleSaveAsset(isBatch ? cleanTransactions : cleanTransactions[0]);
            if (success !== false) {
              setModalOpen(false);
              setEditingAsset(null);
            }
          }}
          exchangeRate={exchangeRate}
          showToast={showToast}
          onSessionExpired={onSessionExpired}
        />
      )}

      {confirmConfig && (
        <CustomConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={() => { confirmConfig.resolve(true); setConfirmConfig(null); }}
          onCancel={() => { confirmConfig.resolve(false); setConfirmConfig(null); }}
        />
      )}
    </>
  );
}
