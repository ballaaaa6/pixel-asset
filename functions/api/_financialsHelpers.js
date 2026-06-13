export function mapFinancialsAndEarnings(earnings, yfSummary, yfIncomeHistory = [], yfCFHistory = [], yfTimeSeries = null, metrics = null) {
  const parseDate = (dStr) => {
    try { return new Date(dStr).getTime(); } catch { return 0; }
  };

  const findBestMatch = (targetTime, history) => {
    if (!history || history.length === 0 || !targetTime) return null;
    let best = null;
    let minDiff = Infinity;
    const maxDiff = 50 * 24 * 60 * 60 * 1000;
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
    const maxDiff = 50 * 24 * 60 * 60 * 1000;
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

  // Finnhub series extractions
  const fhEps = metrics?.series?.quarterly?.eps || [];
  const fhSalesPerShare = metrics?.series?.quarterly?.salesPerShare || [];
  const fhGrossMargin = metrics?.series?.quarterly?.grossMargin || [];
  const fhNetMargin = metrics?.series?.quarterly?.netMargin || [];

  const findFHMatch = (targetTime, series) => {
    if (!series || series.length === 0 || !targetTime) return null;
    let best = null;
    let minDiff = Infinity;
    const maxDiff = 50 * 24 * 60 * 60 * 1000;
    series.forEach(item => {
      if (!item || !item.period) return;
      const itemTime = parseDate(item.period);
      const diff = Math.abs(targetTime - itemTime);
      if (diff < maxDiff && diff < minDiff) {
        minDiff = diff;
        best = item;
      }
    });
    return best;
  };

  const shares = 
    yfSummary?.defaultKeyStatistics?.sharesOutstanding?.raw || 
    yfSummary?.summaryDetail?.sharesOutstanding?.raw || 
    (metrics?.metric?.sharesOutstanding ? metrics.metric.sharesOutstanding * 1e6 : null);

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

    const fhEpsMatch = findFHMatch(eTime, fhEps);
    const fhSpsMatch = findFHMatch(eTime, fhSalesPerShare);
    const fhGmMatch = findFHMatch(eTime, fhGrossMargin);
    const fhNmMatch = findFHMatch(eTime, fhNetMargin);

    let revenue = revMatch?.reportedValue?.raw ?? bestInc?.totalRevenue?.raw ?? null;
    if (revenue == null && fhSpsMatch?.v != null && shares != null) {
      revenue = fhSpsMatch.v * shares;
    }

    let netIncome = netMatch?.reportedValue?.raw ?? bestInc?.netIncome?.raw ?? null;
    if (netIncome == null) {
      if (fhNmMatch?.v != null && revenue != null) {
        netIncome = revenue * fhNmMatch.v;
      } else if (fhEpsMatch?.v != null && shares != null) {
        netIncome = fhEpsMatch.v * shares;
      }
    }
    
    let grossProfit = gpMatch?.reportedValue?.raw ?? null;
    if (grossProfit == null) {
      grossProfit = bestInc?.grossProfit?.raw !== undefined ? bestInc.grossProfit.raw : null;
    }
    if (grossProfit == null && fhGmMatch?.v != null && revenue != null) {
      grossProfit = revenue * fhGmMatch.v;
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
    } else if (actual == null && fhEpsMatch?.v != null) {
      actual = fhEpsMatch.v;
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

  // Calculate fiscal offset shift from the baseList to handle shifted fiscal calendars
  let shiftQ = 0;
  let shiftY = 0;
  if (baseList.length > 0) {
    const first = baseList[0];
    const fDate = new Date(first.period);
    const fMonth = fDate.getUTCMonth() + 1;
    let calQ = 4;
    if (fMonth <= 3) calQ = 1;
    else if (fMonth <= 6) calQ = 2;
    else if (fMonth <= 9) calQ = 3;
    shiftQ = first.quarter - calQ;
    shiftY = first.year - fDate.getUTCFullYear();
  }

  const getFiscalQY = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.getUTCMonth() + 1;
    const calY = d.getUTCFullYear();
    let calQ = 4;
    if (month <= 3) calQ = 1;
    else if (month <= 6) calQ = 2;
    else if (month <= 9) calQ = 3;

    let quarter = calQ + shiftQ;
    let year = calY + shiftY;
    while (quarter > 4) {
      quarter -= 4;
      year += 1;
    }
    while (quarter < 1) {
      quarter += 4;
      year -= 1;
    }
    return { quarter, year };
  };

  // Combine dates from Yahoo timeseries and Finnhub quarterly series
  const allTSDates = new Set([
    ...gpSeries.map(x => x.asOfDate),
    ...capexSeries.map(x => x.asOfDate),
    ...revSeries.map(x => x.asOfDate),
    ...netSeries.map(x => x.asOfDate),
    ...epsBasicSeries.map(x => x.asOfDate),
    ...epsDilutedSeries.map(x => x.asOfDate),
    ...fhEps.map(x => x.period),
    ...fhSalesPerShare.map(x => x.period),
    ...fhGrossMargin.map(x => x.period),
    ...fhNetMargin.map(x => x.period)
  ].filter(Boolean));

  allTSDates.forEach(dateStr => {
    const dTime = parseDate(dateStr);
    const exists = mapped.some(e => Math.abs(parseDate(e.period) - dTime) < 50 * 24 * 60 * 60 * 1000);
    if (!exists) {
      const { quarter, year } = getFiscalQY(dateStr);

      const gpMatch = findTSMatch(dTime, gpSeries);
      const capexMatch = findTSMatch(dTime, capexSeries);
      const revMatch = findTSMatch(dTime, revSeries);
      const netMatch = findTSMatch(dTime, netSeries);
      const epsBasicMatch = findTSMatch(dTime, epsBasicSeries);
      const epsDilutedMatch = findTSMatch(dTime, epsDilutedSeries);

      const fhEpsMatch = findFHMatch(dTime, fhEps);
      const fhSpsMatch = findFHMatch(dTime, fhSalesPerShare);
      const fhGmMatch = findFHMatch(dTime, fhGrossMargin);
      const fhNmMatch = findFHMatch(dTime, fhNetMargin);

      let revenue = revMatch?.reportedValue?.raw ?? null;
      if (revenue == null && fhSpsMatch?.v != null && shares != null) {
        revenue = fhSpsMatch.v * shares;
      }

      let netIncome = netMatch?.reportedValue?.raw ?? null;
      if (netIncome == null) {
        if (fhNmMatch?.v != null && revenue != null) {
          netIncome = revenue * fhNmMatch.v;
        } else if (fhEpsMatch?.v != null && shares != null) {
          netIncome = fhEpsMatch.v * shares;
        }
      }

      let grossProfit = gpMatch?.reportedValue?.raw ?? null;
      if (grossProfit == null && fhGmMatch?.v != null && revenue != null) {
        grossProfit = revenue * fhGmMatch.v;
      }

      const capEx = capexMatch?.reportedValue?.raw ?? null;

      let actual = epsBasicMatch?.reportedValue?.raw ?? epsDilutedMatch?.reportedValue?.raw ?? null;
      if (actual == null && fhEpsMatch?.v != null) {
        actual = fhEpsMatch.v;
      }

      if (revenue !== null || netIncome !== null || actual !== null) {
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
    if (a.quarter !== b.quarter) return b.quarter - a.quarter;
    return parseDate(b.period) - parseDate(a.period);
  });

  return mapped;
}
