import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { registerModal } from "../../utils/modalStack";

export default function CustomConfirmModal({ title, message, onConfirm, onCancel }) {
  useEffect(() => {
    return registerModal(onCancel);
  }, [onCancel]);

  return (
    <div className="modal-overlay" style={{ zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-content" style={{ maxWidth: 420, padding: 0, overflow: "hidden", animation: "scaleInModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "rgba(244, 63, 94, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E11D48", fontWeight: 800, fontSize: 15 }}>
            <AlertTriangle size={18} />
            <span>{title || "ยืนยันการทำรายการ"}</span>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4, borderRadius: "50%", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}><X size={16} /></button>
        </div>
        <div style={{ padding: "20px 20px 24px", fontSize: 13.5, color: "var(--text-main)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 20px 16px", borderTop: "1px solid var(--border)", background: "#F8FAFC", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary ripple-btn" onClick={onCancel} style={{ height: 38, padding: "0 16px", fontSize: 13, borderRadius: 10, margin: 0 }}>ยกเลิก</button>
          <button type="button" className="btn ripple-btn" onClick={onConfirm} style={{ height: 38, padding: "0 16px", fontSize: 13, borderRadius: 10, background: "#E11D48", color: "white", border: "none", fontWeight: 700, cursor: "pointer", margin: 0 }}>ยืนยัน</button>
        </div>
      </div>
    </div>
  );
}
