import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Search, Save, Plus, Trash2, ChevronDown, ChevronUp, History } from "lucide-react";

/* ─── Global Currencies List (165+ สกุลเงินทั่วโลก) ─── */
const CURRENCIES = [
  { code: "THB", name: "Thai Baht (บาท 🇹🇭)" },
  { code: "USD", name: "US Dollar (ดอลลาร์สหรัฐ 🇺🇸)" },
  { code: "EUR", name: "Euro (ยูโร 🇪🇺)" },
  { code: "GBP", name: "British Pound (ปอนด์สหราชอาณาจักร 🇬🇧)" },
  { code: "JPY", name: "Japanese Yen (เยนญี่ปุ่น 🇯🇵)" },
  { code: "SGD", name: "Singapore Dollar (ดอลลาร์สิงคโปร์ 🇸🇬)" },
  { code: "HKD", name: "Hong Kong Dollar (ดอลลาร์ฮ่องกง 🇭🇰)" },
  { code: "AUD", name: "Australian Dollar (ดอลลาร์ออสเตรเลีย 🇦🇺)" },
  { code: "CAD", name: "Canadian Dollar (ดอลลาร์แคนาดา 🇨🇦)" },
  { code: "CHF", name: "Swiss Franc (ฟรังก์สวิส 🇨🇭)" },
  { code: "CNY", name: "Chinese Yuan (หยวนจีน 🇨🇳)" },
  { code: "KRW", name: "South Korean Won (วอนเกาหลีใต้ 🇰🇷)" },
  { code: "TWD", name: "New Taiwan Dollar (ดอลลาร์ไต้หวัน 🇹🇼)" },
  { code: "INR", name: "Indian Rupee (รูปีอินเดีย 🇮🇳)" },
  { code: "NZD", name: "New Zealand Dollar (ดอลลาร์นิวซีแลนด์ 🇳🇿)" },
  { code: "MYR", name: "Malaysian Ringgit (ริงกิตมาเลเซีย 🇲🇾)" },
  { code: "IDR", name: "Indonesian Rupiah (รูเปียห์อินโดนีเซีย 🇮🇩)" },
  { code: "PHP", name: "Philippine Peso (เปโซฟิลิปปินส์ 🇵🇭)" },
  { code: "VND", name: "Vietnamese Dong (ดองเวียดนาม 🇻🇳)" },
  { code: "DKK", name: "Danish Krone (โครนเดนมาร์ก 🇩🇰)" },
  { code: "NOK", name: "Norwegian Krone (โครนนอร์เวย์ 🇳🇴)" },
  { code: "SEK", name: "Swedish Krona (โครนสวีเดน 🇸🇪)" },
  { code: "AED", name: "UAE Dirham (ดีแรฮมสหรัฐอาหรับเอมิเรตส์ 🇦🇪)" },
  { code: "SAR", name: "Saudi Riyal (ริยัลซาอุดีอาระเบีย 🇸🇦)" },
  { code: "RUB", name: "Russian Ruble (รูเบิลรัสเซีย 🇷🇺)" },
  { code: "TRY", name: "Turkish Lira (ลีราตุรกี 🇹🇷)" },
  { code: "BRL", name: "Brazilian Real (เรียลบราซิล 🇧🇷)" },
  { code: "MXN", name: "Mexican Peso (เปโซเม็กซิโก 🇲🇽)" },
  { code: "ZAR", name: "South African Rand (แรนด์แอฟริกาใต้ 🇿🇦)" },
  { code: "AFN", name: "Afghan Afghani (อัฟกานิอัฟกานิสถาน 🇦🇫)" },
  { code: "ALL", name: "Albanian Lek (เลกแอลเบเนีย 🇦🇱)" },
  { code: "AMD", name: "Armenian Dram (ดรัมอาร์เมเนีย 🇦🇲)" },
  { code: "ANG", name: "Netherlands Antillean Guilder (กิลเดอร์เนเธอร์แลนด์แอนทิลลิส 🇨🇼)" },
  { code: "AOA", name: "Angolan Kwanza (ควานซาแองโกลา 🇦🇴)" },
  { code: "ARS", name: "Argentine Peso (เปโซอาร์เจนตินา 🇦🇷)" },
  { code: "AWG", name: "Aruban Florin (ฟลอรินอารูบา 🇦🇼)" },
  { code: "AZN", name: "Azerbaijani Manat (มานัตอาเซอร์ไบจาน 🇦🇿)" },
  { code: "BAM", name: "Bosnia convertible mark (มาร์กบอสเนีย 🇧🇦)" },
  { code: "BBD", name: "Barbadian Dollar (ดอลลาร์บาร์เบโดส 🇧🇧)" },
  { code: "BDT", name: "Bangladeshi Taka (ตากาบังกลาเทศ 🇧🇩)" },
  { code: "BGN", name: "Bulgarian Lev (เลฟบัลแกเรีย 🇧🇬)" },
  { code: "BHD", name: "Bahraini Dinar (ดีนาร์บาห์เรน 🇧🇭)" },
  { code: "BIF", name: "Burundian Franc (ฟรังก์บุรุนดี 🇧🇮)" },
  { code: "BMD", name: "Bermudian Dollar (ดอลลาร์เบอร์มิวดา 🇧🇲)" },
  { code: "BND", name: "Brunei Dollar (ดอลลาร์บรูไน 🇧🇳)" },
  { code: "BOB", name: "Bolivian Boliviano (โบลีเวียโน 🇧🇴)" },
  { code: "BSD", name: "Bahamian Dollar (ดอลลาร์บาฮามาส 🇧🇸)" },
  { code: "BTN", name: "Bhutanese Ngultrum (เอ็นกุลตรัม 🇧🇹)" },
  { code: "BWP", name: "Botswana Pula (ปูลาบอตสวานา 🇧🇼)" },
  { code: "BYN", name: "Belarusian Ruble (รูเบิลเบลารุส 🇧🇾)" },
  { code: "BZD", name: "Belize Dollar (ดอลลาร์เบลีซ 🇧🇿)" },
  { code: "CDF", name: "Congolese Franc (ฟรังก์คองโก 🇨🇩)" },
  { code: "CLP", name: "Chilean Peso (เปโซชิลี 🇨🇱)" },
  { code: "COP", name: "Colombian Peso (เปโซโคลอมเบีย 🇨🇴)" },
  { code: "CRC", name: "Costa Rican Colón (โกลอนคอสตาริกา 🇨🇷)" },
  { code: "CUP", name: "Cuban Peso (เปโซคิวบา 🇨🇺)" },
  { code: "CVE", name: "Cape Verdean Escudo (เอสคูโดเคปเวิร์ด 🇨🇻)" },
  { code: "CZK", name: "Czech Koruna (โครูนาเช็ก 🇨🇿)" },
  { code: "DJF", name: "Djiboutian Franc (ฟรังก์จิบูตี 🇩🇯)" },
  { code: "DOP", name: "Dominican Peso (เปโซโดมินิกัน 🇩🇴)" },
  { code: "DZD", name: "Algerian Dinar (ดีนาร์แอลจีเรีย 🇩🇿)" },
  { code: "EGP", name: "Egyptian Pound (ปอนด์อียิปต์ 🇪🇬)" },
  { code: "ERN", name: "Eritrean Nakfa (แนกฟา 🇪🇷)" },
  { code: "ETB", name: "Ethiopian Birr (เบอร์เอธิโอเปีย 🇪🇹)" },
  { code: "FJD", name: "Fijian Dollar (ดอลลาร์ฟิจิ 🇫🇯)" },
  { code: "FKP", name: "Falkland Islands Pound (ปอนด์หมู่เกาะฟอล์กแลนด์ 🇫🇰)" },
  { code: "FOK", name: "Faroese Króna (โครนาหมู่เกาะแฟโร 🇫🇴)" },
  { code: "GEL", name: "Georgian Lari (ลารีจอร์เจีย 🇬🇪)" },
  { code: "GGP", name: "Guernsey Pound (ปอนด์เกิร์นซีย์ 🇬🇬)" },
  { code: "GHS", name: "Ghanaian Cedi (เซดีกานา 🇬🇭)" },
  { code: "GIP", name: "Gibraltar Pound (ปอนด์ยิบรอลตาร์ 🇬🇮)" },
  { code: "GMD", name: "Gambian Dalasi (ดาลาซีกัมเบีย 🇬🇲)" },
  { code: "GNF", name: "Guinean Franc (ฟรังก์กินี 🇬🇳)" },
  { code: "GTQ", name: "Guatemalan Quetzal (เกตซัล 🇬🇹)" },
  { code: "GYD", name: "Guyanese Dollar (ดอลลาร์กายอานา 🇬🇾)" },
  { code: "HNL", name: "Honduran Lempira (เลมปีราฮอนดูรัส 🇭🇳)" },
  { code: "HRK", name: "Croatian Kuna (คูนาโครเอเชีย 🇭🇷)" },
  { code: "HTG", name: "Haitian Gourde (กูร์ดเฮติ 🇭🇹)" },
  { code: "HUF", name: "Hungarian Forint (ฟอรินต์ฮังการี 🇭🇺)" },
  { code: "ILS", name: "Israeli New Shekel (เชเกลอิสราเอล 🇮🇱)" },
  { code: "IMP", name: "Isle of Man Pound (ปอนด์เกาะแมน 🇮🇲)" },
  { code: "IQD", name: "Iraqi Dinar (ดีนาร์อิรัก 🇮🇶)" },
  { code: "IRR", name: "Iranian Rial (เรียลอิหร่าน 🇮🇷)" },
  { code: "ISK", name: "Icelandic Króna (โครนาไอซ์แลนด์ 🇮🇸)" },
  { code: "JEP", name: "Jersey Pound (ปอนด์เจอร์ซีย์ 🇯🇪)" },
  { code: "JMD", name: "Jamaican Dollar (ดอลลาร์จาเมกา 🇯🇲)" },
  { code: "JOD", name: "Jordanian Dinar (ดีนาร์จอร์แดน 🇯🇴)" },
  { code: "KES", name: "Kenyan Shilling (ชิลลิงเคนยา 🇰🇪)" },
  { code: "KGS", name: "Kyrgyzstani Som (ซอมคีร์กีซสถาน 🇰🇬)" },
  { code: "KHR", name: "Cambodian Riel (เรียลกัมพูชา 🇰🇭)" },
  { code: "KID", name: "Kiribati Dollar (ดอลลาร์คิริบาส 🇰🇮)" },
  { code: "KMF", name: "Comorian Franc (ฟรังก์คอโมโรส 🇰🇲)" },
  { code: "KPW", name: "North Korean Won (วอนเกาหลีเหนือ 🇰🇵)" },
  { code: "KWD", name: "Kuwaiti Dinar (ดีนาร์คูเวต 🇰🇼)" },
  { code: "KYD", name: "Cayman Islands Dollar (ดอลลาร์หมู่เกาะเคย์แมน 🇰🇾)" },
  { code: "KZT", name: "Kazakhstani Tenge (เทงเกคาซัคสถาน 🇰🇿)" },
  { code: "LAK", name: "Lao Kip (กีบลาว 🇱🇦)" },
  { code: "LBP", name: "Lebanese Pound (ปอนด์เลบานอน 🇱🇧)" },
  { code: "LKR", name: "Sri Lankan Rupee (รูปีศรีลังกา 🇱🇰)" },
  { code: "LRD", name: "Liberian Dollar (ดอลลาร์ไลบีเรีย 🇱🇷)" },
  { code: "LSL", name: "Lesotho Loti (โลตีเลโซโท 🇱🇸)" },
  { code: "LYD", name: "Libyan Dinar (ดีนาร์ลิเบีย 🇱🇾)" },
  { code: "MAD", name: "Moroccan Dirham (ดีแรฮมโมร็อกโก 🇲🇦)" },
  { code: "MDL", name: "Moldovan Leu (เลวมอลโดวา 🇲🇩)" },
  { code: "MGA", name: "Malagasy Ariary (อาเรียรี 🇲🇬)" },
  { code: "MKD", name: "Macedonian Denar (ดีนาร์มาซิโดเนีย 🇲🇰)" },
  { code: "MMK", name: "Myanmar Kyat (จ๊าดพม่า 🇲🇲)" },
  { code: "MNT", name: "Mongolian Tögrög (ทูกริกมองโกเลีย 🇲🇳)" },
  { code: "MOP", name: "Macanese Pataca (ปาตากามาเก๊า 🇲🇴)" },
  { code: "MRU", name: "Mauritanian Ouguiya (อูกียา 🇲🇷)" },
  { code: "MUR", name: "Mauritian Rupee (รูปีมอริเชียส 🇲🇺)" },
  { code: "MVR", name: "Maldivian Rufiyaa (รูฟิยาห์ 🇲🇻)" },
  { code: "MWK", name: "Malawian Kwacha (ควาชา 🇲🇼)" },
  { code: "MZN", name: "Mozambican Metical (เมทิคัล 🇲🇿)" },
  { code: "NAD", name: "Namibian Dollar (ดอลลาร์นามิเบีย 🇳🇦)" },
  { code: "NGN", name: "Nigerian Naira (ไนราไนจีเรีย 🇳🇬)" },
  { code: "NIO", name: "Nicaraguan Córdoba (กอร์โดบา 🇳🇮)" },
  { code: "NPR", name: "Nepalese Rupee (รูปีเนปาล 🇳🇵)" },
  { code: "OMR", name: "Omani Rial (เรียลโอมาน 🇴🇲)" },
  { code: "PAB", name: "Panamanian Balboa (บัลบัว 🇵🇦)" },
  { code: "PEN", name: "Peruvian Sol (ซอลเปรู 🇵🇪)" },
  { code: "PGK", name: "Papua New Guinean Kina (กีนา 🇵🇬)" },
  { code: "PKR", name: "Pakistani Rupee (รูปีปากีสถาน 🇵🇰)" },
  { code: "PLN", name: "Polish Złoty (ซวอตี 🇵🇱)" },
  { code: "PYG", name: "Paraguayan Guaraní (กวารานี 🇵🇾)" },
  { code: "QAR", name: "Qatari Riyal (ริยัลกาตาร์ 🇶🇦)" },
  { code: "RON", name: "Romanian Leu (เลวโรมาเนีย 🇷🇴)" },
  { code: "RSD", name: "Serbian Dinar (ดีนาร์เซอร์เบีย 🇷🇸)" },
  { code: "RWF", name: "Rwandan Franc (ฟรังก์รวันดา 🇷🇼)" },
  { code: "SBD", name: "Solomon Islands Dollar (ดอลลาร์หมู่เกาะโซโลมอน 🇸🇧)" },
  { code: "SCR", name: "Seychellois Rupee (รูปีเซเชลส์ 🇸🇨)" },
  { code: "SDG", name: "Sudanese Pound (ปอนด์ซูดาน 🇸🇩)" },
  { code: "SHP", name: "Saint Helena Pound (ปอนด์เซนต์เฮเลนา 🇸🇭)" },
  { code: "SLE", name: "Sierra Leonean Leone (ลีโอน 🇸🇱)" },
  { code: "SOS", name: "Somali Shilling (ชิลลิงโซมาเลีย 🇸🇴)" },
  { code: "SRD", name: "Surinamese Dollar (ดอลลาร์สุรินทร์ 🇸🇷)" },
  { code: "SSP", name: "South Sudanese Pound (ปอนด์ซูดานใต้ 🇸🇸)" },
  { code: "STN", name: "São Tomé Dobra (โดบรา 🇸🇹)" },
  { code: "SVC", name: "Salvadoran Colón (โกลอน 🇸🇻)" },
  { code: "SYP", name: "Syrian Pound (ปอนด์ซีเรีย 🇸🇾)" },
  { code: "SZL", name: "Swazi Lilangeni (ลีลันเกนี 🇸🇿)" },
  { code: "TJS", name: "Tajikistani Somoni (โซโมนิ 🇹🇯)" },
  { code: "TMT", name: "Turkmenistan Manat (มานัต 🇹🇲)" },
  { code: "TND", name: "Tunisian Dinar (ดีนาร์ตูนิเซีย 🇹🇳)" },
  { code: "TOP", name: "Tongan Paʻanga (พาแองกา 🇹🇴)" },
  { code: "TTD", name: "Trinidad Dollar (ดอลลาร์ตรินิแดด 🇹🇹)" },
  { code: "TVD", name: "Tuvaluan Dollar (ดอลลาร์ตูวาลู 🇹🇻)" },
  { code: "TZS", name: "Tanzanian Shilling (ชิลลิงแทนซาเนีย 🇹🇿)" },
  { code: "UAH", name: "Ukrainian Hryvnia (ฮริฟเนียยูเครน 🇺🇦)" },
  { code: "UGX", name: "Ugandan Shilling (ชิลลิงยูแกนดา 🇺🇬)" },
  { code: "UYU", name: "Uruguayan Peso (เปโซอุรุกวัย 🇺🇾)" },
  { code: "UZS", name: "Uzbekistani Som (ซอมอุซเบกิสถาน 🇺🇿)" },
  { code: "VES", name: "Venezuelan Bolívar (โบลิวาร์ 🇻🇪)" },
  { code: "VUV", name: "Vanuatu Vatu (วาตู 🇻🇺)" },
  { code: "WST", name: "Samoan Tālā (ทาลา 🇼🇸)" },
  { code: "XAF", name: "Central African CFA Franc (ฟรังก์แอฟริกากลาง 🇨🇫)" },
  { code: "XCD", name: "East Caribbean Dollar (ดอลลาร์แคริบเบียนตะวันออก 🇩🇲)" },
  { code: "XOF", name: "West African CFA Franc (ฟรังก์แอฟริกาตะวันตก 🇸🇳)" },
  { code: "XPF", name: "CFP Franc (ฟรังก์ซีเอฟพี 🇵🇫)" },
  { code: "YER", name: "Yemeni Rial (เรียลเยเมน 🇾🇪)" },
  { code: "ZMW", name: "Zambian Kwacha (ควาชาแซมเบีย 🇿🇲)" },
  { code: "ZWL", name: "Zimbabwean Dollar (ดอลลาร์ซิมบับเว 🇿🇼)" }
];

