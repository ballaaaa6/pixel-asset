import React from "react";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function DividendChart({
  next12Months,
  maxMonthlyPayout,
  hideValues,
  hoveredBar,
  setHoveredBar
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: 180, marginTop: 10 }}>
      {/* Custom Responsive SVG Chart */}
      <svg viewBox="0 0 600 180" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = 140 - ratio * 120;
          return (
            <g key={i}>
              <line x1="40" y1={y} x2="580" y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
              <text x="32" y={y + 4} textAnchor="end" fill="var(--text-faint)" fontSize="9" fontWeight="700">
                {hideValues ? "***" : `$${(maxMonthlyPayout * ratio).toFixed(0)}`}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {next12Months.map((m, idx) => {
          const barWidth = 28;
          const gap = 16;
          const startX = 60 + idx * (barWidth + gap);
          const barHeight = (m.value / maxMonthlyPayout) * 120;
          const barY = 140 - barHeight;

          const isHovered = hoveredBar === idx;

          return (
            <g 
              key={idx}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={startX}
                y={barY}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx="6"
                fill={isHovered ? "var(--primary)" : "url(#barGlow)"}
                style={{ transition: "all 0.2s ease" }}
              />
              <text
                x={startX + barWidth / 2}
                y={156}
                textAnchor="middle"
                fill={isHovered ? "var(--primary)" : "var(--text-muted)"}
                fontSize="10"
                fontWeight="800"
              >
                {THAI_MONTHS[m.month]}
              </text>

              {/* Value label on hover */}
              {isHovered && m.value > 0 && (
                <g>
                  <rect
                    x={startX - 20}
                    y={barY - 30}
                    width={barWidth + 40}
                    height={22}
                    rx="6"
                    fill="rgba(15, 23, 42, 0.9)"
                    boxShadow="var(--shadow-md)"
                  />
                  <text
                    x={startX + barWidth / 2}
                    y={barY - 15}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="800"
                  >
                    {hideValues ? "***" : `$${m.value.toFixed(2)}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        <line x1="40" y1="140" x2="580" y2="140" stroke="var(--text-faint)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
