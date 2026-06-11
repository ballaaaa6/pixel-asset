import React, { useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { fmtUSD, fmtTHB, fmtPct } from "../../utils/formatters";

import ValueDetailView from "./ValueDetailView";
import TodayDetailView from "./TodayDetailView";
import PnLDetailView from "./PnLDetailView";
import BestDetailView from "./BestDetailView";

export default function KPIDetailsModal({
  isOpen,
  onClose,
  type,
  assets,
  prices,
  exchangeRate,
  totalUSD,
  totalCostUSD,
  todayChangeUSD,
  todayChangePct,
  totalGainUSD,
  totalGainPct,
  totalGainTHB,
  totalRealizedUSD,
  totalUnrealizedUSD,
  bestAsset,
  sortedAssets,
  donutSegments,
  initialCapitalUSD,
  historicalRates
}) {
  useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  const fmt = useMemo(() => ({
    usd: (n) => fmtUSD(n, false),
    thb: (n, decimals = 2) => fmtTHB(n, decimals, false),
    pct: fmtPct
  }), []);

  const modalTitle = useMemo(() => {
    switch (type) {
      case "value": return "💰 รายละเอียดมูลค่าสินทรัพย์รวม";
      case "today": return "📅 วิเคราะห์ความเคลื่อนไหววันนี้";
      case "pnl": return "📊 สรุปกำไร/ขาดทุนสะสม";
      case "best": return "🏆 ข้อมูลสินทรัพย์ที่โดดเด่นที่สุด";
      default: return "ℹ️ รายละเอียดข้อมูล";
    }
  }, [type]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ background: "var(--bg-modal)", backdropFilter: "blur(20px)" }}>
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
          <span className="modal-title" style={{ fontSize: 19, fontWeight: 800 }}>{modalTitle}</span>
          <button className="btn-close" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, overflowY: "auto" }}>
          {type === "value" && (
            <ValueDetailView
              assets={sortedAssets}
              exchangeRate={exchangeRate}
              totalUSD={totalUSD}
              fmt={fmt}
            />
          )}
          {type === "today" && (
            <TodayDetailView
              sortedAssets={sortedAssets}
              todayChangeUSD={todayChangeUSD}
              todayChangePct={todayChangePct}
              exchangeRate={exchangeRate}
              fmt={fmt}
            />
          )}
          {type === "pnl" && (
            <PnLDetailView
              sortedAssets={sortedAssets}
              totalGainUSD={totalGainUSD}
              totalGainTHB={totalGainTHB}
              totalGainPct={totalGainPct}
              totalRealizedUSD={totalRealizedUSD}
              totalUnrealizedUSD={totalUnrealizedUSD}
              exchangeRate={exchangeRate}
              historicalRates={historicalRates}
              initialCapitalUSD={initialCapitalUSD}
              totalUSD={totalUSD}
              fmt={fmt}
            />
          )}
          {type === "best" && (
            <BestDetailView
              sortedAssets={sortedAssets}
              bestAsset={bestAsset}
              totalGainUSD={totalGainUSD}
              fmt={fmt}
            />
          )}
        </div>
      </div>
    </div>
  );
}
