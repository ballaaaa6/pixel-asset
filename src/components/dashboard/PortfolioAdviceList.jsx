import React from "react";
import { Lightbulb, CheckCircle, AlertTriangle } from "lucide-react";
import { getSector, getSectorBeta } from "../../utils/sectorHelpers";

export default function PortfolioAdviceList({ assets = [], avgCorrelation = 0, diversificationScore = 75 }) {
  const allHoldings = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat");
  const totalUSD = allHoldings.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  // Clean symbol helper
  const getDisplaySymbol = (sym) => {
    return sym && sym.includes(".") ? sym.split(".")[0] : sym;
  };

  // Generate Recommendations
  const advices = [];

  if (allHoldings.length === 0) {
    advices.push({
      type: "info",
      title: "ยินดีต้อนรับสู่ระบบวิเคราะห์สุขภาพพอร์ต",
      text: "เริ่มเพิ่มข้อมูลธุรกรรมการซื้อขายสินทรัพย์เพื่อเปิดใช้งานระบบการวิเคราะห์สุขภาพพอร์ตและรับคำแนะนำเชิงกลยุทธ์แบบอัตโนมัติทันที"
    });
  } else {
    // 1. Portfolio Beta Calculation
    let portfolioBeta = 1.0;
    if (totalUSD > 0) {
      let weightedBetaSum = 0;
      allHoldings.forEach(a => {
        const sector = getSector(a.symbol);
        const beta = (a.beta != null && a.beta > 0) ? a.beta : getSectorBeta(sector);
        const weight = (a.valueUSD || 0) / totalUSD;
        weightedBetaSum += beta * weight;
      });
      portfolioBeta = parseFloat(weightedBetaSum.toFixed(2));
    }

    // 2. Sector Concentration Check
    const sectorMap = {};
    allHoldings.forEach(a => {
      const sec = getSector(a.symbol);
      sectorMap[sec] = (sectorMap[sec] || 0) + (a.valueUSD || 0);
    });

    Object.keys(sectorMap).forEach(secName => {
      const pct = totalUSD > 0 ? (sectorMap[secName] / totalUSD) * 100 : 0;
      if (pct > 40) {
        advices.push({
          type: "warning",
          title: `สัดส่วนกลุ่มอุตสาหกรรม ${secName} สูงเกินเกณฑ์`,
          text: `กลุ่มอุตสาหกรรม ${secName} มีสัดส่วนสูงถึง ${pct.toFixed(1)}% ของพอร์ตหุ้นทั้งหมด (แนะนำไม่ควรเกิน 40%) ควรเพิ่มการจัดสรรในกลุ่มอื่น หรือพิจารณาแบ่งขายเพื่อจำกัดความเสี่ยงจากการปรับฐานของเซกเตอร์นี้`
        });
      }
    });

    // 3. Single Stock Concentration Check
    allHoldings.forEach(a => {
      const pct = totalUSD > 0 ? ((a.valueUSD || 0) / totalUSD) * 100 : 0;
      if (pct > 30) {
        advices.push({
          type: "warning",
          title: `สัดส่วนหุ้นรายตัว ${getDisplaySymbol(a.symbol)} กระจุกตัวสูง`,
          text: `หุ้น ${getDisplaySymbol(a.symbol)} ถือครองสูงถึง ${pct.toFixed(1)}% ของพอร์ต (แนะนำไม่ควรเกิน 30%) ควรระมัดระวังการซื้อถัวเฉลี่ยเพิ่มชั่วคราว และพิจารณาปรับสมดุลหากความผันผวนของหุ้นตัวนี้ส่งผลต่อมูลค่าพอร์ตโดยรวมมากเกินไป`
        });
      }
    });

    // 5. Portfolio Beta Warnings
    if (portfolioBeta > 1.25) {
      advices.push({
        type: "danger",
        title: `พอร์ตมีความผันผวนสูงเชิงรุก (Beta: ${portfolioBeta})`,
        text: `ค่าเบต้าเฉลี่ยของพอร์ตสูงกว่าตลาดหุ้นทั่วไปอย่างมีนัยสำคัญ แนะนำให้แบ่งน้ำหนักบางส่วนไปสู่กลุ่มป้องกัน (Defensive) เช่น สินค้าอุปโภคบริโภคพื้นฐาน (Consumer Staples) หรือ สาธารณูปโภค (Utilities) เพื่อช่วยรับแรงกระแทกในช่วงตลาดปรับฐาน`
      });
    } else if (portfolioBeta < 0.75) {
      advices.push({
        type: "info",
        title: `พอร์ตเชิงรับปลอดภัยสูง (Beta: ${portfolioBeta})`,
        text: `พอร์ตของคุณถือหุ้นที่มีการเคลื่อนไหวทนทานและผันผวนน้อยกว่าตลาด เหมาะกับการเน้นรักษาเงินต้น แต่ผลตอบแทนอาจวิ่งช้ากว่าตลาดในช่วงขาขึ้น หากต้องการเร่งการเติบโตสามารถเพิ่มหุ้นประเภท Growth/Tech เล็กน้อย`
      });
    }

    // 6. Diversification Score Warning
    if (diversificationScore < 55) {
      advices.push({
        type: "warning",
        title: "ระดับการกระจายตัวค่อนข้างต่ำ",
        text: `คะแนนกระจายความเสี่ยงอยู่ที่ ${diversificationScore}% พอร์ตอาจพึ่งพาคู่หุ้นที่มีค่าสหสัมพันธ์ราคาบวกสูง (ปรับตัวขึ้นลงตามกัน) แนะนำมองหาคู่สินทรัพย์ที่มีการสลับขั้วราคา เช่น ทองคำ หรือกองทุนอสังหาฯ เข้ามาช่วยพยุงลดแรงแกว่ง`
      });
    }

    // 7. Good Health Praise
    if (advices.length === 0 && diversificationScore >= 70 && portfolioBeta >= 0.8 && portfolioBeta <= 1.2) {
      advices.push({
        type: "success",
        title: "สุขภาพและการกระจายความเสี่ยงของพอร์ตเหมาะสมดีเลิศ",
        text: "ไม่พบข้อกังวลด้านการกระจุกตัวของพอร์ต ทั้งสัดส่วนรายตัว อุตสาหกรรม และความผันผวน (Beta) สมดุลและสอดรับกันดีมาก แนะนำรักษากรอบสัดส่วนที่มีความหลากหลายของสินทรัพย์นี้ต่อไป"
      });
    }
  }

  return (
    <div 
      className="card" 
      style={{ 
        padding: 24, 
        background: "var(--bg-card)", 
        borderRadius: 24, 
        border: "1px solid var(--border)", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.01)" 
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <Lightbulb size={20} style={{ color: "var(--primary)" }} /> คำแนะนำการจัดพอร์ตและ Rebalancing รายวัน
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {advices.map((advice, idx) => {
          let bg = "rgba(0,0,0,0.01)";
          let border = "var(--border)";
          let icon = <Lightbulb size={20} style={{ color: "var(--primary)" }} />;

          if (advice.type === "warning") {
            bg = "rgba(245, 158, 11, 0.02)";
            border = "rgba(245, 158, 11, 0.12)";
            icon = <AlertTriangle size={20} style={{ color: "var(--text-muted)" }} />;
          } else if (advice.type === "danger") {
            bg = "rgba(239, 68, 68, 0.02)";
            border = "rgba(239, 68, 68, 0.12)";
            icon = <AlertTriangle size={20} style={{ color: "var(--loss)" }} />;
          } else if (advice.type === "success") {
            bg = "rgba(16, 185, 129, 0.02)";
            border = "rgba(16, 185, 129, 0.12)";
            icon = <CheckCircle size={20} style={{ color: "var(--gain)" }} />;
          }

          return (
            <div 
              key={idx} 
              style={{ 
                background: bg, 
                border: `1px solid ${border}`, 
                borderRadius: 16, 
                padding: "16px 20px", 
                display: "flex", 
                gap: 12, 
                alignItems: "flex-start" 
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text-main)" }}>
                  {advice.title}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {advice.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
