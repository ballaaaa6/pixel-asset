import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, Percent, Calendar, Loader2 } from "lucide-react";
import { fmtUSD, fmtTHB, fmtPct } from "../../utils/formatters";
import DividendSafetyScanner from "./DividendSafetyScanner";
import DividendDiversification from "./DividendDiversification";
import DividendGrowthTrend from "./DividendGrowthTrend";
import DividendCalendarMatrix from "./DividendCalendarMatrix";
import { calculateDividendProjections } from "../../utils/dividendHelpers";
import { 
  YieldComparisonModal, 
  IncomeShareModal,
  UpcomingPayoutModal 
} from "./DividendDetailModals";

export default function DividendTracker({
  assets,
  prices,
  exchangeRate,
  hideValues,
  showToast,
  dividendData,
  dividendLoading,
  fetchDividendEvents,
  setSelectedAsset
}) {
  // Interactive Modal States
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedUpcomingPayout, setSelectedUpcomingPayout] = useState(null);

  // Trigger dividend fetch on mount
  useEffect(() => {
    if (fetchDividendEvents && assets.length > 0) {
      fetchDividendEvents(assets);
    }
  }, [assets.length]);

  // Offload calculations to dividendHelpers
  const calculations = useMemo(() => {
    return calculateDividendProjections(assets, prices, dividendData, exchangeRate);
  }, [assets, prices, dividendData, exchangeRate]);

  if (dividendLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 350, gap: 12 }}>
        <Loader2 className="spin" size={32} style={{ color: "var(--primary)" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>กำลังคำนวณเงินปันผล...</span>
      </div>
    );
  }

  const getDaysDiff = (targetDate) => {
    const diffTime = targetDate - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* 1. Summary Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {/* Card 1: Annual Income */}
        <div 
          className="kpi-card clickable" 
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", cursor: "pointer" }}
          onClick={() => setShowShareModal(true)}
          title="คลิกเพื่อดูสัดส่วนรายได้ปันผล"
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="kpi-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>ประมาณการปันผลต่อปี 🔍</div>
            <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 22, fontWeight: 800 }}>
              {fmtUSD(calculations.totalAnnualIncomeUSD)}
            </div>
            <div className={`kpi-change positive ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 12 }}>
              ≈ {fmtTHB(calculations.totalAnnualIncomeUSD * exchangeRate)}
            </div>
          </div>
        </div>

        {/* Card 2: Average Portfolio Yield */}
        <div 
          className="kpi-card clickable" 
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", cursor: "pointer" }}
          onClick={() => setShowYieldModal(true)}
          title="คลิกเพื่อวิเคราะห์ Yield on Cost"
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,185,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gain)" }}>
            <Percent size={20} />
          </div>
          <div>
            <div className="kpi-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>อัตราปันผลเฉลี่ยของพอร์ต 🔍</div>
            <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800 }}>
              {fmtPct(calculations.averageYield)}
            </div>
            <div className="kpi-change" style={{ fontSize: 12, color: "var(--text-muted)" }}>
              เทียบมูลค่าหุ้นปัจจุบัน
            </div>
          </div>
        </div>

        {/* Card 3: Average Monthly Income */}
        <div 
          className="kpi-card clickable" 
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", cursor: "pointer" }}
          onClick={() => setShowShareModal(true)}
          title="คลิกเพื่อดูสัดส่วนรายได้ปันผล"
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="kpi-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>เฉลี่ยต่อเดือน 🔍</div>
            <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 22, fontWeight: 800 }}>
              {fmtUSD(calculations.avgMonthlyIncomeUSD)}
            </div>
            <div className={`kpi-change positive ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 12 }}>
              ≈ {fmtTHB(calculations.avgMonthlyIncomeUSD * exchangeRate)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three Interactive Analytics Blocks (Safety, Diversification, Growth) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }} className="dashboard-grid">
        <DividendSafetyScanner 
          safetyScore={calculations.safetyScore}
          flaggedCount={calculations.flaggedCount}
          computedAssets={calculations.computedAssets}
          hideValues={hideValues}
        />
        
        <DividendDiversification 
          sectorBreakdown={calculations.sectorBreakdown}
          typeBreakdown={calculations.typeBreakdown}
          computedAssets={calculations.computedAssets}
          totalAnnualIncomeUSD={calculations.totalAnnualIncomeUSD}
        />

        <DividendGrowthTrend 
          yocLeaderboard={calculations.yocLeaderboard}
          computedAssets={calculations.computedAssets}
          averageYield={calculations.averageYield}
          hideValues={hideValues}
        />
      </div>

      {/* 3. Rolling Calendar Grid & Upcoming Ex-Dates Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 20 }} className="dashboard-grid">
        {/* Calendar Matrix */}
        <DividendCalendarMatrix 
          next12Months={calculations.next12Months}
          hideValues={hideValues}
          exchangeRate={exchangeRate}
        />

        {/* Upcoming Ex-Dates Calendar */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            📅 ปฏิทินปันผลเร็วๆ นี้
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1, maxHeight: 420 }}>
            {calculations.upcomingPayments.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-faint)", fontSize: 12, padding: "20px 0" }}>
                ไม่มีเงินปันผลที่กำลังจะจ่ายเร็วๆ นี้
              </div>
            ) : (
              calculations.upcomingPayments.map((pay, i) => (
                <div 
                  key={i} 
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(0,0,0,0.02)", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => setSelectedUpcomingPayout(pay)}
                  className="ripple-btn"
                  title="คลิกเพื่อดูรายละเอียดปันผลถัดไป"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text-main)" }}>{pay.symbol}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      XD {pay.estExDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className={hideValues ? "privacy-blurred" : ""} style={{ fontWeight: 700, fontSize: 13, color: "var(--gain)" }}>
                      +{fmtUSD(pay.estPayoutUSD)}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                      {getDaysDiff(pay.estExDate) > 0 ? `อีก ${getDaysDiff(pay.estExDate)} วัน` : "XD แล้ว"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Detailed Yield Table */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", marginBottom: 16, marginTop: 0 }}>
          💼 สรุปอัตราปันผลรายสินทรัพย์
        </h3>
        
        {calculations.computedAssets.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
            ยังไม่มีข้อมูลสินทรัพย์ที่จ่ายเงินปันผลในพอร์ต
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="asset-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>สินทรัพย์</th>
                  <th style={{ textAlign: "right" }}>ราคาปัจจุบัน</th>
                  <th style={{ textAlign: "right" }}>จำนวนที่ถือ</th>
                  <th style={{ textAlign: "right" }}>อัตราปันผล/หุ้น</th>
                  <th style={{ textAlign: "right" }}>อัตราผลตอบแทน (Yield)</th>
                  <th style={{ textAlign: "right" }}>ปันผลคาดการณ์ต่อปี</th>
                  <th style={{ textAlign: "right" }}>รอบจ่าย</th>
                </tr>
              </thead>
              <tbody>
                {calculations.computedAssets.map((asset, i) => (
                  <tr 
                    key={i} 
                    style={{ cursor: "pointer" }} 
                    onClick={() => setSelectedAsset(asset)}
                    title="คลิกเพื่อดูรายละเอียดประวัติสินทรัพย์"
                  >
                    <td style={{ fontWeight: 800, color: "var(--primary)" }}>{asset.symbol}</td>
                    <td style={{ textAlign: "right" }}>{fmtUSD(asset.priceUSD)}</td>
                    <td style={{ textAlign: "right" }}>{asset.qty.toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>{fmtUSD(asset.annualRate)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                      {fmtPct(asset.yieldPct)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "var(--gain)" }} className={hideValues ? "privacy-blurred" : ""}>
                      {fmtUSD(asset.annualIncomeUSD)}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
                      {asset.frequency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showYieldModal && (
        <YieldComparisonModal
          isOpen={showYieldModal}
          onClose={() => setShowYieldModal(false)}
          computedAssets={calculations.computedAssets}
          hideValues={hideValues}
          exchangeRate={exchangeRate}
        />
      )}

      {showShareModal && (
        <IncomeShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          computedAssets={calculations.computedAssets}
          hideValues={hideValues}
          totalAnnualIncomeUSD={calculations.totalAnnualIncomeUSD}
        />
      )}

      {selectedUpcomingPayout !== null && (
        <UpcomingPayoutModal
          isOpen={selectedUpcomingPayout !== null}
          onClose={() => setSelectedUpcomingPayout(null)}
          selectedUpcomingPayout={selectedUpcomingPayout}
          hideValues={hideValues}
          exchangeRate={exchangeRate}
          assets={assets}
          setSelectedAsset={setSelectedAsset}
        />
      )}
    </div>
  );
}
