import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getRealizedPnL, getCurrencyTicker, getDisplaySymbol, getHistoricalExchangeRate, getRealizedPnLInTHB as rawGetRealizedPnLInTHB } from "../utils/assetHelpers";
import { calculatePortfolioHistoryTimeline } from "../utils/portfolioHistoryHelpers";
import { generateMockPrices, generateMockSparklines, generateMockHistoricalRates } from "../utils/mockDataHelpers";
import { CATEGORY_LABELS } from "../utils/constants";
import { processTransactions } from "../utils/portfolioTransactionHelpers";
import { calculatePortfolioValuation } from "../utils/portfolioValuationHelpers";

export function usePortfolioData({ user, showToast, onSessionExpired }) {
  const [assets, setAssets] = useState([]);
  const [prices, setPrices] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(35.0);
  const [historicalRates, setHistoricalRates] = useState({});
  const [chartCategory, setChartCategory] = useState("all");

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
    return getHistoricalExchangeRate(dateStr, historicalRates, exchangeRate);
  }, [historicalRates, exchangeRate]);

  const getRealizedPnLInTHB = useCallback((lots, isThai) => {
    return rawGetRealizedPnLInTHB(lots, isThai, historicalRates, exchangeRate);
  }, [historicalRates, exchangeRate]);

  const savePortfolio = async (updatedAssets) => {
    setAssets(updatedAssets);
    localStorage.setItem(`local_portfolio_${user.username}`, JSON.stringify(updatedAssets));
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updatedAssets),
      });
      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.warn("Server sync failed, saved locally:", err.message);
      showToast("บันทึกข้อมูลในอุปกรณ์เครื่องนี้แล้ว (เซิร์ฟเวอร์ออฟไลน์)", "warning");
    }
  };

  const fetchPrices = async (portfolioAssets, isManual = false) => {
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
        const url = `/api/prices?symbols=${encodeURIComponent(symbols)}${isManual ? "&nocache=true" : ""}`;
        res = await fetch(url);
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
      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }
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
    const filteredAssets = chartCategory === "all"
      ? assets
      : assets.filter(a => (a.category || a.type || "stock") === chartCategory);

    const filteredSparklines = {};
    filteredAssets.forEach(a => {
      const ticker = (a.type === "fiat" || a.category === "fiat") ? (a.symbol === "USD" ? null : getCurrencyTicker(a.symbol)) : a.symbol;
      if (ticker && sparklines[ticker]) {
        filteredSparklines[ticker] = sparklines[ticker];
      }
    });

    const history = calculatePortfolioHistoryTimeline(filteredSparklines, filteredAssets, prices, exchangeRate, chartRange);
    setPortfolioHistory(history);
  }, [sparklines, assets, prices, exchangeRate, chartRange, chartCategory]);

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
    const { updatedAssets, skippedTxs } = processTransactions({
      formData,
      assets,
      exchangeRate,
      historicalRates
    });

    if (!isBatch && skippedTxs.length > 0) {
      showToast(skippedTxs[0].reason, "error");
      return false;
    }

    if (skippedTxs.length > 0 && isBatch) {
      alert(`ทำรายการสำเร็จบางส่วน โดยมี ${skippedTxs.length} รายการที่ถูกข้าม:\n\n` + skippedTxs.map(s => `- ${s.tx.symbol}: ${s.reason}`).join("\n"));
    }

    await savePortfolio(updatedAssets);
    await fetchPrices(updatedAssets);
    fetchSparklines(updatedAssets, chartRange);
    if (!isBatch) showToast("บันทึกธุรกรรมเรียบร้อยแล้ว", "success");
    return true;
  };

  const valuation = useMemo(() => {
    return calculatePortfolioValuation({
      assets,
      prices,
      exchangeRate,
      sortConfig,
      historicalRates
    });
  }, [assets, prices, exchangeRate, sortConfig, historicalRates]);

  return {
    assets,
    setAssets,
    prices,
    sparklines,
    portfolioHistory,
    chartCategory,
    setChartCategory,
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
