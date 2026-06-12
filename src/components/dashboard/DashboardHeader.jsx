import React from "react";
import { Settings, Pencil, Menu } from "lucide-react";

export default function DashboardHeader({
  portfolioName,
  isEditingName,
  setIsEditingName,
  tempName,
  setTempName,
  handleSaveName,
  nickname,
  user,
  profilePic,
  setProfileModalOpen,
  setInvestorModalOpen,
  isDirty,
  setSidebarOpen
}) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" style={{ gap: 8 }}>
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            title="เปิดเมนู"
            style={{ marginRight: 4 }}
          >
            <Menu size={18} />
          </button>
          <span style={{ fontSize: 24 }} aria-hidden="true">🚀</span>
          {isEditingName ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={25}
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--primary)",
                  border: "1.5px solid var(--primary)",
                  borderRadius: 8,
                  padding: "2px 8px",
                  width: 120,
                  fontFamily: "Outfit, sans-serif",
                  height: 28,
                  background: "white"
                }}
              />
              <button
                onClick={handleSaveName}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  height: 28,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                บันทึก
              </button>
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800 }}>{portfolioName}</span>
              <button
                onClick={() => { setTempName(portfolioName); setIsEditingName(true); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-faint)",
                  cursor: "pointer",
                  padding: 4,
                  display: "inline-flex",
                  alignItems: "center"
                }}
                title="แก้ไขชื่อพอร์ต"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
          <span className="live-dot" title="Live" />
        </div>
        <div className="navbar-actions">
          {/* Actions moved to Sidebar */}
        </div>
      </div>
    </nav>
  );
}
