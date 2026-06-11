import React from "react";

export default function MarketBadge({ state, extChangePct }) {
  if (!state || state === "REGULAR") return null;
  const map = {
    PRE: { label: "PRE", cls: "pre" },
    POST: { label: "POST", cls: "post" },
    CLOSED: { label: "CLOSED", cls: "post" }
  };
  const info = map[state] || { label: state, cls: "post" };

  const style = {
    fontSize: 9,
    fontWeight: 800,
  };

  if (extChangePct != null) {
    const isUp = extChangePct >= 0;
    style.backgroundColor = isUp ? "var(--gain-light)" : "var(--loss-light)";
    style.color = isUp ? "var(--gain)" : "var(--loss)";
  }

  return (
    <span className={`badge-market-state ${info.cls}`} style={style}>
      {info.label}
    </span>
  );
}
