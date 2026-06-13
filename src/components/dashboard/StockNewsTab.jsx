import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function StockNewsTab({ news = [] }) {
  const [selectedNews, setSelectedNews] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translatedNews, setTranslatedNews] = useState(null);

  const handleNewsClick = async (item) => {
    setSelectedNews(item);
    setTranslating(true);
    setTranslatedNews(null);
    try {
      const url = `/api/prices?translateNews=true&headline=${encodeURIComponent(item.headline)}&summary=${encodeURIComponent(item.summary || "")}&newsUrl=${encodeURIComponent(item.url || "")}`;
      const res = await fetch(url);
      const data = res.ok ? await res.json() : {};
      
      setTranslatedNews({
        headline: data.headline || item.headline,
        summary: data.summary || item.summary || "",
        takeaways: data.takeaways || []
      });
    } catch {
      setTranslatedNews({
        headline: item.headline,
        summary: item.summary || "",
        takeaways: []
      });
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {(!news || news.length === 0) ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>ไม่มีรายงานข่าวเด่นในช่วงนี้</div>
      ) : (
        news.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => handleNewsClick(item)} 
            style={{ 
              display: "flex", 
              gap: 12, 
              padding: 10, 
              background: "rgba(0,0,0,0.015)", 
              borderRadius: 12, 
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
          >

            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 800 }}>{item.source}</span>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  {new Date(item.datetime * 1000).toLocaleDateString("th-TH")}
                </span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.3 }}>{item.headline}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {item.summary}
              </span>
            </div>
          </div>
        ))
      )}

      {/* ── NEWS MODAL WITH AI THAI TRANSLATION ── */}
      {selectedNews && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>📰 ตัวอ่านข่าวแปลไทย (AI Translator)</span>
              <button className="btn-close" onClick={() => setSelectedNews(null)}><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>


              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>
                <span>แหล่งข่าว: {selectedNews.source}</span>
                <span>{new Date(selectedNews.datetime * 1000).toLocaleString("th-TH")}</span>
              </div>

              {translating ? (
                <div style={{ padding: "30px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div className="spinner sm" />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>กำลังใช้ AI แปลเป็นภาษาไทย...</span>
                </div>
              ) : translatedNews ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", margin: 0, lineHeight: 1.4 }}>
                    {translatedNews.headline}
                  </h3>
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {translatedNews.summary ? (
                      translatedNews.summary.split("\n\n").map((para, i) => (
                        <p key={i} style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.6, margin: 0, textAlign: "justify" }}>
                          {para}
                        </p>
                      ))
                    ) : (
                      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>ไม่มีรายละเอียดข่าวย่อย</p>
                    )}
                  </div>
                  {translatedNews.takeaways && translatedNews.takeaways.length > 0 && (
                    <div style={{ marginTop: 10, padding: "12px 16px", background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 900, color: "var(--primary)" }}>💡 สรุปประเด็นสำคัญ (AI Summary):</span>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text-main)", lineHeight: 1.5 }}>
                        {translatedNews.takeaways.map((takeaway, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a 
                  href={selectedNews.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800, textDecoration: "none" }}
                >
                  อ่านข่าวต้นฉบับภาษาอังกฤษ 🔗
                </a>
                <button 
                  onClick={() => setSelectedNews(null)} 
                  style={{ padding: "6px 14px", background: "rgba(0,0,0,0.03)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
