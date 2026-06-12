import React from "react";

export function PointGuidesAndBadges({
  pt,
  type = "hover",
  W,
  H,
  PAD_L,
  PAD_R,
  PAD_T,
  PAD_B,
  yValText
}) {
  if (!pt) return null;

  let fillBg = "#1E293B";
  let strokeCol = "#64748B";
  let lineCol = "#94A3B8";

  if (type === "diffA") {
    fillBg = "#2563EB";   // Point 1: Blue
    strokeCol = "#93C5FD";
    lineCol = "#3B82F6";
  } else if (type === "diffB") {
    fillBg = "#D97706";   // Point 2: Amber/Orange
    strokeCol = "#FDE68A";
    lineCol = "#F59E0B";
  }

  // Dynamic badge calculations
  const dateObj = new Date(pt.date);
  const dateStr = dateObj.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  const timeStr = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const xValText = `${dateStr} ${timeStr} น.`;
  const rectW_X = xValText.length * 7.5 + 16;
  const badgeX = Math.max(2, Math.min(W - rectW_X - 2, pt.x - rectW_X / 2));

  const rectW_Y = yValText.length * 7 + 16;
  const badgeX_Y = Math.max(2, PAD_L - rectW_Y - 4);
  const badgeY = Math.max(PAD_T, Math.min(H - PAD_B - 22, pt.y - 11));

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Guidelines */}
      <line
        x1={pt.x} y1={PAD_T}
        x2={pt.x} y2={H - PAD_B}
        stroke={lineCol}
        strokeWidth="1.2"
        strokeDasharray="4 4"
      />
      <line
        x1={PAD_L} y1={pt.y}
        x2={pt.x} y2={pt.y}
        stroke={lineCol}
        strokeWidth="1.2"
        strokeDasharray="4 4"
      />

      {/* X-axis coordinate badge */}
      <rect
        x={badgeX}
        y={H - PAD_B + 2}
        width={rectW_X}
        height={22}
        rx={4}
        fill={fillBg}
        stroke={strokeCol}
        strokeWidth="1"
      />
      <text
        x={badgeX + rectW_X / 2}
        y={H - PAD_B + 17}
        textAnchor="middle"
        fontSize="12"
        fill="#F8FAFC"
        fontWeight="bold"
        fontFamily="Outfit,sans-serif"
      >
        {xValText}
      </text>

      {/* Y-axis coordinate badge */}
      <rect
        x={badgeX_Y}
        y={badgeY}
        width={rectW_Y}
        height={22}
        rx={4}
        fill={fillBg}
        stroke={strokeCol}
        strokeWidth="1"
      />
      <text
        x={badgeX_Y + rectW_Y / 2}
        y={badgeY + 15}
        textAnchor="middle"
        fontSize="12"
        fill="#F8FAFC"
        fontWeight="bold"
        fontFamily="Outfit,sans-serif"
      >
        {yValText}
      </text>
    </g>
  );
}

export default PointGuidesAndBadges;
