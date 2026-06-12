import React, { useState, useMemo } from "react";
import { CheckCircle2, ChevronRight, TrendingUp } from "lucide-react";
import { fmtUSD, fmtTHB } from "../../utils/formatters";

export default function DividendMilestones({ totalAnnualIncomeUSD, totalStockValueUSD, averageYield, exchangeRate, hideValues }) {
  const [years, setYears] = useState(10);
  const [showSimulator, setShowSimulator] = useState(false);

  const annualTHB = totalAnnualIncomeUSD * exchangeRate;

  // Define milestones
  const milestones = useMemo(() => [
    { id: "coffee", label: "☕ ค่ากาแฟรายวัน", amountTHB: 1200, desc: "฿100/เดือน (กาแฟร้อนยามเช้า)" },
    { id: "buffet", label: "🍣 บุฟเฟต์ฉลองสิ้นเดือน", amountTHB: 8400, desc: "฿700/เดือน (ฉลองมื้ออร่อยประจำเดือน)" },
    { id: "internet", label: "🌐 ค่าเน็ตบ้านรายปี", amountTHB: 15000, desc: "฿1,250/เดือน (เน็ตความเร็วสูงไม่สะดุด)" },
    { id: "trip", label: "✈️ ทริปพักผ่อนต่างจังหวัด", amountTHB: 36000, desc: "฿3,000/เดือน (พักโรงแรมหรูริมหาดปีละครั้ง)" },
    { id: "car", label: "🚗 ผ่อนงวดรถรายปี", amountTHB: 120000, desc: "฿10,000/เดือน (ช่วยแบ่งเบาภาระผ่อนรถ)" },
    { id: "fi", label: "🏝️ อิสรภาพทางการเงินขั้นต้น", amountTHB: 300000, desc: "฿25,000/เดือน (ครอบคลุมค่าใช้จ่ายจำเป็นพื้นฐาน)" }
  ], []);

  // Calculate compound simulator details
  const simulation = useMemo(() => {
    let shares = 1;
    let priceFactor = 1;
    let divPerShareFactor = 1;
    const growthPrice = 0.07; // 7% stock price appreciation
    const growthDiv = 0.05;   // 5% annual dividend growth

    for (let i = 1; i <= years; i++) {
      priceFactor *= (1 + growthPrice);
      divPerShareFactor *= (1 + growthDiv);
      // Total payout received in year t
      const divPayoutUSD = shares * totalAnnualIncomeUSD * divPerShareFactor;
      // Portfolio value at year t before reinvesting
      const portValUSD = totalStockValueUSD * priceFactor;
      // Reinvest dividends to buy more shares: delta shares = divPayoutUSD / share price
      // (Share Price = portValUSD / current shares)
      const sharePrice = portValUSD / shares;
      const sharesBought = sharePrice > 0 ? divPayoutUSD / sharePrice : 0;
      shares += sharesBought;
    }

    const cashIncomeUSD = totalAnnualIncomeUSD * divPerShareFactor;
    const cashValUSD = totalStockValueUSD * priceFactor;

    const dripIncomeUSD = totalAnnualIncomeUSD * divPerShareFactor * shares;
    const dripValUSD = totalStockValueUSD * priceFactor * shares;

    return {
      cashIncomeUSD,
      cashValUSD,
      dripIncomeUSD,
      dripValUSD,
      multiplier: shares
    };
  }, [totalAnnualIncomeUSD, totalStockValueUSD, averageYield, years]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexWrap: "wrap" }} className="dashboard-grid">
      {/* Left: Milestones Card */}
      <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
          🏆 เป้าหมายกระแสเงินสดปันผล (Milestones)
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          เปรียบเทียบดูว่าเงินปันผลรายปีของคุณครอบคลุมค่าใช้จ่ายอะไรในชีวิตจริงได้บ้างแล้ว
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1, maxHeight: 350 }}>
          {milestones.map((m) => {
            const isCompleted = annualTHB >= m.amountTHB;
            const pct = Math.min((annualTHB / m.amountTHB) * 100, 100);
            return (
              <div 
                key={m.id} 
                style={{ 
                  padding: "12px 14px", 
                  background: isCompleted ? "rgba(0, 185, 138, 0.05)" : "rgba(0,0,0,0.01)", 
                  borderRadius: 12, 
                  border: isCompleted ? "1px dashed var(--gain)" : "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} style={{ color: "var(--gain)", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid var(--text-faint)", flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 800, fontSize: 13, color: isCompleted ? "var(--text-main)" : "var(--text-muted)" }}>
                      {m.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isCompleted ? "var(--gain)" : "var(--text-faint)" }}>
                    {m.desc}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                    <div 
                      style={{ 
                        width: `${pct}%`, 
                        height: "100%", 
                        background: isCompleted ? "var(--gain)" : "var(--primary)",
                        borderRadius: 3
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: isCompleted ? "var(--gain)" : "var(--text-muted)", minWidth: 32, textAlign: "right" }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: DRIP Simulator Card */}
      <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
            ⏳ เครื่องมือจำลองการปันผลทบต้น (DRIP Calculator)
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>สมมติฐาน: ราคาหุ้นโต 7%/ปี, ปันผลโต 5%/ปี</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "var(--text-muted)" }}>ระยะเวลาจำลองพอร์ต:</span>
              <span style={{ color: "var(--primary)" }}>{years} ปี</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[5, 10, 15, 20].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: years === y ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    background: years === y ? "var(--primary-light)" : "white",
                    color: years === y ? "var(--primary)" : "var(--text-muted)",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {y} ปี
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.01)", border: "1px dashed var(--border)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)", borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: 6 }}>
              ผลลัพธ์ในอีก {years} ปีข้างหน้า (เปรียบเทียบ)
            </div>

            {/* Cash Out Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>ถอนเงินปันผลออกมาใช้ (Cash Out)</span>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>มูลค่าหุ้นปลายทาง: {hideValues ? "****" : fmtUSD(simulation.cashValUSD)}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>
                  {fmtUSD(simulation.cashIncomeUSD)}/ปี
                </span>
                <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 11, color: "var(--text-faint)", display: "block" }}>
                  ≈ {fmtTHB(simulation.cashIncomeUSD * exchangeRate)}
                </span>
              </div>
            </div>

            {/* DRIP Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(82, 54, 255, 0.04)", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(82, 54, 255, 0.1)" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}>
                  ลงทุนปันผลทบต้น (DRIP) <TrendingUp size={14} style={{ color: "var(--gain)" }} />
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>มูลค่าหุ้นทบต้น: {hideValues ? "****" : fmtUSD(simulation.dripValUSD)}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 16, fontWeight: 800, color: "var(--gain)" }}>
                  {fmtUSD(simulation.dripIncomeUSD)}/ปี
                </span>
                <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 11, color: "var(--gain)", fontWeight: 700, display: "block" }}>
                  ≈ {fmtTHB(simulation.dripIncomeUSD * exchangeRate)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, display: "flex", gap: 6 }}>
            💡 <span>การทำ <strong>DRIP</strong> ช่วยให้คุณได้ครอบครองหุ้นเพิ่มขึ้นอีก {simulation.multiplier.toFixed(2)} เท่า ทำให้กระแสเงินสดเติบโตเร็วกว่าการถอนออกถึง <strong>+{( (simulation.dripIncomeUSD - simulation.cashIncomeUSD) / (simulation.cashIncomeUSD || 1) * 100 ).toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
