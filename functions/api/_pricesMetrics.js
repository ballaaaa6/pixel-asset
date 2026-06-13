export function enrichMetricsFromYF(metrics, yfSummary, returnsObj, chartStats) {
  metrics = metrics || {};
  metrics.metric = metrics.metric || {};
  
  if (yfSummary) {
    const keyStats = yfSummary.defaultKeyStatistics || {};
    const finData = yfSummary.financialData || {};
    const priceData = yfSummary.price || {};
    const sumDetail = yfSummary.summaryDetail || {};
    
    metrics.metric.marketCapitalization = 
      priceData.marketCap?.raw || 
      sumDetail.marketCap?.raw || 
      keyStats.marketCap?.raw || 
      metrics.metric.marketCapitalization || 
      null;
    metrics.metric.enterpriseValue = keyStats.enterpriseValue?.raw || null;
    metrics.metric.peTrailing = keyStats.trailingPE?.raw || sumDetail.trailingPE?.raw || metrics.metric.peTrailing || null;
    metrics.metric.pbCurrent = keyStats.priceToBook?.raw || metrics.metric.pbCurrent || null;
    metrics.metric.epsTTM = keyStats.trailingEps?.raw || metrics.metric.epsTTM || null;
    
    // Extended valuation metrics
    metrics.metric.psTrailing = sumDetail.priceToSalesTrailing12Months?.raw || keyStats.priceToSales?.raw || metrics.metric.psTrailing || null;
    metrics.metric.pegRatio = keyStats.pegRatio?.raw || metrics.metric.pegRatio || null;
    metrics.metric.forwardPE = keyStats.forwardPE?.raw || sumDetail.forwardPE?.raw || metrics.metric.forwardPE || null;
    metrics.metric.evToEbitda = keyStats.enterpriseToEbitda?.raw || metrics.metric.evToEbitda || null;
    metrics.metric.evToRevenue = keyStats.enterpriseToRevenue?.raw || metrics.metric.evToRevenue || null;
    
    // Efficiency & solvency ratios
    metrics.metric.returnOnEquity = finData.returnOnEquity?.raw != null ? finData.returnOnEquity.raw * 100 : metrics.metric.returnOnEquity || null;
    metrics.metric.returnOnAssets = finData.returnOnAssets?.raw != null ? finData.returnOnAssets.raw * 100 : metrics.metric.returnOnAssets || null;
    metrics.metric.debtToEquity = finData.debtToEquity?.raw || metrics.metric.debtToEquity || null;
    metrics.metric.currentRatio = finData.currentRatio?.raw || metrics.metric.currentRatio || null;
    metrics.metric.quickRatio = finData.quickRatio?.raw || metrics.metric.quickRatio || null;
    metrics.metric.operatingCashflow = finData.operatingCashflow?.raw || metrics.metric.operatingCashflow || null;
    metrics.metric.freeCashflow = finData.freeCashflow?.raw || metrics.metric.freeCashflow || null;

    // Yield extensions to avoid blanks
    metrics.metric.dividendYieldTrailing = sumDetail.trailingAnnualDividendYield?.raw != null ? sumDetail.trailingAnnualDividendYield.raw * 100 : metrics.metric.dividendYieldTrailing || null;
    metrics.metric.dividendYieldForward = sumDetail.dividendYield?.raw != null ? sumDetail.dividendYield.raw * 100 : metrics.metric.dividendYieldForward || null;

    // Convert margins to percent (Yahoo is ratio e.g. 0.405 -> 40.5%)
    if (metrics.metric.grossMarginTTM == null && finData.grossMargins?.raw != null) {
      metrics.metric.grossMarginTTM = finData.grossMargins.raw * 100;
    }
    if (metrics.metric.netProfitMarginTTM == null && finData.profitMargins?.raw != null) {
      metrics.metric.netProfitMarginTTM = finData.profitMargins.raw * 100;
    }
    
    metrics.metric["52WeekHigh"] = keyStats.fiftyTwoWeekHigh?.raw || metrics.metric["52WeekHigh"] || null;
    metrics.metric["52WeekLow"] = keyStats.fiftyTwoWeekLow?.raw || metrics.metric["52WeekLow"] || null;
    metrics.metric.dividendPerShareTTM = keyStats.dividendRate?.raw || sumDetail.dividendRate?.raw || metrics.metric.dividendPerShareTTM || null;
    metrics.metric.dividendYield5YAvg = sumDetail.fiveYearAvgDividendYield?.raw || metrics.metric.dividendYield5YAvg || null;
    metrics.metric["50DayAverage"] = sumDetail.fiftyDayAverage?.raw || metrics.metric["50DayAverage"] || null;
    metrics.metric["200DayAverage"] = sumDetail.twoHundredDayAverage?.raw || metrics.metric["200DayAverage"] || null;
    metrics.metric.currentPrice = finData.currentPrice?.raw || priceData.regularMarketPrice?.raw || metrics.metric.currentPrice || null;

    // YoY returns and growth rates to avoid blanks
    metrics.metric.revenueGrowthYoY = finData.revenueGrowth?.raw != null ? finData.revenueGrowth.raw * 100 : null;
    metrics.metric.earningsGrowthYoY = finData.earningsGrowth?.raw != null ? finData.earningsGrowth.raw * 100 : null;
    metrics.metric.priceReturn1Y = keyStats.fiftyTwoWeekChange?.raw != null ? keyStats.fiftyTwoWeekChange.raw * 100 : null;
  }

  // Populate basic metrics from chart if missing
  metrics.metric.currentPrice = metrics.metric.currentPrice || chartStats.chartCurrentPrice || null;
  metrics.metric["52WeekHigh"] = metrics.metric["52WeekHigh"] || chartStats.chart52WHigh || null;
  metrics.metric["52WeekLow"] = metrics.metric["52WeekLow"] || chartStats.chart52WLow || null;
  metrics.metric["50DayAverage"] = metrics.metric["50DayAverage"] || chartStats.chart50DayAvg || null;
  metrics.metric["200DayAverage"] = metrics.metric["200DayAverage"] || chartStats.chart200DayAvg || null;

  // Align Finnhub metric fields with the new keys to guarantee presence
  metrics.metric.peTrailing = metrics.metric.peTrailing || metrics.metric.peBasicExclExtraTTM || metrics.metric.peExclExtraTTM || metrics.metric.peNormalized || null;
  metrics.metric.pbCurrent = metrics.metric.pbCurrent || metrics.metric.pbQuarterly || metrics.metric.pbAnnual || null;
  metrics.metric.psTrailing = metrics.metric.psTrailing || metrics.metric.psTTM || null;
  metrics.metric.revenueGrowthYoY = metrics.metric.revenueGrowthYoY || metrics.metric.revenueGrowthQuarterlyYoy || null;
  metrics.metric.earningsGrowthYoY = metrics.metric.earningsGrowthYoY || metrics.metric.epsGrowthQuarterlyYoy || null;

  metrics.metric.priceReturn1Y = returnsObj.return1Y !== null ? returnsObj.return1Y : (metrics.metric.priceReturn1Y || metrics.metric["52WeekPriceReturnDaily"] || null);
  metrics.metric.priceReturn1W = returnsObj.return1W !== null ? returnsObj.return1W : (metrics.metric["5DayPriceReturnDaily"] || null);
  metrics.metric.priceReturn1M = returnsObj.return1M !== null ? returnsObj.return1M : null;
  metrics.metric.priceReturn3M = returnsObj.return3M !== null ? returnsObj.return3M : (metrics.metric["13WeekPriceReturnDaily"] || null);

  return metrics;
}

