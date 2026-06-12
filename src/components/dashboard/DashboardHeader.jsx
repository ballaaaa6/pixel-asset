import React from "react";
import { Settings, Pencil } from "lucide-react";

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
  isDirty
}) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
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
          {/* Sync Status Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDirty ? "rgba(245, 158, 11, 0.1)" : "rgba(22, 163, 74, 0.15)",
              color: isDirty ? "#D97706" : "#16A34A",
              border: isDirty ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid rgba(22, 163, 74, 0.25)",
              transition: "all 0.3s ease",
              userSelect: "none",
              height: "28px",
              boxSizing: "border-box"
            }}
            title={isDirty ? "มีข้อมูลธุรกรรมที่บันทึกในเครื่องที่ยังไม่ได้ซิงค์ขึ้นระบบคลาวด์" : "ข้อมูลซิงค์กับคลาวด์เสร็จสมบูรณ์แล้ว"}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isDirty ? "#F59E0B" : "#22C55E",
                display: "inline-block",
                animation: isDirty ? "skeletonPulse 1.5s infinite ease-in-out" : "none"
              }}
            />
            <span>{isDirty ? "ออฟไลน์" : "ซิงค์แล้ว"}</span>
          </div>

          <div
            className="user-profile-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 10,
              background: "var(--primary-light)",
              userSelect: "none",
              transition: "var(--transition)"
            }}
            onClick={() => setInvestorModalOpen(true)}
            title="โปรไฟล์นักลงทุน"
          >
            {profilePic ? (
              <img
                src={profilePic}
                alt="avatar"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid var(--primary)"
                }}
              />
            ) : (
              <span style={{ fontSize: 13 }}>👤</span>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
              {nickname || user?.username}
            </span>
          </div>
          <button
            onClick={() => setProfileModalOpen(true)}
            style={{
              background: "#F1F5F9",
              border: "none",
              color: "var(--text-main)",
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "var(--transition)"
            }}
            title="ตั้งค่า"
            className="ripple-btn"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
