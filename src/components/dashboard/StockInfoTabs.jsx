import React, { useState } from "react";
import { BookOpen, BarChart3, Landmark, Percent, Calendar } from "lucide-react";

export default function StockInfoTabs({ profile = {}, metrics = {}, earnings = [], news = [] }) {
  const [activeTab, setActiveTab] = useState("summary");

  const tabs = [
    { id: "summary", label: "สรุปบริษัท", icon: BookOpen },
    { id: "quarterly", label: "สรุปไตรมาส", icon: Calendar },
    { id: "financials", label: "ข้อมูลการเงิน", icon: Landmark },
    { id: "performance", label: "ผลตอบแทน", icon: Percent },
    { id: "news", label: "ข่าวล่าสุด", icon: BarChart3 }
  ];

  const formatLargeNum = (num) => {
    if (num == null) return "-";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const fmtPercent = (val) => {
    if (val == null) return "-";
    return `${val.toFixed(2)}%`;
  };

  const fmtVal = (val, prefix = "") => {
    if (val == null) return "-";
    return `${prefix}${val.toLocaleString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tabs navigation row */}
      <div 
        style={{ 
          display: "flex", 
          gap: 4, 
          background: "rgba(0,0,0,0.02)", 
          padding: 4, 
          borderRadius: 12, 
          border: "1px solid var(--border)", 
          overflowX: "auto",
          whiteSpace: "nowrap"
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                background: isActive ? "var(--bg-card)" : "transparent",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{ background: "rgba(0,0,0,0.005)", minHeight: 180 }}>
        
        {/* TAB 1: Company Profile */}
        {activeTab === "summary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {profile.logo && (
                <img 
                  src={profile.logo} 
                  alt="logo" 
                  style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid var(--border)", objectFit: "contain", background: "#ffffff", padding: 4 }} 
                  onError={(e) => e.target.style.display = "none"}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)" }}>
                  {profile.name || "ไม่มีชื่อบริษัท"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 800 }}>
                  หมวดหมู่: {profile.finnhubIndustry || "ไม่ระบุ"} | ตลาด: {profile.exchange || "GLOBAL"}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>ประเทศ</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{profile.country || "-"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>สกุลเงิน</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{profile.currency || "-"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>จำนวนหุ้น IPO (Shares Out)</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{formatLargeNum(profile.shareOutstanding * 1e6)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>เว็บไซต์</span>
                {profile.weburl ? (
                  <a href={profile.weburl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", textDecoration: "none" }}>
                    {profile.weburl.replace("https://", "").replace("www.", "")} 🔗
                  </a>
                ) : <span>-</span>}
              </div>
            </div>

            {profile.name && (
              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                บริษัท <strong>{profile.name}</strong> ดำเนินธุรกิจในหมวดอุตสาหกรรม {profile.finnhubIndustry} ในประเทศ {profile.country} และจดทะเบียนเข้าซื้อขายในตลาดหลักทรัพย์ {profile.exchange}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Quarterly Earnings Surprises */}
        {activeTab === "quarterly" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>ประวัติการรายงานกำไรรายไตรมาส (EPS Actual vs Estimate)</span>
            
            {(!earnings || earnings.length === 0) ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>ไม่มีข้อมูลรายงานกำไรสุทธิไตรมาสล่าสุด</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {earnings.map((e, idx) => {
                  const surpriseColor = e.surprise >= 0 ? "var(--gain)" : "var(--loss)";
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        padding: "10px 14px", 
                        background: "rgba(0,0,0,0.015)", 
                        borderRadius: 12,
                        border: "1px solid var(--border)"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>ไตรมาส {e.quarter} / ปี {e.year}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>วันที่รายงาน: {e.period}</span>
                      </div>
                      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>คาดการณ์ / จริง</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
                            {e.estimate?.toFixed(2) ?? "-"} / <strong style={{ color: "var(--primary)" }}>{e.actual?.toFixed(2) ?? "-"}</strong>
                          </span>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 70 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Surprise</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: surpriseColor }}>
                            {e.surprisePercent >= 0 ? `+${e.surprisePercent.toFixed(1)}%` : `${e.surprisePercent.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Key Financials */}
        {activeTab === "financials" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Market Capitalization</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{formatLargeNum(metrics.metric?.marketCapitalization)}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>P/E Ratio (Trailing)</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(metrics.metric?.peTrailing)}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Gross Margin TTM</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--gain)", marginTop: 2 }}>{fmtPercent(metrics.metric?.grossMarginTTM)}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Net Profit Margin TTM</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>{fmtPercent(metrics.metric?.netProfitMarginTTM)}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Price to Book (MRQ)</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(metrics.metric?.pbCurrent)}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>EPS (TTM)</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(metrics.metric?.epsTTM, "$")}</span>
            </div>
          </div>
        )}

        {/* TAB 4: Performance & Dividends */}
        {activeTab === "performance" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาสูงสุดใน 52 สัปดาห์</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--gain)", marginTop: 2, display: "block" }}>${metrics.metric?.["52WeekHigh"]?.toFixed(2) ?? "-"}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาต่ำสุดใน 52 สัปดาห์</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--loss)", marginTop: 2, display: "block" }}>${metrics.metric?.["52WeekLow"]?.toFixed(2) ?? "-"}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>อัตราการจ่ายปันผล (Dividend)</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>${metrics.metric?.dividendPerShareTTM?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>อัตราเงินปันผลตอบแทน (Yield)</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", marginTop: 2, display: "block" }}>{metrics.metric?.dividendYield5YAvg ? `${metrics.metric.dividendYield5YAvg.toFixed(2)}% (5Y Avg)` : "-"}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาเฉลี่ย 50 วัน (50-Day MA)</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>${metrics.metric?.["50DayAverage"]?.toFixed(2) ?? "-"}</span>
            </div>
            <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาเฉลี่ย 200 วัน (200-Day MA)</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>${metrics.metric?.["200DayAverage"]?.toFixed(2) ?? "-"}</span>
            </div>
          </div>
        )}

        {/* TAB 5: News Headlines */}
        {activeTab === "news" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(!news || news.length === 0) ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>ไม่มีรายงานข่าวเด่นในช่วงนี้</div>
            ) : (
              news.map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 4, 
                    padding: 10, 
                    background: "rgba(0,0,0,0.015)", 
                    borderRadius: 12, 
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 800 }}>{item.source}</span>
                    <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                      {new Date(item.datetime * 1000).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.3 }}>{item.headline}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.summary}
                  </span>
                </a>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
