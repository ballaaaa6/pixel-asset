import React from "react";
import { getPoints, smoothPath } from "./chartUtils";

export const SparklineChart = React.memo(function SparklineChart({ closes, width = 70, height = 32 }) {
  const W = width, H = height;
  if (!closes || closes.length < 3) {
    return (
      <div className="sparkline-cell skeleton" style={{ borderRadius: 0, width: W, height: H }} />
    );
  }
  const pts = getPoints(closes, W, H, 2, 4);
  const isUp = closes[closes.length - 1] >= closes[0];
  const color = isUp ? "var(--gain)" : "var(--loss)";
  const fill = isUp ? "rgba(0,255,102,0.08)" : "rgba(255,51,102,0.08)";
  const linePath = smoothPath(pts);
  const first = pts[0], last = pts[pts.length - 1];
  const fillPath = linePath + ` L ${last.x},${H} L ${first.x},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="sparkline-svg chart-svg">
      <path d={fillPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" />
      <circle cx={last.x} cy={last.y} r="2" fill={color} />
    </svg>
  );
});
export default SparklineChart;