const getCurrencyTicker = (symbol) => {
  if (symbol === "USD") return "USD";
  if (["EUR", "GBP", "AUD", "NZD"].includes(symbol)) {
    return `${symbol}USD=X`;
  }
  return `${symbol}=X`;
};

/* ─── Formatters ─── */
const fmtDate  = (s) => s ? new Date(s + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—";
const fmtUSD   = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 }).format(n);
const fmtQty   = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(n);

export default function AssetModal({ isOpen, onClose, onSave, editingAsset, exchangeRate }) {
  const [type,        setType]        = useState("stock");
  const [symbol,      setSymbol]      = useState("");
  const [name,        setName]        = useState("");
  const [qty,         setQty]         = useState("");
  const [price,       setPrice]       = useState("");
  const [date,        setDate]        = useState(() => new Date().toISOString().split("T")[0]);

  /* Search state */
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);
  const [confirmed,   setConfirmed]   = useState(false); // true when symbol picked

  /* History panel */
  const [showHistory, setShowHistory] = useState(false);

  /* Search state for fiat currencies */
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);

  /* Currency dynamic exchange rates */
  const [currencyRate, setCurrencyRate] = useState(1.0);
  const [currencyRateLoading, setCurrencyRateLoading] = useState(false);

  const debounceRef  = useRef(null);
  const qtyInputRef  = useRef(null);

  const filteredCurrencies = useMemo(() => {
    const q = currencyQuery.trim().toLowerCase();
    const pinned = CURRENCIES.filter(c => c.code === "THB" || c.code === "USD");
    const others = CURRENCIES.filter(c => c.code !== "THB" && c.code !== "USD");

    if (!q) {
      return [...pinned, ...others];
    }

    const filteredPinned = pinned.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.name.toLowerCase().includes(q)
    );
    const filteredOthers = others.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.name.toLowerCase().includes(q)
    );

    return [...filteredPinned, ...filteredOthers];
  }, [currencyQuery]);

  /* ─── Reset on open ─── */
  useEffect(() => {
    if (!isOpen) return;

    if (editingAsset) {
      const cat = editingAsset.category || editingAsset.type || "stock";
      setType(cat);
      setSymbol(editingAsset.symbol || "");
      setName(editingAsset.name || "");
      setQuery(editingAsset.symbol || "");
      setCurrencyQuery(cat === "fiat" ? (editingAsset.symbol || "") : "");
      setQty("");
      setPrice("");
      setDate(new Date().toISOString().split("T")[0]);
      setConfirmed(true);
      setShowDrop(false);
      setShowCurrencyDrop(false);
      setSuggestions([]);
    } else {
      setType("stock");
      setSymbol("");
      setName("");
      setQuery("");
      setCurrencyQuery("");
      setQty("");
      setPrice("");
      setDate(new Date().toISOString().split("T")[0]);
      setConfirmed(false);
      setShowDrop(false);
      setShowCurrencyDrop(false);
      setSuggestions([]);
    }
    setShowHistory(false);
  }, [isOpen, editingAsset]);

  /* ─── Dynamic Currency Rate Fetching ─── */
  useEffect(() => {
    if (type !== "fiat" || !symbol) return;
    if (symbol === "USD") {
      setCurrencyRate(1.0);
      return;
    }
    if (symbol === "THB") {
      setCurrencyRate(1.0 / (exchangeRate || 35.0));
      return;
    }

    setCurrencyRateLoading(true);
    const ticker = getCurrencyTicker(symbol);
    fetch(`/api/prices?symbols=${encodeURIComponent(ticker)}`)
      .then(res => res.json())
      .then(data => {
        const q = data.quotes?.[ticker];
        if (q && q.price > 0) {
          if (["EUR", "GBP", "AUD", "NZD"].includes(symbol)) {
            setCurrencyRate(q.price);
          } else {
            setCurrencyRate(1.0 / q.price);
          }
        }
      })
      .catch(err => console.error("Error fetching currency rate:", err))
      .finally(() => setCurrencyRateLoading(false));
  }, [symbol, type, exchangeRate]);

  /* ─── Debounced search (only when NOT confirmed) ─── */
  useEffect(() => {
    if (confirmed || editingAsset) return;

    clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 1) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prices?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 7));
          setShowDrop(data.length > 0);
        }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, confirmed, editingAsset]);

  if (!isOpen) return null;

  /* ─── Select suggestion — use onMouseDown so it fires BEFORE onBlur ─── */
  const pickSuggestion = (item) => {
    setSymbol(item.symbol);
    setName(item.name);
    setQuery(item.symbol);
    setShowDrop(false);
    setConfirmed(true);
    setSuggestions([]);
    // Auto-focus qty after picking
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  /* ─── Clear picked symbol to re-search ─── */
  const clearSymbol = () => {
    setSymbol("");
    setName("");
    setQuery("");
    setConfirmed(false);
    setShowDrop(false);
    setSuggestions([]);
  };

  /* ─── Category change ─── */
  const pickCategory = (c) => {
    if (editingAsset) return;
    setType(c);
    clearSymbol();
    if (c === "gold") {
      setSymbol("GC=F");
      setName("Spot Gold (ทองคำตลาดโลก)");
      setQuery("GC=F");
      setConfirmed(true);
    } else if (c === "fiat") {
      setSymbol("THB");
      setName("Thai Baht (บาท 🇹🇭)");
      setQuery("THB");
      setCurrencyQuery("THB");
      setConfirmed(true);
    }
  };

  /* ─── Quick preset ─── */
  const applyPreset = (s, n) => {
    setSymbol(s);
    setName(n);
    setQuery(s);
    setConfirmed(true);
    setShowDrop(false);
    setSuggestions([]);
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  /* ─── Submit ─── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const pQty   = parseFloat(qty);
    if (!symbol.trim())            { alert("เลือกสินทรัพย์ก่อนนะครับ"); return; }
    if (isNaN(pQty) || pQty <= 0) { alert("ใส่จำนวนให้ถูกต้อง (มากกว่า 0)"); return; }

    let pPrice = 1.0;
    if (type === "fiat") {
      pPrice = currencyRate;
    } else {
      pPrice = parseFloat(price);
      if (isNaN(pPrice) || pPrice < 0) { alert("ใส่ราคาทุนให้ถูกต้อง"); return; }
    }

    onSave({
      symbol: symbol.trim().toUpperCase(),
      name:   name.trim() || symbol.trim().toUpperCase(),
      type,
      qty:      pQty,
      avgPrice: pPrice,
      date,
    });
  };

  /* ─── Purchase history from lots ─── */
  const lots = editingAsset?.lots || [];

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {editingAsset
              ? `➕ ซื้อเพิ่ม ${editingAsset.symbol}`
              : "เพิ่มสินทรัพย์ใหม่"}
          </h2>
          <button onClick={onClose} className="btn-close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* ── Category selector (only for new asset) ── */}
            {!editingAsset && (
              <div className="form-group">
                <label className="form-label">ประเภทสินทรัพย์</label>
                <div className="category-selector">
                  {[
                    { key: "stock",  emoji: "🇺🇸", label: "หุ้น" },
                    { key: "gold",   emoji: "🥇", label: "ทองคำ" },
                    { key: "crypto", emoji: "🪙", label: "คริปโต" },
                    { key: "fiat",   emoji: "💵", label: "เงินสด" },
                  ].map(c => (
                    <button key={c.key} type="button"
                      className={`category-btn${type === c.key ? " active" : ""} ripple-btn`}
                      onClick={() => pickCategory(c.key)}>
                      <span className="category-emoji">{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Symbol search OR confirmed chip ── */}
            {type === "fiat" ? (
              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">สกุลเงินสด</label>
                <div style={{ position: "relative" }}>
                  <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 44 }}
                    placeholder="พิมพ์รหัสหรือชื่อสกุลเงิน เช่น THB, USD, JPY, EUR..."
                    value={currencyQuery}
                    onChange={(e) => {
                      setCurrencyQuery(e.target.value);
                      setShowCurrencyDrop(true);
                    }}
                    onFocus={() => setShowCurrencyDrop(true)}
                    onBlur={() => {
                      // Delay so onMouseDown on suggestion fires first
                      setTimeout(() => setShowCurrencyDrop(false), 200);
                    }}
                    disabled={editingAsset}
                  />
                </div>
                
                {/* Selected currency indicator */}
                {symbol && (
                  <div style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--primary)",
                    background: "var(--primary-light)",
                    padding: "6px 12px",
                    borderRadius: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    💵 เลือกแล้ว: <strong>{symbol}</strong> - {name}
                  </div>
                )}

                {/* Dropdown list */}
                {showCurrencyDrop && (
                  <div className="suggestions-dropdown" style={{ maxHeight: 220, overflowY: "auto", zIndex: 1000 }}>
                    {filteredCurrencies.length === 0 ? (
                      <div style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                        ไม่พบสกุลเงินที่ค้นหา
                      </div>
                    ) : (
                      filteredCurrencies.map(c => (
                        <div
                          key={c.code}
                          className="suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSymbol(c.code);
                            setName(c.name);
                            setCurrencyQuery(c.code);
                            setShowCurrencyDrop(false);
                            setConfirmed(true);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            background: symbol === c.code ? "var(--primary-light)" : "transparent",
                            fontWeight: symbol === c.code ? 700 : 500
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <span style={{ color: symbol === c.code ? "var(--primary)" : "var(--text-main)" }}><strong>{c.code}</strong></span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.name}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">
                  {!editingAsset ? (
                    type === "stock"  ? "ค้นหาหุ้น (ชื่อย่อหรือชื่อบริษัท)" :
                    type === "crypto" ? "ค้นหาเหรียญ (เช่น Bitcoin, SOL)" :
                    "ทองคำตลาดโลก"
                  ) : "สินทรัพย์"}
                </label>

                {/* Confirmed chip */}
                {confirmed || editingAsset ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--primary-light)", border: "1.5px solid var(--primary)",
                    borderRadius: 16, padding: "10px 14px"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 15 }}>{symbol}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{name}</div>
                    </div>
                    {!editingAsset && (
                      <button type="button" className="btn-close" onClick={clearSymbol}
                        style={{ background: "rgba(82,54,255,0.1)", color: "var(--primary)" }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  /* Search input + dropdown */
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "relative" }}>
                      <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: 44 }}
                        placeholder={
                          type === "stock"  ? "พิมพ์ เช่น Apple, NVDA, PTT.BK…" :
                          type === "crypto" ? "พิมพ์ เช่น Bitcoin, ETH, SOL…" :
                          "GC=F"
                        }
                        value={query}
                        autoFocus
                        onChange={e => { setQuery(e.target.value); setConfirmed(false); }}
                        onFocus={() => { if (suggestions.length > 0) setShowDrop(true); }}
                        onBlur={() => {
                          // Delay so onMouseDown on suggestion fires first
                          setTimeout(() => setShowDrop(false), 180);
                        }}
                      />
                      {searching && (
                        <div className="spinner sm" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
                      )}
                    </div>

                    {/* Dropdown */}
                    {showDrop && suggestions.length > 0 && (
                      <div className="suggestions-dropdown">
                        {suggestions.map(item => (
                          <div key={item.symbol} className="suggestion-item"
                            onMouseDown={(e) => { e.preventDefault(); pickSuggestion(item); }}>
                            <div className="suggestion-left">
                              <span className="suggestion-symbol">{item.symbol}</span>
                              <span className="suggestion-name">{item.name}</span>
                            </div>
                            <div className="suggestion-right">
                              <span className="suggestion-exchange">{item.exchange}</span>
                              <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>{item.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick presets */}
                {!editingAsset && !confirmed && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {type === "stock" && (
                      <>
                        {[["AAPL","Apple Inc."],["NVDA","NVIDIA Corp."],["TSLA","Tesla Inc."],["PTT.BK","PTT ปตท."]].map(([s,n]) => (
                          <button key={s} type="button" className="ripple-btn"
                            style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "#F1F5F9", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit" }}
                            onMouseDown={(e) => { e.preventDefault(); applyPreset(s, n); }}>
                            {s}
                          </button>
                        ))}
                      </>
                    )}
                    {type === "crypto" && (
                      <>
                        {[["BTC-USD","Bitcoin"],["ETH-USD","Ethereum"],["SOL-USD","Solana"],["BNB-USD","BNB"]].map(([s,n]) => (
                          <button key={s} type="button" className="ripple-btn"
                            style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "#FFF7ED", border: "1px solid #FED7AA", cursor: "pointer", fontFamily: "inherit" }}
                            onMouseDown={(e) => { e.preventDefault(); applyPreset(s, n); }}>
                            {s.split("-")[0]}
                          </button>
                        ))}
                      </>
                    )}
                    {type === "gold" && (
                      <button type="button" className="ripple-btn"
                        style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "var(--gold-light)", border: "1px solid #FCD34D", cursor: "pointer", fontFamily: "inherit" }}
                        onMouseDown={(e) => { e.preventDefault(); applyPreset("GC=F", "Spot Gold"); }}>
                        GC=F Spot Gold 🥇
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Qty & Price inputs ── */}
            {type === "fiat" ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">จำนวนเงินสด</label>
                  {currencyRateLoading && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="spinner sm" style={{ width: 12, height: 12, borderWidth: "1.5px" }} /> ดึงอัตราแลกเปลี่ยนปัจจุบัน...
                    </span>
                  )}
                </div>
                <input
                  ref={qtyInputRef}
                  type="number"
                  step="any"
                  min="0.01"
                  className="form-input"
                  placeholder={`กรอกจำนวนเงินสด (${symbol || "สกุลเงิน"})`}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">จำนวน (หน่วย)</label>
                  <input ref={qtyInputRef} type="number" step="any" min="0.000001"
                    className="form-input" placeholder="เช่น 10, 1.5"
                    value={qty} onChange={e => setQty(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    ราคาต่อหน่วย
                    <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 4 }}>
                      {symbol.includes(".BK") ? "(THB)" : "(USD)"}
                    </span>
                  </label>
                  <input type="number" step="any" min="0"
                    className="form-input" placeholder={symbol.includes(".BK") ? "บาท/หุ้น" : "USD/unit"}
                    value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
              </div>
            )}

            {/* ── Purchase Date ── */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">วันที่ซื้อ <span style={{ fontSize: 10, color: "var(--text-faint)" }}>(เก็บเป็น Log ประวัติ)</span></label>
              <input type="date" className="form-input"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* ── Purchase History (ถ้ามี lots แล้ว) ── */}
            {editingAsset && lots.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <button type="button"
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "8px 0",
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 700, color: "var(--text-muted)", fontFamily: "inherit", width: "100%"
                  }}
                  onClick={() => setShowHistory(p => !p)}>
                  <History size={14} />
                  ประวัติการซื้อ ({lots.length} รายการ)
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showHistory && (
                  <div style={{
                    border: "1px solid var(--border)", borderRadius: 16,
                    overflow: "hidden", marginTop: 6, animation: "fadeIn 0.2s ease-out"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>วันที่</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>จำนวน</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>ราคาทุน</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>มูลค่า</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...lots].reverse().map((lot, i) => (
                          <tr key={lot.id || i} style={{ borderTop: "1px solid var(--border)" }}>
                            <td style={{ padding: "9px 12px", color: "var(--text-muted)" }}>{fmtDate(lot.date)}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>{fmtQty(lot.qty)}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>{fmtUSD(lot.price)}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                              {fmtUSD(lot.qty * lot.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "1.5px solid var(--border)", background: "var(--primary-light)" }}>
                          <td colSpan={2} style={{ padding: "8px 12px", fontWeight: 700, color: "var(--primary)" }}>รวม</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)", fontSize: 11 }}>
                            avg {fmtUSD(editingAsset.avgCost)}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>
                            {fmtUSD(lots.reduce((s, l) => s + l.qty * l.price, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tip box */}
            {!editingAsset && (
              <div style={{
                marginTop: 14, background: "#FFFBEB", border: "1px solid #FEF3C7",
                borderRadius: 14, padding: "10px 14px", fontSize: 11, color: "#92400E",
                lineHeight: 1.6, display: "flex", gap: 8
              }}>
                <span>💡</span>
                <span>
                  {type === "stock"  && "หุ้นไทยต่อท้ายด้วย .BK เช่น PTT.BK · ราคาทุนใส่เป็นบาทได้เลย"}
                  {type === "crypto" && "ต่อท้ายด้วย -USD เช่น BTC-USD · ราคาทุนใส่เป็น USD"}
                  {type === "gold"   && "GC=F คือ Spot Gold ราคาต่อออนซ์ (USD)"}
                  {type === "fiat"   && "กรอกจำนวนเงินสดที่คุณถือครองและเลือกสกุลเงินสดได้เลย"}
                </span>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary ripple-btn" onClick={onClose}
              style={{ height: 48, flex: "0 0 100px" }}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary ripple-btn"
              style={{ height: 48, flex: 1 }}
              disabled={!symbol}>
              <Save size={16} />
              {editingAsset ? `บันทึก (ซื้อเพิ่ม ${qty ? fmtQty(parseFloat(qty) || 0) : "?"} หน่วย)` : "เพิ่มเข้าพอร์ต"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
