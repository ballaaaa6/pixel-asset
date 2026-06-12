export function calculateDividendProjections(assets, prices, dividendData) {
  const stockAssets = assets.filter(
    a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat"
  );

  let totalAnnualIncomeUSD = 0;
  let totalStockValueUSD = 0;
  const computedAssets = [];
  const upcomingPayments = [];

  // Monthly buckets for the next 12 months starting from current month
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth(); // 0 - 11
  const currentYear = currentDate.getFullYear();

  const next12Months = [];
  for (let i = 0; i < 12; i++) {
    const m = (currentMonthIndex + i) % 12;
    const y = currentYear + Math.floor((currentMonthIndex + i) / 12);
    next12Months.push({ month: m, year: y, value: 0, payments: [] });
  }

  stockAssets.forEach(asset => {
    const pData = prices[asset.symbol];
    const priceUSD = pData?.price || 0;
    const valueUSD = priceUSD * asset.qty;
    totalStockValueUSD += valueUSD;

    const events = dividendData?.[asset.symbol];
    if (!events) {
      computedAssets.push({
        ...asset,
        priceUSD,
        valueUSD,
        annualRate: 0,
        annualIncomeUSD: 0,
        yieldPct: 0,
        frequency: "N/A"
      });
      return;
    }

    // Convert events map to array and sort by date descending
    const eventList = Object.values(events).sort((a, b) => b.date - a.date);
    if (eventList.length === 0) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const oneYearAgoSec = nowSec - 365 * 24 * 60 * 60;
    
    // Filter dividends paid in the last 1 year
    const lastYearDividends = eventList.filter(e => e.date >= oneYearAgoSec);
    
    let annualRate = 0;
    let frequencyCount = lastYearDividends.length;
    
    if (frequencyCount > 0) {
      annualRate = lastYearDividends.reduce((sum, e) => sum + (e.amount || 0), 0);
    } else {
      // Fallback: use last dividend amount and guess frequency
      const lastDiv = eventList[0];
      annualRate = (lastDiv?.amount || 0) * 4; // default to quarterly
      frequencyCount = 4;
    }

    const frequencyText = 
      frequencyCount >= 12 ? "รายเดือน" :
      frequencyCount >= 4 ? "รายไตรมาส" :
      frequencyCount >= 2 ? "ครึ่งปี" :
      frequencyCount === 1 ? "รายปี" : "ไม่แน่นอน";

    const annualIncomeUSD = annualRate * asset.qty;
    const yieldPct = priceUSD > 0 ? (annualRate / priceUSD) * 100 : 0;

    totalAnnualIncomeUSD += annualIncomeUSD;

    computedAssets.push({
      ...asset,
      priceUSD,
      valueUSD,
      annualRate,
      annualIncomeUSD,
      yieldPct,
      frequency: frequencyText
    });

    // Project payouts for the next 12 months based on historical months
    const historicalMonths = new Set();
    lastYearDividends.forEach(e => {
      const d = new Date(e.date * 1000);
      historicalMonths.add(d.getMonth());
    });

    // If no dividends in past year, fallback to last dividend's month
    if (historicalMonths.size === 0 && eventList.length > 0) {
      const d = new Date(eventList[0].date * 1000);
      historicalMonths.add(d.getMonth());
    }

    const lastAmount = eventList[0]?.amount || 0;
    const payoutPerCycle = lastAmount * asset.qty;

    next12Months.forEach(target => {
      if (historicalMonths.has(target.month)) {
        target.value += payoutPerCycle;
        target.payments.push({
          symbol: asset.symbol,
          qty: asset.qty,
          amountPerShare: lastAmount,
          estPayoutUSD: payoutPerCycle
        });
      }
    });

    // Project next upcoming payment
    if (eventList.length > 0 && frequencyCount > 0) {
      const lastEvent = eventList[0];
      const cycleDays = 365 / (frequencyCount || 4);
      
      let estExDateSec = lastEvent.date;
      while (estExDateSec <= nowSec) {
        estExDateSec += cycleDays * 24 * 60 * 60;
      }

      upcomingPayments.push({
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        estExDate: new Date(estExDateSec * 1000),
        amountPerShare: lastAmount,
        estPayoutUSD: payoutPerCycle
      });
    }
  });

  // Sort upcoming payments by date ascending
  upcomingPayments.sort((a, b) => a.estExDate - b.estExDate);

  const averageYield = totalStockValueUSD > 0 ? (totalAnnualIncomeUSD / totalStockValueUSD) * 100 : 0;
  const avgMonthlyIncomeUSD = totalAnnualIncomeUSD / 12;

  return {
    computedAssets,
    upcomingPayments: upcomingPayments.slice(0, 5), // top 5
    next12Months,
    totalAnnualIncomeUSD,
    totalStockValueUSD,
    averageYield,
    avgMonthlyIncomeUSD
  };
}
