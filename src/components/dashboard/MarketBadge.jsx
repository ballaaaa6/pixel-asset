import React from "react";

export default function MarketBadge({ state }) {
  if (!state || state === "REGULAR") return null;
  const map = {
    PRE: { label: "PRE", cls: "pre" },
    POST: { label: "POST", cls: "post" },
    CLOSED: { label: "CLOSED", cls: "post" }
  };
  const info = map[state] || { label: state, cls: "post" };
  return (
    <span className={`badge-market ${info.cls}`} style={{ fontSize: 9, fontWeight: 800 }}>
      {info.label}
    </span>
  );
}
