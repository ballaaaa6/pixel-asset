import React from "react";
import { getShortEngName } from "../../utils/brokerHelpers.js";

const PRESETS = [
  // Stock/Gold Brokers
  { pattern: "dime", colors: ["#22C55E"] },
  { pattern: "webull", colors: ["#0052FF", "#00C2FF"] },
  { pattern: "streaming", colors: ["#0B3C95"] },
  { pattern: "innovestx", colors: ["#5022ED"] },
  { pattern: "liberator", colors: ["#000000"] },
  { pattern: "patra", colors: ["#A21C26"] },
  { pattern: "kkp", colors: ["#A21C26"] },
  { pattern: "scbs", colors: ["#4E2E7F"] },
  { pattern: "bualuang", colors: ["#003399"] },
  { pattern: "bls", colors: ["#003399"] },
  { pattern: "thanachart", colors: ["#FF6600"] },
  { pattern: "tns", colors: ["#FF6600"] },
  { pattern: "finansia", colors: ["#0099FF"] },
  { pattern: "fss", colors: ["#0099FF"] },
  { pattern: "kasikorn", colors: ["#138F5B"] },
  { pattern: "ksecurities", colors: ["#138F5B"] },
  { pattern: "kss", colors: ["#ECC538"] },
  { pattern: "pi securities", colors: ["#000000"] },
  { pattern: "interactive brokers", colors: ["#FF0000"] },
  { pattern: "ibkr", colors: ["#FF0000"] },
  { pattern: "robinhood", colors: ["#00C805"] },
  { pattern: "schwab", colors: ["#00843D"] },
  { pattern: "etoro", colors: ["#46C300"] },
  { pattern: "plus500", colors: ["#0A2540"] },
  { pattern: "trading212", colors: ["#0099FF"] },

  // Crypto
  { pattern: "bitkub", colors: ["#00E575"] },
  { pattern: "binance th", colors: ["#F0B90B", "#181A20"] },
  { pattern: "binance global", colors: ["#F0B90B", "#181A20"] },
  { pattern: "binance", colors: ["#F0B90B", "#181A20"] },
  { pattern: "orbix", colors: ["#00C4FF"] },
  { pattern: "coinbase", colors: ["#0052FF"] },
  { pattern: "okx", colors: ["#000000"] },
  { pattern: "bybit", colors: ["#F5A623"] },
  { pattern: "gate.io", colors: ["#D12127"] },
  { pattern: "kucoin", colors: ["#00B574"] },
  { pattern: "bitazza", colors: ["#00FFCC"] },
  { pattern: "upbit", colors: ["#094E9B"] },
  { pattern: "bitfinex", colors: ["#000000"] },
  { pattern: "kraken", colors: ["#5741D9"] },
  { pattern: "metamask", colors: ["#F6851B"] },
  { pattern: "ledger", colors: ["#000000"] },
  { pattern: "trezor", colors: ["#008542"] },
  { pattern: "trust wallet", colors: ["#3375BB"] },

  // Thai banks
  { pattern: "กสิกร", colors: ["#138F5B"] },
  { pattern: "kasikorn", colors: ["#138F5B"] },
  { pattern: "kbank", colors: ["#138F5B"] },
  { pattern: "ไทยพาณิชย์", colors: ["#4E2E7F"] },
  { pattern: "siam commercial", colors: ["#4E2E7F"] },
  { pattern: "scb", colors: ["#4E2E7F"] },
  { pattern: "กรุงเทพ", colors: ["#003399"] },
  { pattern: "bangkok bank", colors: ["#003399"] },
  { pattern: "bbl", colors: ["#003399"] },
  { pattern: "กรุงศรี", colors: ["#ECC538"] },
  { pattern: "ayudhya", colors: ["#ECC538"] },
  { pattern: "krungsri", colors: ["#ECC538"] },
  { pattern: "กรุงไทย", colors: ["#00A4E4"] },
  { pattern: "krungthai", colors: ["#00A4E4"] },
  { pattern: "ktb", colors: ["#00A4E4"] },
  { pattern: "ทหารไทยธนชาต", colors: ["#005DFE", "#FF5000"] },
  { pattern: "tmbthanachart", colors: ["#005DFE", "#FF5000"] },
  { pattern: "ttb", colors: ["#005DFE", "#FF5000"] },
  { pattern: "ออมสิน", colors: ["#E00A8B"] },
  { pattern: "gsb", colors: ["#E00A8B"] },
  { pattern: "ธ.ก.ส", colors: ["#00823B"] },
  { pattern: "baac", colors: ["#00823B"] },
  { pattern: "อาคารสงเคราะห์", colors: ["#FF5000"] },
  { pattern: "gh bank", colors: ["#FF5000"] },
  { pattern: "เกียรตินาคิน", colors: ["#A21C26"] },
  { pattern: "kiatnakin", colors: ["#A21C26"] },
  { pattern: "kkp", colors: ["#A21C26"] },
  { pattern: "ซีไอเอ็มบี", colors: ["#E50012"] },
  { pattern: "cimb", colors: ["#E50012"] },
  { pattern: "ยูโอบี", colors: ["#0F3F7A"] },
  { pattern: "uob", colors: ["#0F3F7A"] },
  { pattern: "แลนด์ แอนด์ เฮ้าส์", colors: ["#0A6A56"] },
  { pattern: "lh bank", colors: ["#0A6A56"] },

  // US Banks
  { pattern: "chase", colors: ["#0A4376"] },
  { pattern: "jpmorgan", colors: ["#0A4376"] },
  { pattern: "bank of america", colors: ["#E31837", "#0A2540"] },
  { pattern: "wells fargo", colors: ["#D11241", "#FFD700"] },
  { pattern: "citigroup", colors: ["#004B87", "#ED1C24"] },
  { pattern: "citi", colors: ["#004B87", "#ED1C24"] },
  { pattern: "goldman", colors: ["#0A2240"] },
  { pattern: "morgan stanley", colors: ["#002A54"] },
  { pattern: "u.s. bank", colors: ["#002F6C"] },
  { pattern: "truist", colors: ["#4F2683"] },
  { pattern: "pnc", colors: ["#0072C6"] },
  { pattern: "capital one", colors: ["#00497B", "#D22630"] },

  // European Banks
  { pattern: "deutsche bank", colors: ["#0018A8"] },
  { pattern: "bnp paribas", colors: ["#009A5A"] },
  { pattern: "santander", colors: ["#EC0000"] },
  { pattern: "crédit agricole", colors: ["#007A87"] },
  { pattern: "société générale", colors: ["#FF0000", "#000000"] },
  { pattern: "intesa", colors: ["#007A3E"] },
  { pattern: "ing group", colors: ["#FF6600"] },
  { pattern: "ubs", colors: ["#7F7F7F"] },
  { pattern: "barclays", colors: ["#00AEEF"] },
  { pattern: "hsbc", colors: ["#DB0011", "#7F7F7F"] },
  { pattern: "lloyds", colors: ["#006A4E"] },
  { pattern: "natwest", colors: ["#5E2750"] },
  { pattern: "royal bank of scotland", colors: ["#002C77"] },
  { pattern: "rbs", colors: ["#002C77"] },
  { pattern: "nationwide", colors: ["#002C5E", "#DB0011"] },
  { pattern: "standard chartered", colors: ["#00843D", "#0038A8"] },

  // Japanese Banks
  { pattern: "mufg", colors: ["#E60012"] },
  { pattern: "三菱ufj", colors: ["#E60012"] },
  { pattern: "smbc", colors: ["#00793C", "#FFF100"] },
  { pattern: "三井住友", colors: ["#00793C", "#FFF100"] },
  { pattern: "mizuho", colors: ["#000099"] },
  { pattern: "みずほ", colors: ["#000099"] },
  { pattern: "ゆうcho", colors: ["#008F5A"] },
  { pattern: "japan post", colors: ["#008F5A"] },
  { pattern: "resona", colors: ["#00A040"] },
  { pattern: "りそな", colors: ["#00A040"] },
  { pattern: "sbi sumishin", colors: ["#0054A6"] },
  { pattern: "住信sbi", colors: ["#0054A6"] },
  { pattern: "rakuten", colors: ["#BF0000"] },
  { pattern: "楽天", colors: ["#BF0000"] },

  // Chinese Banks
  { pattern: "icbc", colors: ["#E60012"] },
  { pattern: "工商银行", colors: ["#E60012"] },
  { pattern: "ccb", colors: ["#0054A6"] },
  { pattern: "建设银行", colors: ["#0054A6"] },
  { pattern: "abc", colors: ["#009080"] },
  { pattern: "农业银行", colors: ["#009080"] },
  { pattern: "boc", colors: ["#C8161D"] },
  { pattern: "中国银行", colors: ["#C8161D"] },
  { pattern: "bocom", colors: ["#003399"] },
  { pattern: "交通银行", colors: ["#003399"] },

  // Korean Banks
  { pattern: "kookmin", colors: ["#FFC400", "#4A3C31"] },
  { pattern: "kb국민", colors: ["#FFC400", "#4A3C31"] },
  { pattern: "shinhan", colors: ["#003893"] },
  { pattern: "신한", colors: ["#003893"] },
  { pattern: "hana bank", colors: ["#006863"] },
  { pattern: "하나", colors: ["#006863"] },
  { pattern: "woori", colors: ["#007BC3"] },
  { pattern: "우리", colors: ["#007BC3"] },
  { pattern: "ibk", colors: ["#00539C"] },
  { pattern: "기업은행", colors: ["#00539C"] },
  { pattern: "kakaobank", colors: ["#FFE600", "#3C3C3C"] },
  { pattern: "카카오", colors: ["#FFE600", "#3C3C3C"] },

  // Singapore Banks
  { pattern: "dbs", colors: ["#FF0000", "#000000"] },
  { pattern: "ocbc", colors: ["#D8232A"] },

  // Australian Banks
  { pattern: "cba", colors: ["#FFCC00", "#000000"] },
  { pattern: "commonwealth", colors: ["#FFCC00", "#000000"] },
  { pattern: "westpac", colors: ["#E4002B"] },
  { pattern: "anz", colors: ["#0072AC"] },
  { pattern: "nab", colors: ["#E4002B", "#000000"] },

  // Hong Kong Banks
  { pattern: "hang seng", colors: ["#007D3E"] },
  { pattern: "恒生", colors: ["#007D3E"] },

  // Fallbacks
  { pattern: "revolut", colors: ["#EB008B", "#00A4E4"] },
  { pattern: "wise", colors: ["#9FE870"] },
  { pattern: "paypal", colors: ["#003087", "#0079C1"] },
  { pattern: "payoneer", colors: ["#FF4500"] }
];

