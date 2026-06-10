import React from "react";

export default function ReceiptUploadZone({
  scanning,
  scanningStatus,
  fileInputRef,
  handleDropReceipt,
  handleFileSelect
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
      border: "2px dashed var(--primary)",
      borderRadius: "16px",
      padding: "16px",
      textAlign: "center",
      marginBottom: 16,
      cursor: "pointer",
      position: "relative",
      transition: "all 0.2s ease"
    }}
    onDragOver={(e) => e.preventDefault()}
    onDrop={handleDropReceipt}
    onClick={() => fileInputRef.current?.click()}
    className="receipt-dropzone"
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
      {scanning ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div className="spinner" style={{ width: 24, height: 24, borderColor: "var(--primary) transparent var(--primary) transparent" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", animation: "pulse 1.5s infinite" }}>
            {scanningStatus.active
              ? `🤖 AI กำลังวิเคราะห์ใบเสร็จ (${scanningStatus.completed}/${scanningStatus.total})...`
              : "🤖 AI กำลังวิเคราะห์รูปภาพ..."}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 22 }}>📸</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>อัปโหลดรูปภาพใบเสร็จเพื่อกรอกออโต้</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>รองรับหลายรูปภาพพร้อมกัน · ลากและวางหรือเลือกไฟล์</span>
        </div>
      )}
    </div>
  );
}
