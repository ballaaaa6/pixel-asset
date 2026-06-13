import { 
  YF_HEADERS, 
  STATIC_THAI_PROFILES, 
  getCache, 
  putCache, 
  getYahooCookieAndCrumb, 
  extractChartPriceInfo 
} from "./_pricesBase.js";

import { 
  enrichMetricsFromYF, 
  calculateReturnsFromHistory 
} from "./_pricesMetrics.js";
import { mapFinancialsAndEarnings } from "./_financialsHelpers.js";

export async function fetchDetailedAsset(symbol, tf, context, corsHeaders) {
  try {
    const cacheKey = `https://cache.local/details/v8/${symbol}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      let detailsData = JSON.parse(cached);
      let livePriceInfo = null;
      try {
        const cachedLivePrice = await getCache(`https://cache.local/price/${symbol}`);
        if (cachedLivePrice) {
          livePriceInfo = JSON.parse(cachedLivePrice);
        } else {
          const liveChartRes = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=true`, { headers: YF_HEADERS });
          if (liveChartRes.ok) {
            const liveChartData = await liveChartRes.json();
            const liveResult = liveChartData?.chart?.result?.[0];
            if (liveResult) {
              livePriceInfo = extractChartPriceInfo(symbol, liveResult, Math.floor(Date.now() / 1000));
              if (livePriceInfo) {
                putCache(context, `https://cache.local/price/${symbol}`, JSON.stringify(livePriceInfo), 30);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to get fresh live price on details cache hit:", e);
      }

      if (livePriceInfo) {
        const activePrice = livePriceInfo.postPrice || livePriceInfo.prePrice || livePriceInfo.price;
        if (detailsData.metrics && detailsData.metrics.metric) {
          detailsData.metrics.metric.currentPrice = activePrice;
        }
      }
      return new Response(JSON.stringify(detailsData), { status: 200, headers: corsHeaders });
    }

    const safeFetch = (url, options) => fetch(url, options).catch(err => {
      console.error(`Fetch failed for ${url}:`, err);
      return null;
    });

    let livePriceInfo = null;
    try {
      const cachedLivePrice = await getCache(`https://cache.local/price/${symbol}`);
      if (cachedLivePrice) {
        livePriceInfo = JSON.parse(cachedLivePrice);
      }
    } catch {}

    const liveChartPromise = livePriceInfo 
      ? Promise.resolve(null)
      : safeFetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=true`, { headers: YF_HEADERS });

    let longBusinessSummary = "";
    let ceo = "";
    let yfSummary = null;
    let yfTimeSeries = null;
    try {
      const yfAuth = await getYahooCookieAndCrumb(context);
      const yfUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile,defaultKeyStatistics,financialData,calendarEvents,earnings,incomeStatementHistoryQuarterly,cashflowStatementHistoryQuarterly${yfAuth.crumb ? `&crumb=${encodeURIComponent(yfAuth.crumb)}` : ""}`;
      
      const now = Math.floor(Date.now() / 1000);
      const fiveYearsAgo = now - 5 * 365 * 24 * 3600;
      const types = [
        "quarterlyGrossProfit",
        "quarterlyCapitalExpenditure",
        "quarterlyTotalRevenue",
        "quarterlyNetIncome",
        "quarterlyBasicEPS",
        "quarterlyDilutedEPS"
      ].join(",");
      const tsUrl = `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}?symbol=${symbol}&type=${types}&period1=${fiveYearsAgo}&period2=${now}&padTimeSeries=true${yfAuth.crumb ? `&crumb=${encodeURIComponent(yfAuth.crumb)}` : ""}`;

      const [yfResp, tsResp] = await Promise.all([
        fetch(yfUrl, { 
          headers: { 
            ...YF_HEADERS,
            ...(yfAuth.cookie ? { "Cookie": yfAuth.cookie } : {})
          } 
        }),
        fetch(tsUrl, {
          headers: {
            ...YF_HEADERS,
            ...(yfAuth.cookie ? { "Cookie": yfAuth.cookie } : {})
          }
        })
      ]);

      if (yfResp && yfResp.ok) {
        const yfData = await yfResp.json();
        yfSummary = yfData?.quoteSummary?.result?.[0];
        if (yfSummary) {
          const profileData = yfSummary.assetProfile;
          if (profileData) {
            longBusinessSummary = profileData.longBusinessSummary || "";
            const ceoOfficer = (profileData.companyOfficers || []).find(o => {
              const title = (o.title || "").toLowerCase();
              return title.includes("ceo") || 
                     title.includes("chief executive") || 
                     title.includes("managing director") || 
                     title.includes("president") || 
                     title.includes("md") ||
                     title.includes("กรรมการผู้จัดการ");
            });
            if (ceoOfficer) ceo = ceoOfficer.name;
          }
        }
      }
      
      if (tsResp && tsResp.ok) {
        const tsData = await tsResp.json();
        yfTimeSeries = tsData?.timeseries?.result || null;
      }
    } catch (e) {
      console.error("YF fetches failed:", e);
    }

    const token = "d8e3e4hr01qm5ffvbi4gd8e3e4hr01qm5ffvbi50";
    const toDate = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const isNonEquity = symbol.includes("-") || symbol.includes("=") || symbol.includes("/") || symbol.startsWith("^");

    const [profileRes, metricsRes, newsRes, earningsRes, calendarRes, historyRes, liveChartRes] = await Promise.all([
      isNonEquity ? Promise.resolve(null) : safeFetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`),
      isNonEquity ? Promise.resolve(null) : safeFetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${token}`),
      isNonEquity ? Promise.resolve(null) : safeFetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${token}`),
      isNonEquity ? Promise.resolve(null) : safeFetch(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${token}`),
      isNonEquity ? Promise.resolve(null) : safeFetch(`https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&from=${toDate}&to=${oneYearLater}&token=${token}`),
      safeFetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y&includePrePost=true`, { headers: YF_HEADERS }),
      liveChartPromise
    ]);

    let profile = profileRes && profileRes.ok ? await profileRes.json() : {};
    let metrics = metricsRes && metricsRes.ok ? await metricsRes.json() : {};
    let news = newsRes && newsRes.ok ? await newsRes.json() : [];
    let earnings = earningsRes && earningsRes.ok ? await earningsRes.json() : [];
    let calendar = calendarRes && calendarRes.ok ? await calendarRes.json() : {};
    let historyData = null;
    if (historyRes && historyRes.ok) {
      try { historyData = await historyRes.json(); } catch {}
    }

    if (!livePriceInfo && liveChartRes && liveChartRes.ok) {
      try {
        const liveChartData = await liveChartRes.json();
        const liveResult = liveChartData?.chart?.result?.[0];
        if (liveResult) {
          livePriceInfo = extractChartPriceInfo(symbol, liveResult, Math.floor(Date.now() / 1000));
          if (livePriceInfo) {
            putCache(context, `https://cache.local/price/${symbol}`, JSON.stringify(livePriceInfo), 30);
          }
        }
      } catch (e) {
        console.error("Failed to parse live chart in details:", e);
      }
    }

    if (!profile || !profile.name || profile.name === symbol) {
      profile = profile || {};
      profile.name = yfSummary?.quoteType?.longName || yfSummary?.quoteType?.shortName || symbol;
      profile.exchange = yfSummary?.price?.exchangeName || yfSummary?.quoteType?.exchange || "GLOBAL";
      profile.finnhubIndustry = yfSummary?.assetProfile?.sector || "ไม่ระบุ";
      profile.country = yfSummary?.assetProfile?.country || "-";
      profile.weburl = yfSummary?.assetProfile?.website || "";
      profile.shareOutstanding = (yfSummary?.defaultKeyStatistics?.sharesOutstanding?.raw) ? (yfSummary.defaultKeyStatistics.sharesOutstanding.raw / 1e6) : null;
      profile.currency = yfSummary?.price?.currency || yfSummary?.summaryDetail?.currency || "USD";
    }

    const isThai = symbol.endsWith(".BK");
    const staticProfile = STATIC_THAI_PROFILES[symbol];
    
    if (!profile.name || profile.name === symbol) {
      if (staticProfile) {
        profile.name = staticProfile.name;
        profile.exchange = "SET";
        profile.finnhubIndustry = staticProfile.finnhubIndustry;
        profile.country = staticProfile.country;
        profile.weburl = staticProfile.weburl;
        profile.ceo = staticProfile.ceo;
        longBusinessSummary = staticProfile.longBusinessSummary;
      } else if (isThai) {
        profile.name = symbol.replace(".BK", "");
        profile.exchange = "SET";
        profile.country = "Thailand";
        profile.finnhubIndustry = profile.finnhubIndustry || "ไม่ระบุ";
        profile.ceo = profile.ceo || "-";
      }
    }

    if ((!profile.ceo || profile.ceo === "-") && staticProfile) {
      profile.ceo = staticProfile.ceo;
    }
    if (!longBusinessSummary && staticProfile) {
      longBusinessSummary = staticProfile.longBusinessSummary;
    }
    if (isThai && !longBusinessSummary) {
      longBusinessSummary = `ข้อมูลรายละเอียดของบริษัท ${symbol.replace(".BK", "")} อยู่ระหว่างการอัปเดตระบบ หรือกรุณาติดต่อผู้พัฒนา`;
    }

    // Calculate returns and technical stats from history data
    const { returns, stats } = calculateReturnsFromHistory(historyData);
    
    if (livePriceInfo) {
      const activePrice = livePriceInfo.postPrice || livePriceInfo.prePrice || livePriceInfo.price;
      stats.chartCurrentPrice = activePrice;
    }

    // Enrich metrics using modular helper
    metrics = enrichMetricsFromYF(metrics, yfSummary, returns, stats);

    // Always fetch Yahoo Finance search news because it is directly related to the stock ticker and is very fresh
    let yfNews = [];
    try {
      const yfSearchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=60`;
      const yfSearchResp = await fetch(yfSearchUrl, { headers: YF_HEADERS });
      if (yfSearchResp.ok) {
        const yfSearchData = await yfSearchResp.json();
        yfNews = (yfSearchData.news || []).map(item => {
          const image = item.thumbnail?.resolutions?.[0]?.url || null;
          return {
            uuid: item.uuid || "",
            headline: item.title || "",
            summary: item.title || "",
            source: item.publisher || "Yahoo Finance",
            datetime: item.providerPublishTime || Math.floor(Date.now() / 1000),
            image,
            url: item.link || ""
          };
        });
      }
    } catch (e) {
      console.error("YF news fetch failed:", e);
    }

    // Combine and deduplicate news from Finnhub and Yahoo Finance
    const combinedNews = [];
    const seenUrls = new Set();
    const seenHeadlines = new Set();

    const addNewsItem = (item) => {
      const url = (item.url || "").trim();
      const headline = (item.headline || "").trim().toLowerCase();
      if (!headline) return;
      if (url && seenUrls.has(url)) return;
      if (seenHeadlines.has(headline)) return;
      
      if (url) seenUrls.add(url);
      seenHeadlines.add(headline);
      combinedNews.push(item);
    };

    // Prioritize Yahoo Finance news because they contain Yahoo UUIDs for full-text fetching via CaaS JSON API
    if (yfNews && Array.isArray(yfNews)) {
      yfNews.forEach(item => addNewsItem(item));
    }
    if (news && Array.isArray(news)) {
      news.forEach(item => addNewsItem(item));
    }

    news = combinedNews;

    const yfIncomeHistory = yfSummary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
    const yfCFHistory = yfSummary?.cashflowStatementHistoryQuarterly?.cashflowStatements || [];
    earnings = mapFinancialsAndEarnings(earnings, yfSummary, yfIncomeHistory, yfCFHistory, yfTimeSeries, metrics);

    if (!calendar || !calendar.earningsCalendar || calendar.earningsCalendar.length === 0) {
      const yfCalendarEvents = yfSummary?.calendarEvents?.earnings;
      if (yfCalendarEvents && yfCalendarEvents.earningsDate && yfCalendarEvents.earningsDate.length > 0) {
        const nextDateStr = new Date(yfCalendarEvents.earningsDate[0].raw * 1000).toISOString().slice(0, 10);
        calendar = {
          earningsCalendar: [{
            date: nextDateStr,
            epsEstimate: yfCalendarEvents.earningsAverage?.raw ?? null,
            revenueEstimate: yfCalendarEvents.revenueAverage?.raw ?? null
          }]
        };
      } else {
        calendar = { earningsCalendar: [] };
      }
    }

    let thaiSummary = "";
    if (longBusinessSummary && context.env.AI) {
      try {
        const aiRes = await context.env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { role: "system", content: "You are a professional financial translator and analyst. Translate the business description into a simple, clear, and easy-to-understand Thai paragraph (maximum 3 sentences) explaining what this company does and what its main products/services are." },
            { role: "user", content: `Please summarize and translate to Thai:\n\n${longBusinessSummary}` }
          ]
        });
        if (aiRes && aiRes.response) {
          thaiSummary = aiRes.response.trim();
        }
      } catch (e) {
        console.error("AI translation of description failed:", e);
      }
    }

    const result = {
      symbol,
      profile: {
        ...profile,
        ceo: ceo || profile.ceo || "-",
        longBusinessSummary: longBusinessSummary || null
      },
      metrics,
      thaiSummary: thaiSummary || null,
      news: Array.isArray(news) ? news.slice(0, 30) : [],
      earnings: Array.isArray(earnings) ? earnings.slice(0, 22) : [],
      calendar: calendar?.earningsCalendar || []
    };

    const responseBody = JSON.stringify(result);
    putCache(context, cacheKey, responseBody, 86400); // 1 day cache

    return new Response(responseBody, { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Details error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