export function getBrokerColors(brokerName) {
  if (!brokerName) return null;
  const nameLower = brokerName.toLowerCase();
  for (const preset of PRESETS) {
    if (nameLower.includes(preset.pattern)) {
      return preset.colors;
    }
  }
  return null;
}

export default function BrokerBadge({ broker }) {
  if (!broker) return null;
  
  const shortName = getShortEngName(broker);
  const colors = getBrokerColors(shortName);
  
  // Custom baseline style for badges
  const baseStyle = {
    fontSize: "10px",
    fontWeight: "800",
    padding: "1px 6px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    display: "inline-block"
  };

  if (!colors) {
    return (
      <span style={{
        ...baseStyle,
        color: "var(--primary, #5236FF)",
        background: "var(--primary-light, #EEECFF)",
        border: "1.5px solid rgba(82,54,255,0.15)"
      }}>
        {shortName}
      </span>
    );
  }

  if (colors.length === 1) {
    const color = colors[0];
    return (
      <span style={{
        ...baseStyle,
        color: color,
        background: "transparent",
        border: `1.5px solid ${color}`
      }}>
        {shortName}
      </span>
    );
  }

  // Two-color diagonal split border
  const [color1, color2] = colors;
  return (
    <span style={{
      ...baseStyle,
      color: color1,
      background: `linear-gradient(var(--bg-card, #FFFFFF), var(--bg-card, #FFFFFF)) padding-box, linear-gradient(135deg, ${color1} 50%, ${color2} 50%) border-box`,
      border: "1.5px solid transparent"
    }}>
      {shortName}
    </span>
  );
}
