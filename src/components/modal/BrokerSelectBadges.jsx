import React from "react";

const OPTIONS_BY_TYPE = {
  stock: [
    { name: "Dime!", colors: ["#22C55E"] },
    { name: "Webull", colors: ["#0052FF", "#00C2FF"] },
    { name: "Streaming", colors: ["#0B3C95"] }
  ],
  gold: [
    { name: "Dime!", colors: ["#22C55E"] },
    { name: "Webull", colors: ["#0052FF", "#00C2FF"] },
    { name: "Streaming", colors: ["#0B3C95"] }
  ],
  crypto: [
    { name: "Bitkub", colors: ["#00E575"] },
    { name: "Binance TH", colors: ["#F0B90B", "#181A20"] },
    { name: "Binance Global", colors: ["#F0B90B", "#181A20"] }
  ],
  fiat: {
    THB: [
      { name: "กสิกรไทย", colors: ["#138F5B"] },
      { name: "ไทยพาณิชย์", colors: ["#4E2E7F"] },
      { name: "กรุงเทพ", colors: ["#003399"] },
      { name: "กรุงศรี", colors: ["#ECC538"] },
      { name: "กรุงไทย", colors: ["#00A4E4"] },
      { name: "ทีทีบี", colors: ["#005DFE", "#FF5000"] }
    ],
    USD: [
      { name: "JPMorgan Chase", colors: ["#0A4376"] },
      { name: "Bank of America", colors: ["#E31837", "#0A2540"] },
      { name: "Wells Fargo", colors: ["#D11241", "#FFD700"] },
      { name: "Citi", colors: ["#004B87", "#ED1C24"] }
    ],
    EUR: [
      { name: "Deutsche Bank", colors: ["#0018A8"] },
      { name: "BNP Paribas", colors: ["#009A5A"] },
      { name: "Santander", colors: ["#EC0000"] },
      { name: "HSBC", colors: ["#DB0011", "#7F7F7F"] }
    ],
    GBP: [
      { name: "Barclays", colors: ["#00AEEF"] },
      { name: "HSBC", colors: ["#DB0011", "#7F7F7F"] },
      { name: "Lloyds Bank", colors: ["#006A4E"] }
    ],
    JPY: [
      { name: "MUFG", colors: ["#E60012"] },
      { name: "SMBC", colors: ["#00793C", "#FFF100"] },
      { name: "Mizuho", colors: ["#000099"] }
    ],
    default: [
      { name: "Revolut", colors: ["#EB008B", "#00A4E4"] },
      { name: "Wise", colors: ["#9FE870"] },
      { name: "PayPal", colors: ["#003087", "#0079C1"] }
    ]
  }
};

export default function BrokerSelectBadges({ type, symbol, value, onChange }) {
  let options = [];
  
  if (type === "stock" || type === "gold") {
    options = OPTIONS_BY_TYPE[type] || [];
  } else if (type === "crypto") {
    options = OPTIONS_BY_TYPE.crypto || [];
  } else if (type === "fiat") {
    const cur = (symbol || "THB").toUpperCase();
    options = OPTIONS_BY_TYPE.fiat[cur] || OPTIONS_BY_TYPE.fiat.default || [];
  }

  // Filter options based on typed input
  const filteredOptions = value
    ? options.filter(opt => opt.name.toLowerCase().includes(value.toLowerCase()))
    : options;

  if (filteredOptions.length === 0) return null;

  const getBadgeStyle = (colors, isSelected) => {
    const baseStyle = {
      padding: "8px 12px",
      fontSize: "12px",
      borderRadius: "10px",
      cursor: "pointer",
      width: "calc(100% - 16px)",
      margin: "4px 8px",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "var(--transition)",
      boxSizing: "border-box",
      fontFamily: "inherit",
      boxShadow: "var(--shadow-sm)"
    };

    if (colors.length === 1) {
      const color = colors[0];
      return {
        ...baseStyle,
        border: `2px solid ${color}`,
        color: isSelected ? "#FFFFFF" : color,
        backgroundColor: isSelected ? color : "var(--bg-card, #FFFFFF)",
        fontWeight: isSelected ? "800" : "700"
      };
    }
    
    // Two colors (diagonal split border / background)
    const [color1, color2] = colors;
    if (isSelected) {
      return {
        ...baseStyle,
        border: "2px solid transparent",
        backgroundImage: `linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`,
        backgroundOrigin: "border-box",
        backgroundClip: "border-box",
        color: "#FFFFFF",
        fontWeight: "800"
      };
    } else {
      return {
        ...baseStyle,
        border: "2px solid transparent",
        backgroundImage: `linear-gradient(var(--bg-card, #FFFFFF), var(--bg-card, #FFFFFF)), linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        color: "var(--text-main, #0F172A)",
        fontWeight: "700"
      };
    }
  };

  return (
    <div className="suggestions-dropdown" style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", zIndex: 1000 }}>
      {filteredOptions.map((opt) => {
        const isSelected = value === opt.name;
        return (
          <div
            key={opt.name}
            style={{ padding: "2px 0" }}
          >
            <button
              type="button"
              style={getBadgeStyle(opt.colors, isSelected)}
              onMouseDown={(e) => {
                // Use onMouseDown and prevent default to prevent input blur from firing before selecting
                e.preventDefault();
                onChange(opt.name);
              }}
            >
              <span>{opt.name}</span>
              {isSelected && <span style={{ fontSize: 10, opacity: 0.9 }}>✓ เลือกอยู่</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}
