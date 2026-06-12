import React, { useState, useMemo } from "react";
import { TrendingDown, Flame, Rocket, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { getSector } from "../../utils/sectorHelpers";
import { fmtUSD, fmtTHB } from "../../utils/formatters";

export default function PortfolioStressTest({ assets = [], exchangeRate = 35.0, hideValues = false }) {
  const [severity, setSeverity] = useState("moderate"); // "mild" | "moderate" | "severe"

  const severityMultiplier = useMemo(() => {
    switch (severity) {
      case "mild": return 0.5;
      case "severe": return 1.8;
      case "moderate":
      default: return 1.0;
    }
  }, [severity]);

  // SCENARIO DEFINITIONS WITH SECTOR SENSITIVITIES
  const SCENARIOS = useMemo(() => [
    {
      id: "recession",
      name: "วิกฤตเศรษฐกิจถดถอย",
      englishName: "Global Recession & Bear Market",
      icon: <TrendingDown className="text-red-500" size={24} style={{ color: "#EF4444" }} />,
      description: "ตลาดหุ้นทั่วโลกปรับตัวลงรุนแรง สินทรัพย์เสี่ยงร่วงหนัก ในขณะที่เงินสดและหุ้นกลุ่มปลอดภัย (Defensive) จะเป็นตัวช่วยพยุงพอร์ตของคุณไว้",
      color: "#EF4444",
      impacts: {
        "Technology": -25,
        "Financials": -20,
        "Consumer Goods": -5,
        "Healthcare": -3,
        "Real Estate (REIT)": -12,
        "Energy & Utilities": -8,
        "Telecom": -4,
        "Industrials": -15,
        "Other": -15,
        "Other (TH)": -15,
        "fiat": 0
      }
    },
    {
      id: "inflation",
      name: "วิกฤตเงินเฟ้อและดอกเบี้ยขาขึ้น",
      englishName: "Stagflation & Rate Hikes",
      icon: <Flame className="text-amber-500" size={24} style={{ color: "#F59E0B" }} />,
      description: "ราคาสินค้าแพงขึ้นนำไปสู่การขึ้นดอกเบี้ยนโยบาย ส่งแรงกดดันสูงต่อหุ้นกลุ่มเติบโตและอสังหาริมทรัพย์ ขณะที่กลุ่มธนาคารและพลังงานได้ประโยชน์",
      color: "#F59E0B",
      impacts: {
        "Technology": -15,
        "Financials": 10,
        "Consumer Goods": -2,
        "Healthcare": -4,
        "Real Estate (REIT)": -15,
        "Energy & Utilities": 15,
        "Telecom": -5,
        "Industrials": -3,
        "Other": -5,
        "Other (TH)": -5,
        "fiat": -8 // Cash purchasing power loss
      }
    },
    {
      id: "techboom",
      name: "ยุครุ่งเรืองของเทคโนโลยี",
      englishName: "Tech & AI Expansion",
      icon: <Rocket className="text-emerald-500" size={24} style={{ color: "#10B981" }} />,
      description: "กระแสเทคโนโลยีและ AI ผลักดันให้เกิดการเติบโตอย่างมหาศาล เม็ดเงินลงทุนหลั่งไหลเข้าสู่บริษัทนวัตกรรมขนาดใหญ่",
      color: "#10B981",
      impacts: {
        "Technology": 35,
        "Financials": 5,
        "Consumer Goods": 8,
        "Healthcare": 4,
        "Real Estate (REIT)": 5,
        "Energy & Utilities": -2,
        "Telecom": 3,
        "Industrials": 8,
        "Other": 8,
        "Other (TH)": 8,
        "fiat": 0
      }
    }
  ], []);

  const totalPortfolioValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.valueUSD || 0), 0);
  }, [assets]);

  const results = useMemo(() => {
    if (totalPortfolioValue === 0) return [];

    return SCENARIOS.map(sc => {
      let totalWeightedImpact = 0;
      assets.forEach(a => {
        const isFiat = a.category === "fiat" || a.type === "fiat";
        const key = isFiat ? "fiat" : getSector(a.symbol);
        const baseImpact = sc.impacts[key] !== undefined ? sc.impacts[key] : -10;
        const finalImpact = baseImpact * severityMultiplier;
        const weight = (a.valueUSD || 0) / totalPortfolioValue;
        totalWeightedImpact += finalImpact * weight;
      });

      const impactAmountUSD = (totalPortfolioValue * totalWeightedImpact) / 100;
      const impactAmountTHB = impactAmountUSD * exchangeRate;

      return {
        ...sc,
        pct: totalWeightedImpact,
        amountUSD: impactAmountUSD,
        amountTHB: impactAmountTHB
      };
    });
  }, [assets, totalPortfolioValue, SCENARIOS, severityMultiplier, exchangeRate]);

  if (totalPortfolioValue === 0) {
    return (
      <div className="card" style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>กรุณาเพิ่มสินทรัพย์ลงในพอร์ตโฟลิโอของคุณเพื่อเปิดใช้งานระบบจำลองวิกฤต</p>
      </div>
    );
  }

  return (
    <div 
      className="card" 
      style={{ 
        padding: 24, 
        background: "var(--bg-card)", 
        border: "1px solid var(--border)", 
        borderRadius: 24, 
        boxShadow: "0 4px 20px rgba(0,0,0,0.01)" 
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            ⚡ เครื่องจำลองวิกฤตและการทดสอบความแข็งแกร่ง
          </h3>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            วิเคราะห์ความทนทานต่อสถานการณ์จำลองระดับโลกรูปแบบต่างๆ
          </p>
        </div>

        {/* Severity Selector */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.02)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
          {["mild", "moderate", "severe"].map((mode) => {
            const isActive = severity === mode;
            let label = "";
            if (mode === "mild") label = "เบาบาง";
            if (mode === "moderate") label = "ปกติ";
            if (mode === "severe") label = "รุนแรง";

            return (
              <button
                key={mode}
                onClick={() => setSeverity(mode)}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 800,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: isActive ? "var(--bg-card)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Scenarios */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="dashboard-grid">
        {results.map((res) => {
          const isNegative = res.pct < 0;
          const absPct = Math.abs(res.pct).toFixed(2);
          const barColor = res.pct > 0 ? "#10B981" : res.pct < -12 ? "#EF4444" : "#F59E0B";

          return (
            <div 
              key={res.id} 
              style={{ 
                background: "rgba(0,0,0,0.01)", 
                border: "1px solid var(--border)", 
                borderRadius: 16, 
                padding: 16, 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between",
                minHeight: 240
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  {res.icon}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{res.name}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{res.englishName}</div>
                  </div>
                </div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 16px 0" }}>
                  {res.description}
                </p>
              </div>

              <div>
                {/* Progress bar / Gauge bar for the specific scenario */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)" }}>คาดการณ์ผลกระทบ:</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: barColor }}>
                    {isNegative ? "-" : "+"}{absPct}%
                  </span>
                </div>

                <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.03)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                  <div 
                    style={{ 
                      width: `${Math.min(100, Math.max(5, parseFloat(absPct)))}%`, 
                      height: "100%", 
                      background: barColor, 
                      borderRadius: 3,
                      float: "right", // align right to show loss/gain direction metaphorically
                      transition: "width 0.5s ease"
                    }} 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span style={{ color: "var(--text-faint)" }}>มูลค่าความเสียหาย:</span>
                  <span style={{ fontWeight: 800, color: "var(--text-main)" }} className={hideValues ? "privacy-blurred" : ""}>
                    {isNegative ? "-" : "+"}{fmtUSD(Math.abs(res.amountUSD))}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-faint)" }}>
                  <span>(แปลงเป็นเงินบาท):</span>
                  <span className={hideValues ? "privacy-blurred" : ""}>
                    {isNegative ? "-" : "+"}{fmtTHB(Math.abs(res.amountTHB))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
