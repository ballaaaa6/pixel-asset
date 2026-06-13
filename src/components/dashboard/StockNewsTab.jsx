import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function StockNewsTab({ news = [] }) {
  const [selectedNews, setSelectedNews] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newsDetail, setNewsDetail] = useState(null);
  const [isThaiView, setIsThaiView] = useState(false);
  const [translatingClient, setTranslatingClient] = useState(false);
  const [thaiTranslation, setThaiTranslation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const getBriefSummary = () => {
    if (selectedNews?.summary && selectedNews.summary !== selectedNews.headline) {
      return selectedNews.summary;
    }
    if (newsDetail?.summary) {
      const firstPara = newsDetail.summary.split("\n\n")[0] || "";
      if (firstPara.trim().length > 10) return firstPara;
    }
    return selectedNews?.headline || "";
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [news]);

  const totalPages = Math.ceil(news.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNews = news.slice(startIndex, startIndex + itemsPerPage);

  const handleNewsClick = async (item) => {
    setSelectedNews(item);
    setLoadingDetails(true);
    setNewsDetail(null);
    setIsThaiView(false);
    setThaiTranslation(null);
    try {
      const url = `/api/prices?translateNews=true&uuid=${item.uuid || ""}&headline=${encodeURIComponent(item.headline)}&summary=${encodeURIComponent(item.summary || "")}&newsUrl=${encodeURIComponent(item.url || "")}`;
      const res = await fetch(url);
      const data = res.ok ? await res.json() : {};
      
      const detail = {
        headline: data.headline || item.headline,
        summary: data.summary || item.summary || "",
        takeaways: data.takeaways || [],
        isEnglish: data.isEnglish !== false
      };
      setNewsDetail(detail);
      
      // If server-side translation succeeded (meaning Cloudflare AI translated it and returned non-isEnglish)
      if (data && data.isEnglish === false) {
        setThaiTranslation({
          headline: data.headline,
          summary: data.summary,
          takeaways: data.takeaways
        });
        setIsThaiView(true);
      }
    } catch {
      setNewsDetail({
        headline: item.headline,
        summary: item.summary || "",
        takeaways: [],
        isEnglish: true
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTranslateClick = async () => {
    if (!newsDetail) return;
    setTranslatingClient(true);
    try {
      const translateTextClient = async (text) => {
        if (!text) return "";
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          if (!res.ok) return text;
          const data = await res.json();
          if (data && data[0]) {
            return data[0].map(x => x[0]).join("");
          }
          return text;
        } catch {
          return text;
        }
      };

      const translatedHeadline = await translateTextClient(newsDetail.headline);

      // Translate paragraph by paragraph in parallel to handle long articles cleanly
      const paragraphs = newsDetail.summary.split("\n\n");
      const translatedParagraphs = await Promise.all(
        paragraphs.map(p => {
          if (!p.trim()) return "";
          return translateTextClient(p);
        })
      );
      const translatedSummary = translatedParagraphs.join("\n\n");

      let translatedTakeaways = [];
      if (newsDetail.takeaways && newsDetail.takeaways.length > 0) {
        translatedTakeaways = await Promise.all(
          newsDetail.takeaways.map(t => translateTextClient(t))
        );
      } else {
        const briefSummaryText = getBriefSummary();
        const briefTranslated = await translateTextClient(briefSummaryText);
        translatedTakeaways = [briefTranslated];
      }

      setThaiTranslation({
        headline: translatedHeadline,
        summary: translatedSummary,
        takeaways: translatedTakeaways
      });
      setIsThaiView(true);
    } catch (err) {
      console.error("Client side translation failed:", err);
    } finally {
      setTranslatingClient(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {(!news || news.length === 0) ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>ไม่มีรายงานข่าวเด่นในช่วงนี้</div>
      ) : (
        <>
          {paginatedNews.map((item, idx) => (
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
          ))}

          {/* ── CLIENT-SIDE PAGINATION CONTROLS ── */}
          {totalPages > 1 && (
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: 12, 
              marginTop: 16, 
              paddingTop: 12,
              borderTop: "1px solid var(--border)"
            }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  padding: "6px 12px",
                  background: currentPage === 1 ? "rgba(0,0,0,0.02)" : "var(--primary-light, rgba(99, 102, 241, 0.08))",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: currentPage === 1 ? "var(--text-muted)" : "var(--primary)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1,
                  transition: "all 0.2s"
                }}
              >
                ก่อนหน้า
              </button>
              
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>
                หน้า {currentPage} / {totalPages}
              </span>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  padding: "6px 12px",
                  background: currentPage === totalPages ? "rgba(0,0,0,0.02)" : "var(--primary-light, rgba(99, 102, 241, 0.08))",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: currentPage === totalPages ? "var(--text-muted)" : "var(--primary)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  transition: "all 0.2s"
                }}
              >
                ถัดไป
              </button>
            </div>
          )}
        </>
      )}

      {/* ── NEWS MODAL WITH CLIENT-SIDE THAI TRANSLATION ── */}
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

              {loadingDetails ? (
                <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div className="spinner sm" />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>กำลังโหลดข่าวเต็มจากแหล่งข่าว...</span>
                </div>
              ) : newsDetail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Action Bar for Translation Toggle */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "8px 12px", 
                    background: "rgba(0,0,0,0.02)", 
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 12
                  }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 800 }}>
                      {isThaiView ? "🇹🇭 แสดงฉบับแปลภาษาไทย" : "🇺🇸 แสดงฉบับภาษาอังกฤษ (ต้นฉบับ)"}
                    </span>
                    
                    {translatingClient ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="spinner sm" style={{ width: 12, height: 12 }} />
                        <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 800 }}>กำลังแปลภาษา...</span>
                      </div>
                    ) : isThaiView ? (
                      <button 
                        onClick={() => setIsThaiView(false)}
                        style={{ 
                          padding: "4px 8px", 
                          background: "rgba(99, 102, 241, 0.1)", 
                          border: "none", 
                          borderRadius: 6, 
                          color: "var(--primary)", 
                          cursor: "pointer", 
                          fontWeight: 800 
                        }}
                      >
                        ดูต้นฉบับอังกฤษ 🇺🇸
                      </button>
                    ) : (
                      <button 
                        onClick={handleTranslateClick}
                        style={{ 
                          padding: "4px 10px", 
                          background: "var(--primary)", 
                          border: "none", 
                          borderRadius: 6, 
                          color: "#fff", 
                          cursor: "pointer", 
                          fontWeight: 800 
                        }}
                      >
                        แปลเป็นภาษาไทย 🇹🇭
                      </button>
                    )}
                  </div>

                  {/* Headline & Body Text */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", margin: 0, lineHeight: 1.4 }}>
                      {isThaiView ? thaiTranslation?.headline : newsDetail.headline}
                    </h3>

                    {/* Brief / Takeaway Summary Box (Lifted Up & Enlarged) */}
                    {isThaiView ? (
                      thaiTranslation?.takeaways && thaiTranslation.takeaways.length > 0 && (
                        <div style={{ padding: "12px 16px", background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 900, color: "var(--primary)" }}>
                            {newsDetail.takeaways && newsDetail.takeaways.length > 0 ? "💡 สรุปประเด็นสำคัญ (AI Summary):" : "📝 สรุปย่อข่าว (Brief Summary):"}
                          </span>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--text-main)", lineHeight: 1.5 }}>
                            {thaiTranslation.takeaways.map((takeaway, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{takeaway}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    ) : (
                      (newsDetail.takeaways && newsDetail.takeaways.length > 0) ? (
                        <div style={{ padding: "12px 16px", background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 900, color: "var(--primary)" }}>💡 Key Takeaways (AI Summary):</span>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--text-main)", lineHeight: 1.5 }}>
                            {newsDetail.takeaways.map((takeaway, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{takeaway}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div style={{ padding: "12px 16px", background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 900, color: "var(--primary)" }}>📝 Brief Summary:</span>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)", lineHeight: 1.5 }}>{getBriefSummary()}</p>
                        </div>
                      )
                    )}

                    {/* Dashed Separator Line & Article Body */}
                    <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      {(isThaiView ? thaiTranslation?.summary : newsDetail.summary) ? (
                        (isThaiView ? thaiTranslation?.summary : newsDetail.summary).split("\n\n").map((para, i) => {
                          const isBoldHeader = para.startsWith("**") && para.endsWith("**");
                          const cleanText = isBoldHeader ? para.slice(2, -2) : para;
                          return (
                            <p 
                              key={i} 
                              style={{ 
                                fontSize: isBoldHeader ? 14 : 13, 
                                fontWeight: isBoldHeader ? 800 : 400,
                                color: "var(--text-main)", 
                                lineHeight: 1.6, 
                                margin: 0, 
                                textAlign: "justify",
                                marginTop: isBoldHeader ? 12 : 0,
                                marginBottom: isBoldHeader ? 4 : 0
                              }}
                            >
                              {cleanText}
                            </p>
                          );
                        })
                      ) : (
                        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>ไม่มีรายละเอียดข่าว</p>
                      )}
                    </div>
                  </div>
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
