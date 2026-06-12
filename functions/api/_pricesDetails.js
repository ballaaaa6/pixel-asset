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
  calculateReturnsFromHistory, 
  mapFinancialsAndEarnings 
} from "./_pricesMetrics.js";

export async function fetchDetailedAsset(symbol, tf, context, corsHeaders) {
  try {
    const cacheKey = `https://cache.local/details/${symbol}`;
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
    try {
      const yfAuth = await getYahooCookieAndCrumb(context);
      const yfUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile,defaultKeyStatistics,financialData,calendarEvents,earnings,incomeStatementHistoryQuarterly${yfAuth.crumb ? `&crumb=${encodeURIComponent(yfAuth.crumb)}` : ""}`;
      const yfResp = await fetch(yfUrl, { 
        headers: { 
          ...YF_HEADERS,
          ...(yfAuth.cookie ? { "Cookie": yfAuth.cookie } : {})
        } 
      });
      if (yfResp.ok) {
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
    } catch (e) {
      console.error("YF QuoteSummary fetch failed:", e);
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

    if (!news || news.length === 0) {
      try {
        const yfSearchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=8`;
        const yfSearchResp = await fetch(yfSearchUrl, { headers: YF_HEADERS });
        if (yfSearchResp.ok) {
          const yfSearchData = await yfSearchResp.json();
          news = (yfSearchData.news || []).map(item => {
            const image = item.thumbnail?.resolutions?.[0]?.url || null;
            return {
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
    }

    const yfIncomeHistory = yfSummary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
    earnings = mapFinancialsAndEarnings(earnings, yfSummary, yfIncomeHistory);

    if (!calendar || !calendar.earningsCalendar || calendar.earningsCalendar.length === 0) {
      const yfCalendarEvents = yfSummary?.calendarEvents?.earnings;
      if (yfCalendarEvents && yfCalendarEvents.earningsDate && yfCalendarEvents.earningsDate.length > 0) {
        const nextDateStr = new Date(yfCalendarEvents.earningsDate[0].raw * 1000).toISOString().slice(0, 10);
        calendar = {
          earningsCalendar: [{
            date: nextDateStr,
            epsEstimate: yfCalendarEvents.earningsAverage?.raw ?? null
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
      news: Array.isArray(news) ? news.slice(0, 8) : [],
      earnings: Array.isArray(earnings) ? earnings.slice(0, 8) : [],
      calendar: calendar?.earningsCalendar || []
    };

    const responseBody = JSON.stringify(result);
    putCache(context, cacheKey, responseBody, 86400); // 1 day cache

    return new Response(responseBody, { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Details error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function translateNews(headline, summary, context, corsHeaders) {
  try {
    const prompt = `You are a financial news translator and analyst. Translate the headline and summary to Thai, and provide 2-3 bulleted key takeaways in Thai.
    Format your output strictly as a JSON object (no markdown, no quotes around the JSON, just raw JSON) with this structure:
    {
      "headline": "แปลหัวข้อข่าวภาษาไทย",
      "summary": "แปลเนื้อหาข่าวย่อภาษาไทย",
      "takeaways": ["ประเด็นสำคัญที่ 1", "ประเด็นสำคัญที่ 2"]
    }

    Headline: ${headline}
    Summary: ${summary}`;

    const aiRes = await context.env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "user", content: prompt }
      ]
    });

    let result = {
      headline: headline,
      summary: summary,
      takeaways: []
    };

    if (aiRes && aiRes.response) {
      try {
        let text = aiRes.response.trim();
        if (text.includes("```")) {
          text = text.split("```")[1];
          if (text.startsWith("json")) {
            text = text.substring(4);
          }
        }
        const parsed = JSON.parse(text.trim());
        result.headline = parsed.headline || headline;
        result.summary = parsed.summary || summary;
        result.takeaways = parsed.takeaways || [];
      } catch {
        result.headline = "แปล: " + headline;
        result.summary = "แปล: " + summary;
      }
    }

    return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function translateText(text, context, corsHeaders) {
  try {
    let translatedText = text;
    if (context.env.AI) {
      const aiRes = await context.env.AI.run("@cf/meta/m2m100-1.2b", {
        text: text,
        source_lang: "english",
        target_lang: "thai"
      });
      if (aiRes && aiRes.translated_text) {
        translatedText = aiRes.translated_text;
      }
    }
    return new Response(JSON.stringify({ translatedText }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Translation error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
