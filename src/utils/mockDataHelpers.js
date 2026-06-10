/**
 * mockDataHelpers.js
 * Fallback mock data generators for when the serverless API is offline or rate-limited.
 */

import { getCurrencyTicker } from "./assetHelpers";

export function generateMockPrices(symbols, portfolioAssets, prevPrices, exchangeRate) {
  const newPrices = { ...prevPrices };
  const symList = symbols ? symbols.split(",") : [];

  symList.forEach(s => {
    const cleanSym = s.toUpperCase();
    let basePrice = 100.0;

    const matchAsset = portfolioAssets.find(a => a.symbol.toUpperCase() === cleanSym || getCurrencyTicker(a.symbol).toUpperCase() === cleanSym);
    if (matchAsset) {
      basePrice = matchAsset.avgCost || matchAsset.avgPrice || 100.0;
    }

    const changePercent = (Math.random() - 0.5) * 0.02;
    const lastPrice = prevPrices[cleanSym]?.price || basePrice;
    const currPrice = lastPrice * (1 + changePercent);

    newPrices[cleanSym] = {
      price: currPrice,
      change: changePercent * 100,
      changesPercentage: changePercent * 100,
      marketState: "REGULAR",
      displayName: cleanSym
    };
  });

  const mockExchangeRate = (exchangeRate || 35.0) + (Math.random() - 0.5) * 0.2;
  newPrices["THB=X"] = {
    price: mockExchangeRate,
    change: 0.0,
    changesPercentage: 0.0,
    marketState: "REGULAR",
    displayName: "THB"
  };
  newPrices["USD"] = {
    price: 1.0,
    change: 0,
    changesPercentage: 0,
    marketState: "REGULAR"
  };

  return { prices: newPrices, exchangeRate: mockExchangeRate };
}

export function generateMockSparklines(syms, portfolioAssets, optimalRange) {
  const mockSparklines = {};
  const days = {
    "1D": 24, "1W": 7, "1M": 30, "3M": 90, "6M": 180, "YTD": 150, "1Y": 252, "5Y": 252 * 5, "MAX": 252 * 5
  }[optimalRange] || 30;

  const nowTime = Date.now();
  const dateInterval = {
    "1D": 3600 * 1000, "1W": 24 * 3600 * 1000, "1M": 24 * 3600 * 1000, "3M": 24 * 3600 * 1000,
    "6M": 24 * 3600 * 1000, "YTD": 24 * 3600 * 1000, "1Y": 24 * 3600 * 1000, "5Y": 7 * 24 * 3600 * 1000, "MAX": 7 * 24 * 3600 * 1000
  }[optimalRange] || 24 * 3600 * 1000;

  syms.forEach(sym => {
    const cleanSym = sym.toUpperCase();
    const dates = [];
    const closes = [];

    let basePrice = 100.0;
    const matchAsset = portfolioAssets.find(a => a.symbol.toUpperCase() === cleanSym || getCurrencyTicker(a.symbol).toUpperCase() === cleanSym);
    if (matchAsset) {
      basePrice = matchAsset.avgCost || matchAsset.avgPrice || 100.0;
    }

    let currentVal = basePrice * 0.9;

    for (let i = days; i >= 0; i--) {
      const timeAt = nowTime - i * dateInterval;
      const dateStr = new Date(timeAt).toISOString();
      const drift = (Math.random() - 0.48) * 0.03;
      currentVal = currentVal * (1 + drift);
      if (currentVal < 0.01) currentVal = 0.01;

      dates.push(dateStr);
      closes.push(currentVal);
    }

    mockSparklines[cleanSym] = { dates, closes };
  });

  const thbCloses = [];
  const thbDates = [];
  let currThb = 35.0;
  for (let i = days; i >= 0; i--) {
    const timeAt = nowTime - i * dateInterval;
    const dateStr = new Date(timeAt).toISOString();
    const drift = (Math.random() - 0.5) * 0.005;
    currThb = currThb * (1 + drift);
    thbDates.push(dateStr);
    thbCloses.push(currThb);
  }
  mockSparklines["THB=X"] = { dates: thbDates, closes: thbCloses };

  return mockSparklines;
}

export function generateMockHistoricalRates() {
  const rates = {};
  const now = Date.now();
  let currentThb = 35.0;
  for (let i = 0; i < 3650; i++) {
    const timeAt = now - i * 24 * 3600 * 1000;
    const dateKey = new Date(timeAt).toISOString().split("T")[0];
    const drift = (Math.random() - 0.5) * 0.002;
    currentThb = currentThb * (1 + drift);
    if (currentThb < 28) currentThb = 28;
    if (currentThb > 40) currentThb = 40;
    rates[dateKey] = currentThb;
  }
  return rates;
}
