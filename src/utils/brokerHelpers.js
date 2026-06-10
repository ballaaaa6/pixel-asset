/**
 * Utility to normalize combined broker and bank names to their short English equivalents.
 */

export function getShortEngName(name) {
  if (!name) return "";
  const n = name.trim();
  const nUpper = n.toUpperCase();

  // 0. Explicit mappings for stock/crypto brokers to avoid incorrect bank matches
  if (nUpper.includes("DIME")) return "Dime!";
  if (nUpper.includes("INNOVESTX")) {
    if (nUpper.includes("CRYPTO")) return "InnovestX Crypto";
    return "InnovestX";
  }

  // 1. Explicit mappings for banks (where English/short name is inside parentheses)
  // Thai Banks
  if (n.includes("กสิกรไทย")) return "KBank";
  if (n.includes("ไทยพาณิชย์")) return "SCB";
  if (n.includes("กรุงเทพ")) return "BBL";
  if (n.includes("กรุงศรีอยุธยา")) return "Krungsri";
  if (n.includes("กรุงไทย")) return "KTB";
  if (n.includes("ทหารไทยธนชาต") || n.includes("ttb") || n.includes("TMBThanachart")) return "ttb";
  if (n.includes("ออมสิน")) return "GSB";
  if (n.includes("ธ.ก.ส")) return "BAAC";
  if (n.includes("อาคารสงเคราะห์")) return "GH Bank";
  if (n.includes("เกียรตินาคิน")) return "KKP";
  if (n.includes("ซีไอเอ็มบี")) return "CIMB";
  if (n.includes("ยูโอบี")) return "UOB";
  if (n.includes("แลนด์ แอนด์ เฮ้าส์")) return "LH Bank";

  // Japanese Banks
  if (n.includes("三菱UFJ")) return "MUFG";
  if (n.includes("三井住友")) return "SMBC";
  if (n.includes("みずほ")) return "Mizuho";
  if (n.includes("ゆうちょ")) return "Japan Post Bank";
  if (n.includes("りそな")) return "Resona";
  if (n.includes("住信SBI")) return "SBI Sumishin";
  if (n.includes("楽天")) return "Rakuten";

  // Chinese Banks
  if (n.includes("工商银行")) return "ICBC";
  if (n.includes("建设银行")) return "CCB";
  if (n.includes("农业银行")) return "ABC";
  if (n.includes("中国银行")) return "BOC";
  if (n.includes("交通银行")) return "BOCOM";

  // Korean Banks
  if (n.includes("국민은행")) return "KB Bank";
  if (n.includes("신한은행")) return "Shinhan Bank";
  if (n.includes("하나은행")) return "Hana Bank";
  if (n.includes("우리은행")) return "Woori Bank";
  if (n.includes("기업은행")) return "IBK";
  if (n.includes("카카오뱅크")) return "KakaoBank";

  // 2. Default fallback: Extract the part outside parentheses if it starts with English letters
  const match = n.match(/^([A-Za-z0-9\s!&.-]+)(?:\s*\(.*?\))?/);
  if (match && match[1].trim()) {
    const ext = match[1].trim();
    // Verify it contains at least some letters
    if (/[A-Za-z]/.test(ext)) {
      return ext;
    }
  }

  return n;
}