export function calculateReturnsFromHistory(historyData) {
  let return1W = null;
  let return1M = null;
  let return3M = null;
  let return1Y = null;
  let chart52WHigh = null;
  let chart52WLow = null;
  let chart50DayAvg = null;
  let chart200DayAvg = null;
  let chartCurrentPrice = null;

  const chartResult = historyData?.chart?.result?.[0];
  const indicators = chartResult?.indicators?.quote?.[0];
  const closes = indicators?.close || [];
  const validCloses = closes.filter(c => c != null && c > 0);

  if (validCloses.length > 0) {
    chartCurrentPrice = validCloses[validCloses.length - 1];
    chart52WHigh = Math.max(...validCloses);
    chart52WLow = Math.min(...validCloses);

    if (validCloses.length >= 50) {
      const slice50 = validCloses.slice(-50);
      chart50DayAvg = slice50.reduce((a, b) => a + b, 0) / 50;
    }
    if (validCloses.length >= 200) {
      const slice200 = validCloses.slice(-200);
      chart200DayAvg = slice200.reduce((a, b) => a + b, 0) / 200;
    }

    if (validCloses.length > 5) {
      const price1W = validCloses[validCloses.length - 6];
      return1W = ((chartCurrentPrice - price1W) / price1W) * 100;
    }
    if (validCloses.length > 21) {
      const price1M = validCloses[validCloses.length - 22];
      return1M = ((chartCurrentPrice - price1M) / price1M) * 100;
    }
    if (validCloses.length > 63) {
      const price3M = validCloses[validCloses.length - 64];
      return3M = ((chartCurrentPrice - price3M) / price3M) * 100;
    }
    const price1Y = validCloses[0];
    return1Y = ((chartCurrentPrice - price1Y) / price1Y) * 100;
  }

  return {
    returns: { return1W, return1M, return3M, return1Y },
    stats: { chartCurrentPrice, chart52WHigh, chart52WLow, chart50DayAvg, chart200DayAvg }
  };
}

