import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, Percent, Calendar, Loader2 } from "lucide-react";
import { fmtUSD, fmtTHB, fmtPct } from "../../utils/formatters";
import DividendChart from "./DividendChart";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function DividendTracker({
  assets,
  prices,
  exchangeRate,
  hideValues,
  showToast,
  dividendData,
  dividendLoading,
  fetchDividendEvents
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Trigger dividend fetch on mount
  useEffect(() => {
    if (fetchDividendEvents && assets.length > 0) {
      fetchDividendEvents(assets);
    }
  }, [assets.length]);

  // Main calculations memo
  const calculations = useMemo(() => {
    const stockAssets = assets.filter(
      a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat"
    );

    let totalAnnualIncomeUSD = 0;
    let totalStockValueUSD = 0;
    const computedAssets = [];
    const upcomingPayments = [];

    // Monthly buckets for the next 12 months starting from current month
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0 - 11
    const currentYear = currentDate.getFullYear();

    const next12Months = [];
    for (let i = 0; i < 12; i++) {
      const m = (currentMonthIndex + i) % 12;
      const y = currentYear + Math.floor((currentMonthIndex + i) / 12);
      next12Months.push({ month: m, year: y, value: 0 });
    }

    stockAssets.forEach(asset => {
      const pData = prices[asset.symbol];
      const priceUSD = pData?.price || 0;
      const valueUSD = priceUSD * asset.qty;
      totalStockValueUSD += valueUSD;

      const events = dividendData?.[asset.symbol];
      if (!events) {
        computedAssets.push({
          ...asset,
          priceUSD,
          valueUSD,
          annualRate: 0,
          annualIncomeUSD: 0,
          yieldPct: 0,
          frequency: "N/A"
        });
        return;
      }

      // Convert events map to array and sort by date descending
      const eventList = Object.values(events).sort((a, b) => b.date - a.date);
      if (eventList.length === 0) return;

      const nowSec = Math.floor(Date.now() / 1000);
      const oneYearAgoSec = nowSec - 365 * 24 * 60 * 60;
      
      // Filter dividends paid in the last 1 year
      const lastYearDividends = eventList.filter(e => e.date >= oneYearAgoSec);
      
      let annualRate = 0;
      let frequencyCount = lastYearDividends.length;
      
      if (frequencyCount > 0) {
        annualRate = lastYearDividends.reduce((sum, e) => sum + (e.amount || 0), 0);
      } else {
        // Fallback: use last dividend amount and guess frequency
        const lastDiv = eventList[0];
        annualRate = (lastDiv?.amount || 0) * 4; // default to quarterly
        frequencyCount = 4;
      }

      const frequencyText = 
        frequencyCount >= 12 ? "รายเดือน" :
        frequencyCount >= 4 ? "รายไตรมาส" :
        frequencyCount >= 2 ? "ครึ่งปี" :
        frequencyCount === 1 ? "รายปี" : "ไม่แน่นอน";

      const annualIncomeUSD = annualRate * asset.qty;
      const yieldPct = priceUSD > 0 ? (annualRate / priceUSD) * 100 : 0;

      totalAnnualIncomeUSD += annualIncomeUSD;

      computedAssets.push({
        ...asset,
        priceUSD,
        valueUSD,
        annualRate,
        annualIncomeUSD,
        yieldPct,
        frequency: frequencyText
      });

      // Project payouts for the next 12 months based on historical months
      const historicalMonths = new Set();
      lastYearDividends.forEach(e => {
        const d = new Date(e.date * 1000);
        historicalMonths.add(d.getMonth());
      });

      // If no dividends in past year, fallback to last dividend's month
      if (historicalMonths.size === 0 && eventList.length > 0) {
        const d = new Date(eventList[0].date * 1000);
        historicalMonths.add(d.getMonth());
      }

      const lastAmount = eventList[0]?.amount || 0;
      const payoutPerCycle = lastAmount * asset.qty;

      next12Months.forEach(target => {
        if (historicalMonths.has(target.month)) {
          target.value += payoutPerCycle;
        }
      });

      // Project next upcoming payment
      if (eventList.length > 0 && frequencyCount > 0) {
        const lastEvent = eventList[0];
        const cycleDays = 365 / (frequencyCount || 4);
        
        let estExDateSec = lastEvent.date;
        while (estExDateSec <= nowSec) {
          estExDateSec += cycleDays * 24 * 60 * 60;
        }

        upcomingPayments.push({
          symbol: asset.symbol,
          name: asset.name || asset.symbol,
          estExDate: new Date(estExDateSec * 1000),
          amountPerShare: lastAmount,
          estPayoutUSD: payoutPerCycle
        });
      }
    });

    // Sort upcoming payments by date ascending
    upcomingPayments.sort((a, b) => a.estExDate - b.estExDate);

    const averageYield = totalStockValueUSD > 0 ? (totalAnnualIncomeUSD / totalStockValueUSD) * 100 : 0;
    const avgMonthlyIncomeUSD = totalAnnualIncomeUSD / 12;

    return {
      computedAssets,
      upcomingPayments: upcomingPayments.slice(0, 5), // top 5
      next12Months,
      totalAnnualIncomeUSD,
      averageYield,
      avgMonthlyIncomeUSD
    };
  }, [assets, prices, dividendData]);

  if (dividendLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 350, gap: 12 }}>
        <Loader2 className="spin" size={32} style={{ color: "var(--primary)" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>กำลังคำนวณเงินปันผล...</span>
      </div>
    );
  }

  // Find max monthly payout for bar chart scaling
  const maxMonthlyPayout = Math.max(...calculations.next12Months.map(m => m.value), 10);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 1. Summary Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifycontent: "center", color: "var(--primary)" }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="kpi-label">ประมาณการปันผลต่อปี</div>
            <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 22, fontWeight: 800 }}>
              {fmtUSD(calculations.totalAnnualIncomeUSD)}
            </div>
            <div className={`kpi-change positive ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 12 }}>
              ≈ {fmtTHB(calculations.totalAnnualIncomeUSD * exchangeRate)}
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,185,138,0.1)", display: "flex", alignItems: "center", justifycontent: "center", color: "var(--gain)" }}>
            <Percent size={20} />
          </div>
          <div>
            <div className="kpi-label">อัตราปันผลเฉลี่ยของพอร์ต</div>
            <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800 }}>
              {fmtPct(calculations.averageYield)}
            </div>
            <div className="kpi-change" style={{ fontSize: 12, color: "var(--text-muted)" }}>
              เทียบมูลค่าหุ้นปัจจุบัน
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifycontent: "center", color: "var(--gold)" }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="kpi-label">เฉลี่ยต่อเดือน</div>
            <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 22, fontWeight: 800 }}>
              {fmtUSD(calculations.avgMonthlyIncomeUSD)}
            </div>
            <div className={`kpi-change positive ${hideValues ? "privacy-blurred" : ""}`} style={{ fontSize: 12 }}>
              ≈ {fmtTHB(calculations.avgMonthlyIncomeUSD * exchangeRate)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chart and Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 20, flexWrap: "wrap" }} className="dashboard-grid">
        {/* Monthly Projection Chart */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
              📊 ประมาณการกระแสเงินสดรายเดือน (12 เดือนข้างหน้า)
            </h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>คลิกเพื่อดูรายละเอียด</span>
          </div>

          <DividendChart
            next12Months={calculations.next12Months}
            maxMonthlyPayout={maxMonthlyPayout}
            hideValues={hideValues}
            hoveredBar={hoveredBar}
            setHoveredBar={setHoveredBar}
          />
        </div>

        {/* Upcoming Ex-Dates Calendar */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
            📅 ปฏิทินปันผลเร็วๆ นี้
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
            {calculations.upcomingPayments.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-faint)", fontSize: 12, padding: "20px 0" }}>
                ไม่มีเงินปันผลที่กำลังจะจ่ายเร็วๆ นี้
              </div>
            ) : (
              calculations.upcomingPayments.map((pay, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(0,0,0,0.02)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text-main)" }}>{pay.symbol}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      ประมาณ {pay.estExDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className={hideValues ? "privacy-blurred" : ""} style={{ fontWeight: 700, fontSize: 13, color: "var(--gain)" }}>
                      +{fmtUSD(pay.estPayoutUSD)}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {fmtUSD(pay.amountPerShare)}/หุ้น
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Detailed Yield Table */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", marginBottom: 16 }}>
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
                  <th style={{ textAlign: "right" }}>ราคา</th>
                  <th style={{ textAlign: "right" }}>จำนวนที่ถือ</th>
                  <th style={{ textAlign: "right" }}>อัตราปันผล/หุ้น</th>
                  <th style={{ textAlign: "right" }}>อัตราผลตอบแทน (Yield)</th>
                  <th style={{ textAlign: "right" }}>ปันผลคาดการณ์ต่อปี</th>
                  <th style={{ textAlign: "right" }}>รอบจ่าย</th>
                </tr>
              </thead>
              <tbody>
                {calculations.computedAssets.map((asset, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 800 }}>{asset.symbol}</td>
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
    </div>
  );
}
