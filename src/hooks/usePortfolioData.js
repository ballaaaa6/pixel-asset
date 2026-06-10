import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getRealizedPnL, getCurrencyPriceUSD, getCurrencyTicker, getDisplaySymbol } from "../utils/assetHelpers";
import { calculatePortfolioHistoryTimeline } from "../utils/portfolioHistoryHelpers";
import { generateMockPrices, generateMockSparklines, generateMockHistoricalRates } from "../utils/mockDataHelpers";
import { CATEGORY_LABELS } from "../utils/constants";

export function usePortfolioData({ user, showToast }) {
  const [assets, setAssets] = useState([]);
  const [prices, setPrices] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(35.0);
  const [historicalRates, setHistoricalRates] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sparklineLoading, setSparklineLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartRange, setChartRange] = useState("1D");
  const [sortConfig, setSortConfig] = useState({ key: "value", dir: "desc" });
  const [priceFlash, setPriceFlash] = useState({});

  const prevPricesRef = useRef({});
  const assetsRef = useRef([]);
  assetsRef.current = assets;

  const getHistoricalRate = useCallback((dateStr) => {
    if (!dateStr) return exchangeRate;
    const targetDate = dateStr.split("T")[0];
    if (historicalRates[targetDate]) return historicalRates[targetDate];
    const dates = Object.keys(historicalRates).sort();
    if (dates.length === 0) return exchangeRate;
    let bestRate = exchangeRate;
    for (const d of dates) {
      if (d <= targetDate) bestRate = historicalRates[d];
      else break;
    }
    return bestRate;
  }, [historicalRates, exchangeRate]);

  const getRealizedPnLInTHB = useCallback((lots, isThai) => {
    if (!lots || !lots.length) return 0;
    const sortedLots = [...lots].sort((a, b) => new Date(a.date) - new Date(b.date));
    let realizedTHB = 0, currentQty = 0, currentAvgCostUSD = 0;
    for (const lot of sortedLots) {
      const lotQty = lot.qty;
      let lotPriceUSD = lot.price || 0;
      const txRate = getHistoricalRate(lot.date);
      if (isThai && txRate) lotPriceUSD = lotPriceUSD / txRate;
      if (lotQty > 0) {
        const newQty = currentQty + lotQty;
        currentAvgCostUSD = newQty > 0 ? ((currentQty * currentAvgCostUSD) + (lotQty * lotPriceUSD)) / newQty : 0;
        currentQty = newQty;
      } else if (lotQty < 0) {
        const sellQty = Math.abs(lotQty);
        realizedTHB += (lotPriceUSD - currentAvgCostUSD) * sellQty * txRate;
        currentQty = Math.max(0, currentQty - sellQty);
      }
    }
    return realizedTHB;
  }, [getHistoricalRate]);

  const savePortfolio = async (updatedAssets) => {
    setAssets(updatedAssets);
    localStorage.setItem(`local_portfolio_${user.username}`, JSON.stringify(updatedAssets));
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updatedAssets),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.warn("Server sync failed, saved locally:", err.message);
      showToast("บันทึกข้อมูลในอุปกรณ์เครื่องนี้แล้ว (เซิร์ฟเวอร์ออฟไลน์)", "warning");
    }
  };

  const fetchPrices = async (portfolioAssets) => {
    setRefreshing(true);
    try {
      const symbols = portfolioAssets
        .map(a => (a.type === "fiat" || a.category === "fiat") ? (a.symbol === "USD" ? null : getCurrencyTicker(a.symbol)) : a.symbol)
        .filter(Boolean).join(",");

      if (!symbols) {
        setPrices({});
        return;
      }

      let res = null;
      try {
        res = await fetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
      } catch (err) {
        console.warn("fetchPrices API offline:", err.message);
      }

      if (res && res.ok) {
        const data = await res.json();
        const newPrices = data.quotes || {};
        const flash = {};
        Object.keys(newPrices).forEach(sym => {
          const prev = prevPricesRef.current[sym]?.price;
          const curr = newPrices[sym]?.price;
          if (prev != null && curr != null && curr !== prev) flash[sym] = curr > prev ? "up" : "down";
        });
        if (Object.keys(flash).length > 0) {
          setPriceFlash(flash);
          setTimeout(() => setPriceFlash({}), 1600);
        }
        prevPricesRef.current = newPrices;
        setPrices(newPrices);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      } else {
        const fallback = generateMockPrices(symbols, portfolioAssets, prevPricesRef.current, exchangeRate);
        setPriceFlash({});
        prevPricesRef.current = fallback.prices;
        setPrices(fallback.prices);
        setExchangeRate(fallback.exchangeRate);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSparklines = async (portfolioAssets, range) => {
    if (!portfolioAssets.length) return;
    setSparklineLoading(true);
    try {
      const syms = [...new Set(portfolioAssets.map(a => (a.type === "fiat" || a.category === "fiat") ? (a.symbol === "USD" ? null : getCurrencyTicker(a.symbol)) : a.symbol).filter(Boolean))];
      let earliestDate = null;
      portfolioAssets.forEach(asset => {
        (asset.lots || []).forEach(lot => {
          if (lot && lot.date && lot.date !== "1970-01-01" && (!earliestDate || lot.date < earliestDate)) earliestDate = lot.date;
        });
      });

      let optimalRange = range;
      if (earliestDate) {
        const ageInDays = (Date.now() - new Date(earliestDate + "T00:00:00.000Z").getTime()) / 86400000;
        const rangeDurationDays = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "6M": 180, "YTD": 365, "1Y": 365, "5Y": 1825, "MAX": Infinity };
        const rangesOrder = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];
        let matchedRange = "1D";
        for (const r of rangesOrder) {
          matchedRange = r;
          if (rangeDurationDays[r] >= ageInDays) break;
        }
        if (rangesOrder.indexOf(matchedRange) < rangesOrder.indexOf(range)) optimalRange = matchedRange;
      }

      let res = null;
      try {
        res = await fetch(`/api/prices?sparkline=${encodeURIComponent(syms.join(","))}&tf=${optimalRange}`);
      } catch (err) {
        console.warn("fetchSparklines offline:", err.message);
      }

      if (res && res.ok) {
        setSparklines(await res.json());
      } else {
        setSparklines(generateMockSparklines(syms, portfolioAssets, optimalRange));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSparklineLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch("/api/portfolio", { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
        localStorage.setItem(`local_portfolio_${user.username}`, JSON.stringify(data));
        await fetchPrices(data);
        if (data.length > 0) fetchSparklines(data, chartRange);
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch (err) {
      console.warn("Server load failed, using local:", err.message);
      const localData = JSON.parse(localStorage.getItem(`local_portfolio_${user.username}`) || "[]");
      setAssets(localData);
      await fetchPrices(localData);
      if (localData.length > 0) fetchSparklines(localData, chartRange);
      showToast("ใช้ข้อมูลพอร์ตที่บันทึกในเครื่องชั่วคราว", "info");
    } finally {
      setLoading(false);
    }
  };

  // Compute portfolio history whenever data/sparklines update
  useEffect(() => {
    const history = calculatePortfolioHistoryTimeline(sparklines, assets, prices, exchangeRate, chartRange);
    setPortfolioHistory(history);
  }, [sparklines, assets, prices, exchangeRate, chartRange]);

  // Handle auto refresh
  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    const fetchHistoricalRates = async () => {
      let res = null;
      try {
        res = await fetch("/api/prices?history=THB=X&tf=MAX");
      } catch (err) {
        console.warn("fetchHistoricalRates API offline:", err.message);
      }
      if (res && res.ok) {
        const data = await res.json();
        const rates = {};
        if (data.candles) {
          data.candles.forEach(c => {
            if (c.date && c.close) rates[c.date.split("T")[0]] = c.close;
          });
        }
        setHistoricalRates(rates);
      } else {
        setHistoricalRates(generateMockHistoricalRates());
      }
    };
    fetchHistoricalRates();
  }, [user.username]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => fetchPrices(assetsRef.current), 30000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  const handleClearAsset = async (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const displaySym = asset.broker ? `${getDisplaySymbol(asset.symbol)} (${asset.broker})` : getDisplaySymbol(asset.symbol);
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะล้างผลตอบแทนสะสมของ ${displaySym}?`)) return;

    const isThai = asset.symbol.toUpperCase().endsWith(".BK");
    const rawRealized = getRealizedPnL(asset.lots || [], isThai, exchangeRate);
    const rawRealizedTHB = getRealizedPnLInTHB(asset.lots || [], isThai);

    const updated = assets.map(a => a.id === assetId ? { ...a, clearedRealizedUSD: rawRealized, clearedRealizedTHB: rawRealizedTHB } : a);
    await savePortfolio(updated);
    await fetchPrices(updated);
    fetchSparklines(updated, chartRange);
    showToast(`ล้างผลตอบแทนสะสมของ ${displaySym} เรียบร้อย`, "success");
  };

  const handleDeleteAsset = async (param, fromModal = false) => {
    const assetId = typeof param === "string" ? param : param?.id;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const displaySym = asset.broker ? `${getDisplaySymbol(asset.symbol)} (${asset.broker})` : getDisplaySymbol(asset.symbol);
    if (fromModal && asset.qty > 0) {
      alert(`❌ ไม่สามารถลบ ${displaySym} เนื่องจากยังมีถือหุ้นอยู่`);
      return;
    }
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ ${displaySym}?`)) return;
    const updated = assets.filter(a => a.id !== assetId);
    try {
      await savePortfolio(updated);
      await fetchPrices(updated);
      fetchSparklines(updated, chartRange);
      showToast(`ลบสินทรัพย์ ${displaySym} ออกเรียบร้อย`, "success");
    } catch (err) {
      showToast("ลบไม่สำเร็จ: " + err.message, "error");
    }
  };

  const handleRangeChange = useCallback((r) => {
    setChartRange(r);
    if (assetsRef.current.length > 0) fetchSparklines(assetsRef.current, r);
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  const handleSaveAsset = async (formData) => {
    const isBatch = Array.isArray(formData);
    const transactions = isBatch ? formData : [formData];
    const sortedTx = [...transactions].sort((a, b) => {
      const isABuy = a.transactionType === "BUY";
      const isBBuy = b.transactionType === "BUY";
      if (isABuy !== isBBuy) return isABuy ? -1 : 1;
      return new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`) - new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`);
    });

    const skippedTxs = [];
    const getTodayLocalDate = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    let updatedAssets = [...assets];

    for (const tx of sortedTx) {
      const sym = (tx.symbol || "").trim().toUpperCase();
      const name = (tx.name || sym).trim();
      const newQty = parseFloat(tx.qty);
      const newPrice = parseFloat(tx.avgPrice ?? tx.price ?? 0);
      const category = tx.type ?? tx.category ?? "stock";
      const broker = (tx.broker || "").trim();

      let buyDate = tx.date ? tx.date.trim() : getTodayLocalDate();
      let buyTime = tx.time ? tx.time.trim() : "00:00";

      if (!sym) {
        if (!isBatch) showToast("เลือกสินทรัพย์ก่อนนะครับ", "error");
        else skippedTxs.push({ tx, reason: "ไม่พบสัญลักษณ์สินทรัพย์" });
        continue;
      }
      if (isNaN(newQty) || newQty <= 0) {
        if (!isBatch) showToast("ใส่จำนวนให้ถูกต้อง", "error");
        else skippedTxs.push({ tx, reason: "จำนวนหุ้นไม่ถูกต้อง" });
        continue;
      }
      if (isNaN(newPrice) || newPrice < 0) {
        if (!isBatch) showToast("ใส่ราคาให้ถูกต้อง", "error");
        else skippedTxs.push({ tx, reason: "ราคาหุ้นไม่ถูกต้อง" });
        continue;
      }

      const isThai = sym.endsWith(".BK");
      const transactionType = tx.transactionType || "BUY";

      let existing = updatedAssets.find(a => a.symbol.toUpperCase() === sym && (a.broker || "").toUpperCase() === broker.toUpperCase());

      if (!existing) {
        if (transactionType === "SELL") {
          if (!isBatch) showToast(`ไม่สามารถขาย ${sym} ได้เนื่องจากยังไม่มีในพอร์ต`, "error");
          else skippedTxs.push({ tx, reason: `ไม่สามารถขาย ${sym} ได้เนื่องจากยังไม่มีในพอร์ต` });
          continue;
        }
        existing = {
          id: Math.random().toString(36).substr(2, 9),
          symbol: sym,
          name: name || sym,
          qty: 0,
          avgCost: 0,
          avgPrice: 0,
          category,
          broker,
          lots: []
        };
        updatedAssets.push(existing);
      }

      const newLot = {
        id: Math.random().toString(36).substr(2, 9),
        date: buyDate,
        time: buyTime,
        qty: transactionType === "BUY" ? newQty : -newQty,
        price: newPrice,
        type: transactionType
      };

      const currentLots = existing.lots || [];
      const updatedLots = [...currentLots, newLot].sort((a, b) => new Date(a.date + "T" + (a.time || "00:00")) - new Date(b.date + "T" + (b.time || "00:00")));

      let runningQty = 0;
      let runningAvgCostUSD = 0;
      let valid = true;

      for (const lot of updatedLots) {
        const lotQty = lot.qty;
        let lotPriceUSD = lot.price || 0;
        const txRate = getHistoricalRate(lot.date);
        if (isThai && txRate) lotPriceUSD = lotPriceUSD / txRate;

        if (lotQty > 0) {
          const newTotalQty = runningQty + lotQty;
          runningAvgCostUSD = newTotalQty > 0 ? ((runningQty * runningAvgCostUSD) + (lotQty * lotPriceUSD)) / newTotalQty : 0;
          runningQty = newTotalQty;
        } else {
          const sellQty = Math.abs(lotQty);
          if (runningQty < sellQty) {
            valid = false;
            break;
          }
          runningQty = Math.max(0, runningQty - sellQty);
        }
      }

      if (!valid) {
        const msg = `ไม่สามารถประมวลผลธุรกรรม ${transactionType} ของ ${sym} ณ วันที่ ${buyDate} ${buyTime} ได้ เนื่องจากจะทำให้จำนวนถือครองติดลบ`;
        if (!isBatch) showToast(msg, "error");
        else skippedTxs.push({ tx, reason: msg });
        continue;
      }

      existing.lots = updatedLots;
      existing.qty = runningQty;
      existing.avgCost = runningAvgCostUSD;
      existing.avgPrice = isThai ? runningAvgCostUSD * getHistoricalRate(buyDate) : runningAvgCostUSD;
      existing.category = category;
      existing.name = name || existing.name;

      if (existing.qty < 0.00001 && (!existing.lots || existing.lots.length === 0)) {
        updatedAssets = updatedAssets.filter(a => a.id !== existing.id);
      }
    }

    if (skippedTxs.length > 0 && isBatch) {
      alert(`ทำรายการสำเร็จบางส่วน โดยมี ${skippedTxs.length} รายการที่ถูกข้าม:\n\n` + skippedTxs.map(s => `- ${s.tx.symbol}: ${s.reason}`).join("\n"));
    }

    await savePortfolio(updatedAssets);
    await fetchPrices(updatedAssets);
    fetchSparklines(updatedAssets, chartRange);
    if (!isBatch) showToast("บันทึกธุรกรรมเรียบร้อยแล้ว", "success");
  };

  const computeAsset = useCallback((asset) => {
    const isThai = asset.symbol.endsWith(".BK");
    const isCashAsset = asset.type === "fiat" || asset.category === "fiat";

    if (isCashAsset) {
      const price = 1.0;
      const priceUSD = getCurrencyPriceUSD(asset.symbol, prices, exchangeRate);
      const valueUSD = priceUSD * asset.qty;
      const valueTHB = valueUSD * exchangeRate;
      const avgCost = asset.avgCost ?? asset.avgPrice ?? priceUSD;
      const costUSD = avgCost * asset.qty;
      const gainUSD = valueUSD - costUSD;
      const gainPct = costUSD > 0 ? (gainUSD / costUSD) * 100 : 0;

      let todayChg = 0, todayPct = 0;
      if (asset.symbol !== "USD") {
        const ticker = getCurrencyTicker(asset.symbol);
        const pData = prices[ticker];
        if (pData) {
          const prevPriceVal = pData.previousClose || pData.price;
          if (prevPriceVal > 0) {
            const prevPriceUSD = ["EUR", "GBP", "AUD", "NZD"].includes(asset.symbol) ? prevPriceVal : 1.0 / prevPriceVal;
            todayChg = (priceUSD - prevPriceUSD) * asset.qty;
            todayPct = prevPriceUSD > 0 ? ((priceUSD - prevPriceUSD) / prevPriceUSD) * 100 : 0;
          }
        }
      }

      return {
        price, priceUSD, valueUSD, valueTHB, costUSD, gainUSD, gainPct, todayChg, todayPct,
        extPrice: null, extChangePct: null, extType: null
      };
    }

    const pData = prices[asset.symbol];
    const regPrice = pData?.price ?? 0;
    const isPre = pData?.marketState === "PRE" || pData?.marketState === "PREPRE";
    const isPost = pData?.marketState === "POST" || pData?.marketState === "POSTPOST";

    let extPrice = null, extChangePct = null, extType = null;
    if (isPre && pData.prePrice != null && pData.prePrice > 0) {
      extPrice = pData.prePrice;
      extChangePct = regPrice > 0 ? ((pData.prePrice - regPrice) / regPrice) * 100 : 0;
      extType = "Pre";
    } else if (isPost && pData.postPrice != null && pData.postPrice > 0) {
      extPrice = pData.postPrice;
      extChangePct = regPrice > 0 ? ((pData.postPrice - regPrice) / regPrice) * 100 : 0;
      extType = "After";
    }

    const price = extPrice ?? regPrice;
    const priceUSD = isThai ? price / exchangeRate : price;
    const valueUSD = priceUSD * asset.qty;
    const valueTHB = valueUSD * exchangeRate;
    const avgCost = asset.avgCost ?? asset.avgPrice ?? 0;
    const costUSD = avgCost * asset.qty;
    const gainUSD = valueUSD - costUSD;
    const gainPct = costUSD > 0 ? (gainUSD / costUSD) * 100 : 0;

    const activePrice = price;
    const prevClose = pData?.previousClose ?? activePrice;
    const todayChg = ((activePrice - prevClose) * asset.qty);
    const todayPct = (prevClose > 0 ? ((activePrice - prevClose) / prevClose) * 100 : 0);

    const regPriceUSD = isThai ? regPrice / exchangeRate : regPrice;
    const regValueUSD = regPriceUSD * asset.qty;
    const regValueTHB = regValueUSD * exchangeRate;
    const regGainUSD = regValueUSD - costUSD;
    const regGainPct = costUSD > 0 ? (regGainUSD / costUSD) * 100 : 0;
    const regTodayChg = pData?.change ? (isThai ? pData.change / exchangeRate : pData.change) * asset.qty : 0;
    const regTodayPct = pData?.changePercent ?? 0;

    let extPriceUSD = null, extValueUSD = null, extValueTHB = null, extGainUSD = null, extGainPct = null, extTodayPct = null;
    if (extPrice != null) {
      extPriceUSD = isThai ? extPrice / exchangeRate : extPrice;
      extValueUSD = extPriceUSD * asset.qty;
      extValueTHB = extValueUSD * exchangeRate;
      extGainUSD = extValueUSD - costUSD;
      extGainPct = costUSD > 0 ? (extGainUSD / costUSD) * 100 : 0;
      extTodayPct = extChangePct ?? 0;
    }

    return {
      price, priceUSD, valueUSD, valueTHB, costUSD, gainUSD, gainPct, todayChg, todayPct,
      extPrice, extChangePct, extType,
      regPrice, regPriceUSD, regValueUSD, regValueTHB, regGainUSD, regGainPct, regTodayChg, regTodayPct,
      extPriceUSD, extValueUSD, extValueTHB, extGainUSD, extGainPct, extTodayPct
    };
  }, [prices, exchangeRate]);

  const valuation = useMemo(() => {
    if (!assets.length) {
      return {
        totalUSD: 0, totalCostUSD: 0, todayChangeUSD: 0, totalRealizedUSD: 0, totalRealizedTHB: 0,
        bestAsset: null, sortedAssets: [], donutSegments: [], initialCapitalUSD: 0,
        totalUnrealizedUSD: 0, totalUnrealizedTHB: 0, totalGainTHB: 0, totalGainUSD: 0, totalGainPct: 0, todayChangePct: 0
      };
    }

    let totVal = 0, totCost = 0, totToday = 0, totRealized = 0, totRealizedTHB = 0;
    let bestSym = null, bestPct = -Infinity;

    const computed = assets.map(a => {
      const c = computeAsset(a);
      totVal += c.valueUSD;
      totCost += c.costUSD;
      totToday += c.todayChg;

      const isThai = a.symbol.toUpperCase().endsWith(".BK");
      const rawRealized = getRealizedPnL(a.lots || [], isThai, exchangeRate);
      const realized = rawRealized - (a.clearedRealizedUSD || 0);
      totRealized += realized;

      const rawRealizedTHB = getRealizedPnLInTHB(a.lots || [], isThai);
      const realizedTHB = rawRealizedTHB - (a.clearedRealizedTHB || 0);
      totRealizedTHB += realizedTHB;

      const assetWithPnL = {
        ...a, ...c,
        realizedPnL: realized,
        realizedPnLTHB: realizedTHB,
        unrealizedPnL: a.qty > 0 ? (c.valueUSD - c.costUSD) : 0,
        totalPnL: realized + (a.qty > 0 ? (c.valueUSD - c.costUSD) : 0)
      };

      if (c.gainPct > bestPct && a.qty > 0 && (a.avgCost > 0 || a.avgPrice > 0)) {
        bestPct = c.gainPct;
        bestSym = a;
      }
      return assetWithPnL;
    });

    const activeAssets = computed.filter(a => a.qty > 0.00001);
    const sorted = [...activeAssets].sort((a, b) => {
      if (!sortConfig.key) return b.valueUSD - a.valueUSD;
      const dir = sortConfig.dir === "asc" ? 1 : -1;
      switch (sortConfig.key) {
        case "value" : return dir * (a.valueUSD - b.valueUSD);
        case "gain" : return dir * (a.gainPct - b.gainPct);
        case "today" : return dir * (a.todayPct - b.todayPct);
        case "symbol" : return dir * a.symbol.localeCompare(b.symbol);
        default : return 0;
      }
    });

    const catMap = {};
    activeAssets.forEach(a => {
      const cat = a.category || "stock";
      catMap[cat] = (catMap[cat] || 0) + a.valueUSD;
    });
    const donut = Object.entries(catMap)
      .map(([cat, val]) => ({ id: cat, label: CATEGORY_LABELS[cat] || cat, pct: totVal > 0 ? (val / totVal) * 100 : 0, value: val }))
      .filter(s => s.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    let sumBuys = 0, hasBuys = false;
    assets.forEach(a => {
      if (a.type !== "fiat" && a.category !== "fiat") {
        const isThai = a.symbol.toUpperCase().endsWith(".BK");
        (a.lots || []).forEach(l => {
          if (l.qty > 0) {
            sumBuys += l.qty * (isThai ? l.price / exchangeRate : l.price);
            hasBuys = true;
          }
        });
      }
    });
    const initialCap = (hasBuys && sumBuys > 0) ? sumBuys : totCost;
    const totalUnrealizedUSD = totVal - totCost;
    const totalUnrealizedTHB = totalUnrealizedUSD * exchangeRate;
    const totalGainTHB = totalUnrealizedTHB + totRealizedTHB;
    const totalGainUSD = totalUnrealizedUSD + totRealized;
    const totalGainPct = initialCap > 0 ? (totalGainUSD / initialCap) * 100 : 0;
    const todayChangePct = totCost > 0 ? (totToday / (totVal - totToday)) * 100 : 0;

    return {
      totalUSD: totVal,
      totalCostUSD: totCost,
      todayChangeUSD: totToday,
      totalRealizedUSD: totRealized,
      totalRealizedTHB: totRealizedTHB,
      bestAsset: bestSym ? { symbol: bestSym.symbol, pct: bestPct } : null,
      sortedAssets: sorted,
      donutSegments: donut,
      initialCapitalUSD: initialCap,
      totalUnrealizedUSD,
      totalUnrealizedTHB,
      totalGainTHB,
      totalGainUSD,
      totalGainPct,
      todayChangePct
    };
  }, [assets, prices, exchangeRate, sortConfig, computeAsset, getRealizedPnLInTHB]);

  return {
    assets,
    setAssets,
    prices,
    sparklines,
    portfolioHistory,
    exchangeRate,
    historicalRates,
    loading,
    refreshing,
    sparklineLoading,
    autoRefresh,
    setAutoRefresh,
    chartRange,
    sortConfig,
    priceFlash,
    getHistoricalRate,
    getRealizedPnLInTHB,
    handleClearAsset,
    handleDeleteAsset,
    handleRangeChange,
    handleSort,
    handleSaveAsset,
    fetchPrices,
    fetchSparklines,
    fetchPortfolio,
    savePortfolio,
    ...valuation
  };
}
