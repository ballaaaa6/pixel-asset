import React from "react";

const OPTIONS_BY_TYPE = {
  stock: [
    { name: "Dime! (Kiatnakin Phatra / เกียรตินาคินภัทร)" },
    { name: "Webull" },
    { name: "Streaming (Settrade)" },
    { name: "InnovestX (อินโนเวสท์ เอกซ์)" },
    { name: "Liberator (ลิเบอเรเตอร์)" },
    { name: "Kasikorn Securities (หลักทรัพย์กสิกรไทย / KS)" },
    { name: "Bualuang Securities (หลักทรัพย์บัวหลวง / BLS)" },
    { name: "SCB Securities (หลักทรัพย์ไทยพาณิชย์ / SCBS)" },
    { name: "Krungsri Securities (หลักทรัพย์กรุงศรี / KSS)" },
    { name: "Thanachart Securities (หลักทรัพย์ธนชาต / TNS)" },
    { name: "Finansia Syrus (หลักทรัพย์ฟินันเซีย ไซรัส / FSS)" },
    { name: "Pi Securities (หลักทรัพย์พาย / Pi)" },
    { name: "Interactive Brokers (IBKR)" },
    { name: "Robinhood" },
    { name: "Charles Schwab" },
    { name: "eToro" },
    { name: "Trading 212" },
    { name: "Plus500" }
  ],
  gold: [
    { name: "Dime! (Kiatnakin Phatra / เกียรตินาคินภัทร)" },
    { name: "Webull" },
    { name: "Streaming (Settrade)" },
    { name: "InnovestX (อินโนเวสท์ เอกซ์)" },
    { name: "Kasikorn Securities (หลักทรัพย์กสิกรไทย / KS)" },
    { name: "Bualuang Securities (หลักทรัพย์บัวหลวง / BLS)" },
    { name: "Interactive Brokers (IBKR)" },
    { name: "eToro" },
    { name: "Plus500" }
  ],
  crypto: [
    { name: "Bitkub (บิทคับ)" },
    { name: "Binance TH (ไบแนนซ์ ประเทศไทย)" },
    { name: "Binance Global (ไบแนนซ์ โกลบอล)" },
    { name: "Orbix (ออร์บิกซ์)" },
    { name: "Bitazza (บิทาซซ่า)" },
    { name: "InnovestX Crypto (อินโนเวสท์ เอกซ์ คริปโต)" },
    { name: "Upbit Thailand (อัพบิต ประเทศไทย)" },
    { name: "Coinbase" },
    { name: "OKX" },
    { name: "Bybit" },
    { name: "Kraken" },
    { name: "KuCoin" },
    { name: "Gate.io" },
    { name: "Bitfinex" },
    { name: "Metamask" },
    { name: "Ledger Wallet" },
    { name: "Trezor Wallet" },
    { name: "Trust Wallet" }
  ],
  fiat: {
    THB: [
      { name: "กสิกรไทย (Kasikornbank / KBank)" },
      { name: "ไทยพาณิชย์ (Siam Commercial Bank / SCB)" },
      { name: "กรุงเทพ (Bangkok Bank / BBL)" },
      { name: "กรุงศรีอยุธยา (Bank of Ayudhya / Krungsri)" },
      { name: "กรุงไทย (Krungthai Bank / KTB)" },
      { name: "ทหารไทยธนชาต (TMBThanachart / ttb)" },
      { name: "ออมสิน (Government Savings Bank / GSB)" },
      { name: "ธ.ก.ส. (Bank for Agriculture and Agricultural Cooperatives / BAAC)" },
      { name: "อาคารสงเคราะห์ (Government Housing Bank / GH Bank)" },
      { name: "เกียรตินาคินภัทร (Kiatnakin Phatra Bank / KKP)" },
      { name: "ซีไอเอ็มบี ไทย (CIMB Thai Bank)" },
      { name: "ยูโอบี (United Overseas Bank / UOB)" },
      { name: "แลนด์ แอนด์ เฮ้าส์ (Land and Houses Bank / LH Bank)" }
    ],
    USD: [
      { name: "JPMorgan Chase" },
      { name: "Bank of America" },
      { name: "Wells Fargo" },
      { name: "Citigroup (Citi)" },
      { name: "Goldman Sachs" },
      { name: "Morgan Stanley" },
      { name: "U.S. Bank" },
      { name: "Truist Bank" },
      { name: "PNC Bank" },
      { name: "Capital One" }
    ],
    EUR: [
      { name: "Deutsche Bank" },
      { name: "BNP Paribas" },
      { name: "Banco Santander" },
      { name: "Crédit Agricole" },
      { name: "Société Générale" },
      { name: "Intesa Sanpaolo" },
      { name: "ING Group" },
      { name: "Barclays" },
      { name: "HSBC Bank" },
      { name: "UBS" }
    ],
    GBP: [
      { name: "Barclays" },
      { name: "HSBC UK" },
      { name: "Lloyds Bank" },
      { name: "NatWest" },
      { name: "Royal Bank of Scotland (RBS)" },
      { name: "Santander UK" },
      { name: "Nationwide Building Society" },
      { name: "Standard Chartered" }
    ],
    JPY: [
      { name: "三菱UFJ銀行 (MUFG Bank)" },
      { name: "三井住友銀行 (SMBC / Sumitomo Mitsui Banking Corporation)" },
      { name: "みずほ銀行 (Mizuho Bank)" },
      { name: "ゆうちょ銀行 (Japan Post Bank)" },
      { name: "りそな銀行 (Resona Bank)" },
      { name: "住信SBIネット銀行 (SBI Sumishin Net Bank)" },
      { name: "楽天銀行 (Rakuten Bank)" }
    ],
    CNY: [
      { name: "中国工商银行 (Industrial and Commercial Bank of China / ICBC)" },
      { name: "中国建设银行 (China Construction Bank / CCB)" },
      { name: "中国农业银行 (Agricultural Bank of China / ABC)" },
      { name: "中国银行 (Bank of China / BOC)" },
      { name: "交通银行 (Bank of Communications / BOCOM)" }
    ],
    KRW: [
      { name: "KB국민은행 (KB Kookmin Bank)" },
      { name: "신한은행 (Shinhan Bank)" },
      { name: "하나은행 (Hana Bank)" },
      { name: "우리은행 (Woori Bank)" },
      { name: "IBK기업은행 (Industrial Bank of Korea / IBK)" },
      { name: "카카오뱅크 (KakaoBank)" }
    ],
    SGD: [
      { name: "DBS Bank" },
      { name: "OCBC Bank" },
      { name: "UOB Bank" }
    ],
    AUD: [
      { name: "Commonwealth Bank of Australia (CBA)" },
      { name: "Westpac" },
      { name: "ANZ Bank" },
      { name: "National Australia Bank (NAB)" }
    ],
    HKD: [
      { name: "HSBC Hong Kong" },
      { name: "中國銀行(香港) (Bank of China Hong Kong / BOCHK)" },
      { name: "恒生銀行 (Hang Seng Bank)" },
      { name: "Standard Chartered Hong Kong" }
    ],
    default: [
      { name: "Wise" },
      { name: "Revolut" },
      { name: "PayPal" },
      { name: "Payoneer" }
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

  return (
    <div className="suggestions-dropdown" style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", zIndex: 1000 }}>
      {filteredOptions.map((opt) => {
        const isSelected = value === opt.name;
        return (
          <div
            key={opt.name}
            className={`suggestion-item ${isSelected ? "active" : ""}`}
            style={{
              background: isSelected ? "var(--primary-light, #EEECFF)" : "transparent",
              color: isSelected ? "var(--primary, #5236FF)" : "var(--text-main, #0F172A)",
              fontWeight: isSelected ? "700" : "500",
              padding: "10px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "background 0.15s",
              fontSize: "12.5px"
            }}
            onMouseDown={(e) => {
              // Use onMouseDown and prevent default to prevent input blur from firing before selecting
              e.preventDefault();
              onChange(opt.name);
            }}
          >
            <span>{opt.name}</span>
            {isSelected && <span style={{ fontSize: 10, opacity: 0.9 }}>✓ เลือกอยู่</span>}
          </div>
        );
      })}
    </div>
  );
}
