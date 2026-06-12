import React from "react";

export default function StockSummaryTab({ profile = {}, thaiSummary = "", formatLargeNum }) {
  return (
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

      {/* AI Generated Thai Business Summary */}
      {thaiSummary && (
        <div style={{ background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>💡 สรุปธุรกิจเข้าใจง่าย (ภาษาไทย):</span>
          <p style={{ fontSize: 12.5, color: "var(--text-main)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {thaiSummary}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>ผู้บริหารสูงสุด (CEO)</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{profile.ceo || "-"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>ประเทศ</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{profile.country || "-"}</span>
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
    </div>
  );
}
