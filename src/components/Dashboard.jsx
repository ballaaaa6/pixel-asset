import React, { useState, useEffect, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import AssetModal from "./AssetModal";
import AssetDetailPanel from "./AssetDetailPanel";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { useProfile } from "../hooks/useProfile";
import { getCurrencyTicker } from "../utils/assetHelpers";
import { isTransactionDuplicate } from "../utils/portfolioTransactionHelpers";
import CustomConfirmModal from "./common/CustomConfirmModal";
import { parseDimePdfReport, parseDimeTextReport } from "../utils/dimePdfParser";
import DimeImportPreviewModal from "./modal/DimeImportPreviewModal";



import Sidebar from "./dashboard/Sidebar";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardMainView from "./dashboard/DashboardMainView";
import DividendTracker from "./dashboard/DividendTracker";
import PortfolioCorrelation from "./dashboard/PortfolioCorrelation";
import StockAnalyzer from "./dashboard/StockAnalyzer";
import PnLDetailsModal from "./dashboard/PnLDetailsModal";
import KPIDetailsModal from "./dashboard/KPIDetailsModal";
import ProfileModal from "./dashboard/ProfileModal";
import InvestorProfileModal from "./dashboard/InvestorProfileModal";
import TickerTape from "./dashboard/TickerTape";

export default function Dashboard({ user, onLogout, showToast, onSessionExpired }) {
  const [confirmConfig, setConfirmConfig] = useState(null);
  const askConfirm = (message, title = "ยืนยันการทำรายการ") => new Promise(r => setConfirmConfig({ title, message, resolve: r }));

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    initialCapitalUSD, totalUnrealizedUSD, totalUnrealizedTHB, totalGainTHB, totalGainUSD, totalGainPct, todayChangePct, isDirty,
    dividendData, dividendLoading, fetchDividendEvents
  } = usePortfolioData({ user, showToast, onSessionExpired, askConfirm });

  const filteredAssets = useMemo(() => {
    return chartCategory === "all"
      ? assets
      : assets.filter(a => (a.category || a.type || "stock") === chartCategory);
  }, [assets, chartCategory]);

  const profileProps = useProfile({ user, showToast, onSessionExpired });
  const {
    portfolioName, setPortfolioName, isEditingName, setIsEditingName, tempName, setTempName,
    profileModalOpen, setProfileModalOpen, investorModalOpen, setInvestorModalOpen,
    profilePic, setProfilePic, nickname, setNickname, newNickname, setNewNickname,
    handleSaveName, syncProfileToServer
  } = profileProps;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingLot, setEditingLot] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPnLDetailsModal, setShowPnLDetailsModal] = useState(false);
  const [activeKpiDetail, setActiveKpiDetail] = useState(null);
  const [hoveredSymbol, setHoveredSymbol] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dimePreviewData, setDimePreviewData] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleSaveTransaction = async (formData) => {
    if (editingLot) {
      if (await handleEditLot(editingAsset.id, editingLot.id, formData)) {
        setModalOpen(false); setEditingAsset(null); setEditingLot(null);
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
        if (!await askConfirm(confirmMsg, "⚠️ ตรวจพบธุรกรรมซ้ำซ้อน")) continue;
      }
      cleanTransactions.push(tx);
    }
    if (cleanTransactions.length === 0) return;
    const success = await handleSaveAsset(isBatch ? cleanTransactions : cleanTransactions[0]);
    if (success !== false) { setModalOpen(false); setEditingAsset(null); }
  };

  const handleLogoutConfirm = async () => { if (await askConfirm("คุณแน่ใจหรือไม่ที่จะออกจากระบบพอร์ตของคุณ?", "🚪 ยืนยันการออกจากระบบ")) onLogout(); };

  const handleDimeReportUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast("กำลังอ่านไฟล์ Dime PDF...", "info");
      const parsed = file.name.endsWith(".pdf") ? await parseDimePdfReport(file) : parseDimeTextReport(await file.text());
      if (parsed.length === 0) { showToast("ไม่พบรายการธุรกรรมที่ถูกต้อง — ตรวจสอบรูปแบบไฟล์อีกครั้ง", "error"); return; }
      setDimePreviewData(parsed);
      setProfileModalOpen(false); // close settings modal to show preview
    } catch (err) { showToast("เกิดข้อผิดพลาด: " + err.message, "error"); }
    finally { e.target.value = ""; }
  };

  const onConfirmDimeImport = async (toImport) => {
    setDimePreviewData(null);
    if (toImport.length === 0) return;
    if (await handleSaveAsset(toImport)) {
      showToast(`นำเข้าสำเร็จ ${toImport.length} รายการ`, "success");
    }
  };

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
      <div className="app-layout-wrapper">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
          user={user}
          nickname={nickname}
          profilePic={profilePic}
          setInvestorModalOpen={setInvestorModalOpen}
          setProfileModalOpen={setProfileModalOpen}
        />

        <div className="main-content-wrapper">
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
            setInvestorModalOpen={setInvestorModalOpen}
            isDirty={isDirty}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="main-content-scrollable">
            {activeTab === "dashboard" ? (
              <DashboardMainView
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
                donutSegments={donutSegments}
                filteredAssets={filteredAssets}
                portfolioHistory={portfolioHistory}
                chartRange={chartRange}
                handleRangeChange={handleRangeChange}
                chartCategory={chartCategory}
                setChartCategory={setChartCategory}
                hideValues={hideValues}
                setActiveKpiDetail={setActiveKpiDetail}
                setShowPnLDetailsModal={setShowPnLDetailsModal}
                hoveredSymbol={hoveredSymbol}
                setHoveredSymbol={setHoveredSymbol}
                hoveredCategory={hoveredCategory}
                setHoveredCategory={setHoveredCategory}
                setSelectedAsset={setSelectedAsset}
                selectedAsset={selectedAsset}
                priceFlash={priceFlash}
                prices={prices}
                refreshing={refreshing}
                fetchPrices={fetchPrices}
                setHideValues={setHideValues}
                setEditingAsset={setEditingAsset}
                setModalOpen={setModalOpen}
                sortConfig={sortConfig}
                handleSort={handleSort}
                handleDeleteAsset={handleDeleteAsset}
                sparklines={sparklines}
                totalRealizedUSD={totalRealizedUSD}
                totalUnrealizedUSD={totalUnrealizedUSD}
                initialCapitalUSD={initialCapitalUSD}
              />
            ) : activeTab === "dividends" ? (
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
            ) : activeTab === "correlation" ? (
              <PortfolioCorrelation
                assets={sortedAssets}
                exchangeRate={exchangeRate}
                hideValues={hideValues}
              />
            ) : activeTab === "analyzer" ? (
              <StockAnalyzer showToast={showToast} />
            ) : null}
          </div>
        </div>
      </div>

      {showPnLDetailsModal && (
        <PnLDetailsModal
          isOpen={showPnLDetailsModal} onClose={() => setShowPnLDetailsModal(false)}
          assets={assets} prices={prices} exchangeRate={exchangeRate} historicalRates={historicalRates}
          totalUSD={totalUSD} totalCostUSD={totalCostUSD} totalRealizedUSD={totalRealizedUSD}
          totalUnrealizedUSD={totalUnrealizedUSD} totalGainUSD={totalGainUSD} totalGainPct={totalGainPct}
          initialCapitalUSD={initialCapitalUSD} onClearAsset={handleClearAsset} onDeleteAsset={handleDeleteAsset}
        />
      )}

      {activeKpiDetail && (
        <KPIDetailsModal
          isOpen={!!activeKpiDetail} type={activeKpiDetail} onClose={() => setActiveKpiDetail(null)}
          assets={assets} prices={prices} exchangeRate={exchangeRate} totalUSD={totalUSD}
          totalCostUSD={totalCostUSD} todayChangeUSD={todayChangeUSD} todayChangePct={todayChangePct}
          totalGainUSD={totalGainUSD} totalGainPct={totalGainPct} totalGainTHB={totalGainTHB}
          totalRealizedUSD={totalRealizedUSD} totalUnrealizedUSD={totalUnrealizedUSD}
          bestAsset={bestAsset} sortedAssets={sortedAssets} donutSegments={donutSegments}
          initialCapitalUSD={initialCapitalUSD} historicalRates={historicalRates}
        />
      )}

      {currentSelectedAsset && (
        <AssetDetailPanel
          asset={currentSelectedAsset}
          price={(currentSelectedAsset.type === "fiat" || currentSelectedAsset.category === "fiat") ? prices[getCurrencyTicker(currentSelectedAsset.symbol)] : prices[currentSelectedAsset.symbol]}
          exchangeRate={exchangeRate} historicalRates={historicalRates}
          onClose={() => setSelectedAsset(null)} hideValues={hideValues}
          onEditLot={(asset, lot) => { setEditingAsset(asset); setEditingLot(lot); setModalOpen(true); }}
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
        onClose={() => setSidebarOpen(false) || setProfileModalOpen(false)}
        handleClearPortfolio={handleClearPortfolio}
        handleClearAllData={handleClearAllData}
        onLogout={handleLogoutConfirm}
        handleDimeReportUpload={handleDimeReportUpload}
        {...profileProps}
      />

      {modalOpen && (
        <AssetModal
          isOpen={modalOpen} editingAsset={editingAsset} editingLot={editingLot}
          onClose={() => { setModalOpen(false); setEditingAsset(null); setEditingLot(null); }}
          onDeleteLot={async (assetId, lotId) => {
            if (await handleDeleteLot(assetId, lotId)) { setModalOpen(false); setEditingAsset(null); setEditingLot(null); }
          }}
          onSave={handleSaveTransaction}
          exchangeRate={exchangeRate} showToast={showToast} onSessionExpired={onSessionExpired}
        />
      )}

      {confirmConfig && (
        <CustomConfirmModal
          title={confirmConfig.title} message={confirmConfig.message}
          onConfirm={() => { confirmConfig.resolve(true); setConfirmConfig(null); }}
          onCancel={() => { confirmConfig.resolve(false); setConfirmConfig(null); }}
        />
      )}

      {showScrollTop && (
        <button onClick={scrollToTop} className="scroll-to-top-btn" title="เลื่อนขึ้นบนสุด">
          <ArrowUp size={20} />
        </button>
      )}

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
