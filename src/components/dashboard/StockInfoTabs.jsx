import React, { useState } from "react";
import { BookOpen, BarChart3, Landmark, Percent, Calendar } from "lucide-react";
import StockSummaryTab from "./StockSummaryTab";
import StockQuarterlyTab from "./StockQuarterlyTab";
import StockFinancialsTab from "./StockFinancialsTab";
import StockPerformanceTab from "./StockPerformanceTab";
import StockNewsTab from "./StockNewsTab";

export default function StockInfoTabs({ 
  profile = {}, 
  metrics = {}, 
  earnings = [], 
  news = [], 
  calendar = [], 
  thaiSummary = "" 
}) {
  const [activeTab, setActiveTab] = useState("summary");

  const tabs = [
    { id: "summary", label: "สรุปบริษัท", icon: BookOpen },
    { id: "quarterly", label: "สรุปไตรมาส", icon: Calendar },
    { id: "financials", label: "ข้อมูลการเงิน", icon: Landmark },
    { id: "performance", label: "ผลตอบแทน", icon: Percent },
    { id: "news", label: "ข่าวล่าสุด", icon: BarChart3 }
  ];

  const formatLargeNum = (num) => {
    if (num == null) return "-";
    const prefix = profile.currency === "THB" ? "฿" : "$";
    if (num >= 1e12) return `${prefix}${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M`;
    return `${prefix}${num.toLocaleString()}`;
  };

  const fmtPercent = (val) => {
    if (val == null) return "-";
    return `${val.toFixed(2)}%`;
  };

  const fmtVal = (val, customPrefix = null) => {
    if (val == null) return "-";
    const prefix = customPrefix !== null ? customPrefix : (profile.currency === "THB" ? "฿" : "$");
    return `${prefix}${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tabs navigation row */}
      <div 
        style={{ 
          display: "flex", 
          gap: 4, 
          background: "rgba(0,0,0,0.02)", 
          padding: 4, 
          borderRadius: 12, 
          border: "1px solid var(--border)", 
          overflowX: "auto",
          whiteSpace: "nowrap"
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                background: isActive ? "var(--bg-card)" : "transparent",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{ background: "rgba(0,0,0,0.005)", minHeight: 180 }}>
        {activeTab === "summary" && (
          <StockSummaryTab 
            profile={profile} 
            thaiSummary={thaiSummary} 
            formatLargeNum={formatLargeNum} 
          />
        )}

        {activeTab === "quarterly" && (
          <StockQuarterlyTab 
            earnings={earnings} 
            calendar={calendar} 
            currency={profile.currency || "USD"}
            metrics={metrics}
          />
        )}

        {activeTab === "financials" && (
          <StockFinancialsTab 
            metrics={metrics} 
            formatLargeNum={formatLargeNum} 
            fmtPercent={fmtPercent} 
            fmtVal={fmtVal} 
          />
        )}

        {activeTab === "performance" && (
          <StockPerformanceTab 
            metrics={metrics} 
            currency={profile.currency || "USD"}
          />
        )}

        {activeTab === "news" && (
          <StockNewsTab 
            news={news} 
          />
        )}
      </div>
    </div>
  );
}