export function mapFinancialsAndEarnings(earnings, yfSummary, yfIncomeHistory = [], yfCFHistory = [], yfTimeSeries = null) {
  const parseDate = (dStr) => {
    try { return new Date(dStr).getTime(); } catch { return 0; }
  };

  const findBestMatch = (targetTime, history) => {
    if (!history || history.length === 0 || !targetTime) return null;
    let best = null;
    let minDiff = Infinity;
    const maxDiff = 50 * 24 * 60 * 60 * 1000; // 50 days threshold
    history.forEach(item => {
      const itemTime = (item.endDate?.raw) ? (item.endDate.raw * 1000) : 0;
      const diff = Math.abs(targetTime - itemTime);
      if (diff < maxDiff && diff < minDiff) {
        minDiff = diff;
        best = item;
      }
    });
    return best;
  };

  const gpSeries = (yfTimeSeries?.find(item => item.meta?.type?.includes("quarterlyGrossProfit"))?.quarterlyGrossProfit || []).filter(x => x !== null);
  const capexSeries = (yfTimeSeries?.find(item => item.meta?.type?.includes("quarterlyCapitalExpenditure"))?.quarterlyCapitalExpenditure || []).filter(x => x !== null);
  const revSeries = (yfTimeSeries?.find(item => item.meta?.type?.includes("quarterlyTotalRevenue"))?.quarterlyTotalRevenue || []).filter(x => x !== null);
  const netSeries = (yfTimeSeries?.find(item => item.meta?.type?.includes("quarterlyNetIncome"))?.quarterlyNetIncome || []).filter(x => x !== null);
  const epsBasicSeries = (yfTimeSeries?.find(item => item.meta?.type?.includes("quarterlyBasicEPS"))?.quarterlyBasicEPS || []).filter(x => x !== null);
  const epsDilutedSeries = (yfTimeSeries?.find(item => item.meta?.type?.includes("quarterlyDilutedEPS"))?.quarterlyDilutedEPS || []).filter(x => x !== null);

  const findTSMatch = (targetTime, series) => {
    if (!series || series.length === 0 || !targetTime) return null;
    let best = null;
    let minDiff = Infinity;
    const maxDiff = 15 * 24 * 60 * 60 * 1000; // 15 days is enough for period-end matching
    series.forEach(item => {
      if (!item || !item.asOfDate) return;
      const itemTime = parseDate(item.asOfDate);
      const diff = Math.abs(targetTime - itemTime);
      if (diff < maxDiff && diff < minDiff) {
        minDiff = diff;
        best = item;
      }
    });
    return best;
  };

  let baseList = [];

  if (earnings && earnings.length > 0) {
    baseList = earnings.map(e => ({
      quarter: e.quarter,
      year: e.year,
      period: e.period,
      actual: e.actual,
      estimate: e.estimate,
      surprise: e.surprise,
      surprisePercent: e.surprisePercent
    }));
  } else {
    const yfEarnings = yfSummary?.earnings?.earningsChart?.quarterly || [];
    baseList = yfEarnings.map(e => {
      const match = e.date?.match(/(\d)Q(\d{4})/);
      const quarter = match ? parseInt(match[1]) : 0;
      const year = match ? parseInt(match[2]) : 0;
      const actual = e.actual?.raw ?? e.actual ?? null;
      const estimate = e.estimate?.raw ?? e.estimate ?? null;
      const surprise = (actual != null && estimate != null) ? (actual - estimate) : null;
      const surprisePercent = (surprise != null && estimate !== 0 && estimate != null) ? (surprise / Math.abs(estimate)) * 100 : 0;
      
      const qEndMonths = { 1: "03-31", 2: "06-30", 3: "09-30", 4: "12-31" };
      const periodStr = `${year}-${qEndMonths[quarter] || "12-31"}`;
      
      return {
        quarter,
        year,
        period: periodStr,
        actual,
        estimate,
        surprise,
        surprisePercent
      };
    }).reverse();
  }

  const mapped = baseList.map(e => {
    const eTime = parseDate(e.period);
    const bestInc = findBestMatch(eTime, yfIncomeHistory);
    const bestCF = findBestMatch(eTime, yfCFHistory);

    const gpMatch = findTSMatch(eTime, gpSeries);
    const capexMatch = findTSMatch(eTime, capexSeries);
    const revMatch = findTSMatch(eTime, revSeries);
    const netMatch = findTSMatch(eTime, netSeries);
    const epsBasicMatch = findTSMatch(eTime, epsBasicSeries);
    const epsDilutedMatch = findTSMatch(eTime, epsDilutedSeries);

    let revenue = revMatch?.reportedValue?.raw ?? bestInc?.totalRevenue?.raw ?? null;
    let netIncome = netMatch?.reportedValue?.raw ?? bestInc?.netIncome?.raw ?? null;
    
    let grossProfit = gpMatch?.reportedValue?.raw ?? null;
    if (grossProfit == null) {
      grossProfit = bestInc?.grossProfit?.raw !== undefined ? bestInc.grossProfit.raw : null;
    }

    let capEx = capexMatch?.reportedValue?.raw ?? null;
    if (capEx == null) {
      capEx = bestCF?.capitalExpenditures?.raw !== undefined ? bestCF.capitalExpenditures.raw : null;
    }

    if (revenue == null || netIncome == null) {
      const quarterlyCharts = yfSummary?.earnings?.financialsChart?.quarterly || [];
      const qStr = `${e.quarter}Q${e.year}`;
      const chartMatch = quarterlyCharts.find(c => 
        c.fiscalQuarter === qStr || 
        c.date === qStr || 
        (c.date && c.date.toLowerCase() === `${e.quarter}q${e.year}`.toLowerCase())
      );
      if (chartMatch) {
        if (revenue == null) revenue = chartMatch.revenue?.raw || null;
        if (netIncome == null) netIncome = chartMatch.earnings?.raw || null;
      }
    }

    if (grossProfit == null && revenue != null && yfSummary?.financialData?.grossMargins?.raw != null) {
      grossProfit = revenue * yfSummary.financialData.grossMargins.raw;
    }

    let actual = e.actual;
    const epsVal = epsBasicMatch?.reportedValue?.raw ?? epsDilutedMatch?.reportedValue?.raw ?? null;
    if (epsVal !== null) {
      actual = epsVal;
    }

    return {
      ...e,
      actual,
      revenue,
      netIncome,
      grossProfit,
      capEx
    };
  });

  // Extract extra quarters from timeseries data and append them
  const allTSDates = new Set([
    ...gpSeries.map(x => x.asOfDate),
    ...capexSeries.map(x => x.asOfDate),
    ...revSeries.map(x => x.asOfDate),
    ...netSeries.map(x => x.asOfDate),
    ...epsBasicSeries.map(x => x.asOfDate),
    ...epsDilutedSeries.map(x => x.asOfDate)
  ].filter(Boolean));

  allTSDates.forEach(dateStr => {
    const dTime = parseDate(dateStr);
    const exists = mapped.some(e => Math.abs(parseDate(e.period) - dTime) < 15 * 24 * 60 * 60 * 1000);
    if (!exists) {
      const d = new Date(dateStr);
      const month = d.getUTCMonth() + 1;
      const year = d.getUTCFullYear();
      let quarter = 4;
      if (month <= 3) quarter = 1;
      else if (month <= 6) quarter = 2;
      else if (month <= 9) quarter = 3;

      const gpMatch = findTSMatch(dTime, gpSeries);
      const capexMatch = findTSMatch(dTime, capexSeries);
      const revMatch = findTSMatch(dTime, revSeries);
      const netMatch = findTSMatch(dTime, netSeries);
      const epsBasicMatch = findTSMatch(dTime, epsBasicSeries);
      const epsDilutedMatch = findTSMatch(dTime, epsDilutedSeries);

      const revenue = revMatch?.reportedValue?.raw ?? null;
      const netIncome = netMatch?.reportedValue?.raw ?? null;
      const grossProfit = gpMatch?.reportedValue?.raw ?? null;
      const capEx = capexMatch?.reportedValue?.raw ?? null;
      const actual = epsBasicMatch?.reportedValue?.raw ?? epsDilutedMatch?.reportedValue?.raw ?? null;

      if (revenue !== null || netIncome !== null) {
        mapped.push({
          quarter,
          year,
          period: dateStr,
          actual,
          estimate: null,
          surprise: null,
          surprisePercent: null,
          revenue,
          netIncome,
          grossProfit,
          capEx
        });
      }
    }
  });

  mapped.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });

  return mapped;
}
