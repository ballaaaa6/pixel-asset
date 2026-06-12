import React, { useEffect } from "react";
import { X, Download, Upload, LogOut } from "lucide-react";
import { registerModal } from "../../utils/modalStack";

/**
 * ProfileModal (System Settings Modal)
 * Handles system settings: password change, backup/restore, data management, and logout.
 */
export default function ProfileModal({
  isOpen,
  onClose,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  handleChangePassword,
  handleExport,
  handleImport,
  handleClearPortfolio,
  handleClearAllData,
  onLogout,
}) {
  useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">⚙️ ตั้งค่าระบบ (Settings)</span>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* SECTION 1: CHANGE PASSWORD */}
          <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", borderBottom: "1.5px solid var(--loss-light)", paddingBottom: 6, display: "block" }}>
              🔑 เปลี่ยนรหัสผ่านใหม่ (Change Password)
            </span>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">รหัสผ่านเดิม</label>
              <input type="password" className="form-input" placeholder="กรอกรหัสผ่านปัจจุบัน" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">รหัสผ่านใหม่</label>
              <input type="password" className="form-input" placeholder="ตั้งรหัสผ่านใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button className="btn ripple-btn" onClick={handleChangePassword} style={{ height: 44, fontSize: 13, background: "var(--loss)", color: "white", boxShadow: "0 4px 12px var(--loss-glow)", border: "none" }}>
              ยืนยันเปลี่ยนรหัสผ่าน
            </button>
          </div>

          {/* SECTION 2: BACKUP & RESTORE */}
          <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", borderBottom: "1.5px solid var(--primary-light)", paddingBottom: 6, display: "block" }}>
              💾 สำรองข้อมูล (Backup & Restore)
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary ripple-btn" style={{ height: 44, fontSize: 13, flex: 1 }} onClick={handleExport}>
                <Download size={15} /> ส่งออก JSON
              </button>
              <label className="btn btn-secondary ripple-btn" style={{ height: 44, fontSize: 13, flex: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Upload size={15} /> นำเข้า JSON
                <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
              </label>
            </div>
          </div>

          {/* SECTION 3: DATA MANAGEMENT */}
          <div style={{ background: "#FFF5F5", border: "1px solid #FEE2E2", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#EF4444", borderBottom: "1.5px solid #FCA5A5", paddingBottom: 6, display: "block" }}>
              ⚠️ การจัดการข้อมูล (Data Management)
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn ripple-btn" onClick={handleClearPortfolio} style={{ height: 40, fontSize: 12, background: "white", color: "#EF4444", border: "1.5px solid #EF4444", fontWeight: 700, borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🗑️ ล้างเฉพาะข้อมูลพอร์ตหุ้น
              </button>
              <button className="btn ripple-btn" onClick={handleClearAllData} style={{ height: 40, fontSize: 12, background: "#EF4444", color: "white", border: "none", fontWeight: 700, borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 12px rgba(239,68,68,0.15)" }}>
                🔥 ล้างข้อมูลทั้งหมดในระบบ (ลบทุกอย่าง)
              </button>
            </div>
          </div>

          {/* SECTION 4: USER ACCOUNT */}
          <div style={{ background: "#FFF5F5", border: "1px solid #FEE2E2", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#EF4444", borderBottom: "1.5px solid #FCA5A5", paddingBottom: 6, display: "block" }}>
              🚪 บัญชีผู้ใช้งาน (User Account)
            </span>
            <button className="btn ripple-btn" onClick={onLogout} style={{ height: 44, fontSize: 13, background: "#EF4444", color: "white", boxShadow: "0 4px 12px rgba(239,68,68,0.2)", border: "none", fontWeight: 700, borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogOut size={16} /> ออกจากระบบ (Logout)
            </button>
          </div>

        </div>

        <div className="modal-footer" style={{ padding: "8px 24px 16px" }}>
          <button className="btn btn-secondary ripple-btn" onClick={onClose} style={{ height: 44, fontSize: 13 }}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
