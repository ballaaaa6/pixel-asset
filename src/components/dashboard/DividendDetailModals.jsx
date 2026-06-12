import React, { useEffect } from "react";
import { X, TrendingUp, TrendingDown, Info } from "lucide-react";
import { createPortal } from "react-dom";
import { fmtUSD, fmtTHB, fmtPct } from "../../utils/formatters";
import { registerModal } from "../../utils/modalStack";

// Helper for countdown
const getDaysDiff = (targetDate) => {
  const diffTime = targetDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 1. Month Detail Modal
export function MonthDetailModal({ isOpen, onClose, monthName, monthPayments = [], hideValues, exchangeRate }) {
  useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalMonthlyUSD = monthPayments.reduce((sum, p) => sum + (p.estPayoutUSD || 0), 0);

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">📅 รายรับเงินปันผลเดือน {monthName}</span>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--primary-light)", borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 4 }}>ยอดปันผลคาดการณ์รวมประจำเดือน</span>
            <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", display: "block" }}>
              {fmtUSD(totalMonthlyUSD)}
            </span>
            <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 13, color: "var(--gain)", fontWeight: 700, display: "block", marginTop: 2 }}>
              ≈ {fmtTHB(totalMonthlyUSD * exchangeRate)}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>รายการปันผลจากสินทรัพย์</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 250, overflowY: "auto" }}>
              {monthPayments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-faint)", fontSize: 12 }}>ไม่มีรายการปันผลในเดือนนี้</div>
              ) : (
                monthPayments.map((pay, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(0,0,0,0.02)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text-main)" }}>{pay.symbol}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{pay.qty.toLocaleString()} หุ้น</span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
                      <span className={hideValues ? "privacy-blurred" : ""} style={{ fontWeight: 700, fontSize: 14, color: "var(--gain)" }}>
                        +{fmtUSD(pay.estPayoutUSD)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {fmtUSD(pay.amountPerShare)}/หุ้น
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// 2. Yield on Cost (YOC) vs Current Yield Modal
export function YieldComparisonModal({ isOpen, onClose, computedAssets = [], hideValues, exchangeRate }) {
  useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const yocAssets = computedAssets
    .filter(a => a.qty > 0)
    .map(asset => {
      const isThai = asset.symbol.toUpperCase().endsWith(".BK");
      const avgCost = asset.avgCost ?? asset.avgPrice ?? 0;
      const avgCostUSD = isThai ? avgCost / exchangeRate : avgCost;
      const yieldOnCostPct = avgCostUSD > 0 ? (asset.annualRate / avgCostUSD) * 100 : 0;
      return {
        ...asset,
        avgCostUSD,
        yieldOnCostPct
      };
    });

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">📈 วิเคราะห์อัตราปันผล (Yield on Cost vs Current Yield)</span>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 10, background: "#F8FAFC", borderRadius: 12, padding: 12, border: "1px solid var(--border)" }}>
            <Info size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              <strong>Yield on Cost (YOC)</strong> คือ อัตราเงินปันผลคิดเป็นร้อยละเทียบกับ <strong>ราคาทุนเฉลี่ยที่คุณซื้อจริง</strong> ในขณะที่ <strong>Current Yield</strong> คืออัตราเงินปันผลคิดเป็นร้อยละเทียบกับ <strong>ราคาตลาดในปัจจุบัน</strong>
              <br />
              หาก YOC สูงกว่า Current Yield (ลูกศรขึ้น <span style={{ color: "var(--gain)" }}>▲</span>) แสดงว่าคุณได้ประโยชน์จากการซื้อสินทรัพย์ราคาดีและอัตราปันผลเพิ่มขึ้น
            </div>
          </div>

          <div className="table-wrapper" style={{ maxHeight: 350, overflowY: "auto" }}>
            <table className="asset-table" style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  <th>สินทรัพย์</th>
                  <th style={{ textAlign: "right" }}>ราคาทุนเฉลี่ย</th>
                  <th style={{ textAlign: "right" }}>ราคาตลาด</th>
                  <th style={{ textAlign: "right" }}>Current Yield</th>
                  <th style={{ textAlign: "right" }}>Yield on Cost (YOC)</th>
                  <th style={{ textAlign: "center" }}>เปรียบเทียบ</th>
                </tr>
              </thead>
              <tbody>
                {yocAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "20px 0", color: "var(--text-faint)" }}>ไม่มีสินทรัพย์ปันผลในพอร์ต</td>
                  </tr>
                ) : (
                  yocAssets.map((asset, i) => {
                    const isUp = asset.yieldOnCostPct > asset.yieldPct;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 800 }}>{asset.symbol}</td>
                        <td style={{ textAlign: "right" }}>{fmtUSD(asset.avgCostUSD)}</td>
                        <td style={{ textAlign: "right" }}>{fmtUSD(asset.priceUSD)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtPct(asset.yieldPct)}</td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>{fmtPct(asset.yieldOnCostPct)}</td>
                        <td style={{ textAlign: "center" }}>
                          {asset.yieldOnCostPct > 0 && asset.yieldPct > 0 ? (
                            isUp ? (
                              <span style={{ color: "var(--gain)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>
                                <TrendingUp size={14} /> +{(asset.yieldOnCostPct - asset.yieldPct).toFixed(2)}%
                              </span>
                            ) : (
                              <span style={{ color: "var(--loss)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>
                                <TrendingDown size={14} /> {(asset.yieldOnCostPct - asset.yieldPct).toFixed(2)}%
                              </span>
                            )
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// 3. Income Share Modal
export function IncomeShareModal({ isOpen, onClose, computedAssets = [], hideValues, totalAnnualIncomeUSD }) {
  useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedShare = computedAssets
    .filter(a => a.annualIncomeUSD > 0)
    .sort((a, b) => b.annualIncomeUSD - a.annualIncomeUSD);

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <span className="modal-title">📊 สัดส่วนแหล่งรายได้ปันผล (Dividend Share)</span>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>สัดส่วนการสนับสนุนรายได้ปันผลรายหุ้น</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 350, overflowY: "auto", paddingRight: 4 }}>
              {sortedShare.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-faint)", fontSize: 13 }}>
                  ยังไม่มีสัดส่วนเงินปันผลที่คำนวณได้
                </div>
              ) : (
                sortedShare.map((asset, i) => {
                  const sharePct = totalAnnualIncomeUSD > 0 ? (asset.annualIncomeUSD / totalAnnualIncomeUSD) * 100 : 0;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{asset.symbol}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className={hideValues ? "privacy-blurred" : ""} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {fmtUSD(asset.annualIncomeUSD)}/ปี
                          </span>
                          <span style={{ fontWeight: 800, color: "var(--primary)" }}>{sharePct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${sharePct}%`, height: "100%", background: "linear-gradient(90deg, var(--primary) 0%, #7C3AED 100%)", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// 4. Upcoming Ex-Date details modal
export function UpcomingPayoutModal({ isOpen, onClose, selectedUpcomingPayout, hideValues, exchangeRate, assets = [], setSelectedAsset }) {
  useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedUpcomingPayout) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">📅 รายละเอียดเงินปันผลถัดไป</span>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", display: "block" }}>{selectedUpcomingPayout.symbol}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginTop: 4 }}>{selectedUpcomingPayout.name}</span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>วันที่ขึ้นเครื่องหมาย (Ex-Date):</span>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                {selectedUpcomingPayout.estExDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>เวลาที่เหลือ:</span>
              <span style={{ fontWeight: 800, color: getDaysDiff(selectedUpcomingPayout.estExDate) <= 7 ? "var(--loss)" : "var(--primary)" }}>
                {getDaysDiff(selectedUpcomingPayout.estExDate) > 0 
                  ? `อีก ${getDaysDiff(selectedUpcomingPayout.estExDate)} วัน` 
                  : "ขึ้นเครื่องหมายแล้ว (XD)"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>เงินปันผลต่อหน่วย:</span>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{fmtUSD(selectedUpcomingPayout.amountPerShare)}/หุ้น</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>ยอดปันผลที่จะได้รับรวม:</span>
              <span className={hideValues ? "privacy-blurred" : ""} style={{ fontWeight: 800, color: "var(--gain)" }}>
                {fmtUSD(selectedUpcomingPayout.estPayoutUSD)} (~{fmtTHB(selectedUpcomingPayout.estPayoutUSD * exchangeRate)})
              </span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn ripple-btn" 
            style={{ width: "100%", height: 44, border: "none", background: "var(--primary)", color: "white", fontWeight: 800, fontSize: 13, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(82, 54, 255, 0.15)" }}
            onClick={() => {
              const matchedAsset = assets.find(a => a.symbol === selectedUpcomingPayout.symbol);
              if (matchedAsset) {
                setSelectedAsset(matchedAsset);
                onClose();
              }
            }}
          >
            🔍 ดูรายละเอียดสินทรัพย์ในพอร์ต
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
