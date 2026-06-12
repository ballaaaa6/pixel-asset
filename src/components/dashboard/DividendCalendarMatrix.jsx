import React, { useState } from "react";
import { MonthDetailModal } from "./DividendDetailModals";
import { fmtUSD } from "../../utils/formatters";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function DividendCalendarMatrix({ next12Months, hideValues, exchangeRate }) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(null);

  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, gridColumn: "span 2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          📅 ปฏิทินประมาณการปันผลรายเดือน (12 เดือนข้างหน้า)
        </h3>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>คลิกแต่ละเดือนเพื่อดูรายชื่อหุ้น 🔍</span>
      </div>

      {/* Grid of 12 Months */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", 
          gap: 12,
          marginTop: 8
        }}
      >
        {next12Months.map((m, idx) => {
          const hasPayout = m.value > 0;
          const monthText = THAI_MONTHS[m.month];
          const uniqueSymbols = Array.from(new Set(m.payments.map(p => p.symbol)));

          return (
            <div
              key={idx}
              className="clickable ripple-btn"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 12,
                borderRadius: 12,
                border: hasPayout ? "1px solid rgba(82, 54, 255, 0.15)" : "1px solid var(--border)",
                background: hasPayout ? "rgba(82, 54, 255, 0.02)" : "rgba(0,0,0,0.01)",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                minHeight: 100,
                justifyContent: "space-between"
              }}
              onClick={() => setSelectedMonthIdx(idx)}
              title={`ดูรายละเอียดปันผลเดือน ${monthText}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: hasPayout ? "var(--primary)" : "var(--text-muted)" }}>
                  {monthText} <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-faint)" }}>{m.year}</span>
                </span>
                {hasPayout && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />
                )}
              </div>

              <div>
                <span 
                  className={hideValues ? "privacy-blurred" : ""} 
                  style={{ 
                    fontSize: 15, 
                    fontWeight: 900, 
                    color: hasPayout ? "var(--gain)" : "var(--text-faint)",
                    display: "block",
                    margin: "4px 0"
                  }}
                >
                  {hasPayout ? fmtUSD(m.value) : "$0.00"}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, minHeight: 18 }}>
                {uniqueSymbols.slice(0, 2).map((sym, i) => (
                  <span 
                    key={i} 
                    style={{ 
                      fontSize: 8, 
                      fontWeight: 800, 
                      padding: "2px 4px", 
                      borderRadius: 4, 
                      background: "rgba(0,0,0,0.04)", 
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    {sym}
                  </span>
                ))}
                {uniqueSymbols.length > 2 && (
                  <span style={{ fontSize: 8, color: "var(--text-faint)", fontWeight: 700, alignSelf: "center" }}>
                    +{uniqueSymbols.length - 2}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedMonthIdx !== null && (
        <MonthDetailModal
          isOpen={selectedMonthIdx !== null}
          onClose={() => setSelectedMonthIdx(null)}
          monthName={`${THAI_MONTHS[next12Months[selectedMonthIdx]?.month]} ${next12Months[selectedMonthIdx]?.year}`}
          monthPayments={next12Months[selectedMonthIdx]?.payments}
          hideValues={hideValues}
          exchangeRate={exchangeRate}
        />
      )}
    </div>
  );
}
