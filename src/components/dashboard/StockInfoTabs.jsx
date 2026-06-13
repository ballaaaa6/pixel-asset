import React, { useState, useEffect, useRef } from "react";
import { BookOpen, BarChart3, Landmark, Percent, Calendar } from "lucide-react";
import StockSummaryTab from "./StockSummaryTab";
import StockQuarterlyTab from "./StockQuarterlyTab";
import StockFinancialsTab from "./StockFinancialsTab";
import StockPerformanceTab from "./StockPerformanceTab";
import StockNewsTab from "./StockNewsTab";

export default function StockInfoTabs({ 
  symbol = "",
  profile = {}, 
  metrics = {}, 
  earnings = [], 
  news = [], 
  calendar = [], 
  thaiSummary = "" 
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const navRef = useRef(null);

  const isNonEquity = symbol.includes("-") || symbol.includes("=") || symbol.includes("/") || symbol.startsWith("^");

  const allTabs = [
    { id: "summary", label: "สรุปสินทรัพย์", icon: BookOpen },
    { id: "quarterly", label: "สรุปไตรมาส", icon: Calendar },
    { id: "financials", label: "ข้อมูลการเงิน", icon: Landmark },
    { id: "performance", label: "ผลตอบแทน", icon: Percent },
    { id: "news", label: "ข่าวล่าสุด", icon: BarChart3 }
  ];

  const tabs = isNonEquity 
    ? allTabs.filter(t => t.id === "summary" || t.id === "performance" || t.id === "news")
    : allTabs;

  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab)) {
      setActiveTab("summary");
    }
  }, [symbol, activeTab]);

  const formatLargeNum = (num) => {
    if (num == null) return "-";
    const prefix = profile.currency === "THB" ? "฿" : "$";
    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(2)}M`;
    return `${sign}${prefix}${abs.toLocaleString()}`;
  };

  const fmtPercent = (val) => {
    if (val == null) return "-";
    return `${val.toFixed(2)}%`;
  };

  const fmtVal = (val, customPrefix = null) => {
    if (val == null) return "-";
    const prefix = customPrefix !== null ? customPrefix : (profile.currency === "THB" ? "฿" : "$");
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    return `${sign}${prefix}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tabs navigation row */}
      <div 
        ref={navRef}
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
              onClick={() => {
                setActiveTab(tab.id);
                if (navRef.current) {
                  navRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
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
