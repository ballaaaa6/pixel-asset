import { THAI_STOCKS } from "./thaiStocks.js";

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
};

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const symbolsParam = url.searchParams.get("symbols");
  const sparklineParam = url.searchParams.get("sparkline");
  const dividendsParam = url.searchParams.get("dividends");
  const isDividends = dividendsParam === "true";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // ─── 1. Autocomplete Search (?q=) ────────────────────────────────────────
  if (q) {
    try {
      const cacheKey = `https://cache.local/search/${encodeURIComponent(q.trim().toLowerCase())}`;
      const cached = await getCache(cacheKey);
      if (cached) return new Response(cached, { status: 200, headers: corsHeaders });

      const queryStr = q.trim().toLowerCase();
      const hasThai = /[\u0e00-\u0e7f]/.test(queryStr);

      let localMatches = [];
      if (queryStr) {
        localMatches = THAI_STOCKS.filter(stock => 
          stock.symbol.toLowerCase().includes(queryStr) || 
          stock.name.toLowerCase().includes(queryStr)
        ).map(item => ({
          symbol: item.symbol,
          name: item.name,
          type: item.type,
          exchange: item.exchange
        }));
      }

      let results = [];

      if (hasThai) {
        // If it contains Thai characters, do NOT query Yahoo Finance (which returns 400 Bad Request)
        results = localMatches;
      } else {
        // Otherwise, fetch from Yahoo Finance and merge with local matches
        const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
        const resp = await fetch(searchUrl, { headers: YF_HEADERS });
        if (resp.ok) {
          const data = await resp.json();
          const yfResults = (data.quotes || []).map(item => ({
            symbol: item.symbol,
            name: item.longname || item.shortname || item.dispName || item.symbol,
            type: item.quoteType || item.typeDisp || "UNKNOWN",
            exchange: item.exchDisp || item.exchange || "GLOBAL"
          }));
          
          // Merge local matches and YF results, ensuring unique symbols
          const seen = new Set();
          results = [...localMatches, ...yfResults].filter(item => {
            const symKey = item.symbol.toUpperCase();
            if (seen.has(symKey)) return false;
            seen.add(symKey);
            return true;
          });
        } else {
          // If YF fails, return local matches at least
          results = localMatches;
        }
      }

      const jsonStr = JSON.stringify(results);
      putCache(context, cacheKey, jsonStr, 3600);
      return new Response(jsonStr, { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "ข้อผิดพลาดค้นหา: " + err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // ─── 2. Sparkline History (?sparkline=SYM1,SYM2&tf=1M) ────────────────
  if (sparklineParam) {
    try {
      const symbols = sparklineParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      const tf = (url.searchParams.get("tf") || "1M").toUpperCase();

      const tfMap = {
        "1D":  { range: "1d",  interval: "5m"  },
        "5D":  { range: "5d",  interval: "60m" },
        "1W":  { range: "7d",  interval: "30m" },
        "1M":  { range: "1mo", interval: "1d"  },
        "3M":  { range: "3mo", interval: "1d"  },
        "6M":  { range: "6mo", interval: "1d"  },
        "YTD": { range: "ytd", interval: "1d"  },
        "1Y":  { range: "1y",  interval: "1d"  },
        "2Y":  { range: "2y",  interval: "1d"  },
        "5Y":  { range: "5y",  interval: "1d"  },
        "MAX": { range: "max", interval: "1d"  },
      };
      const { range, interval } = tfMap[tf] || tfMap["1M"];

      const sparklineMap = {};
      const missingSymbols = [];

      const cachePromises = symbols.map(async (symbol) => {
        const cacheKey = `https://cache.local/sparkline/${tf}/${symbol}`;
        try {
          const cached = await getCache(cacheKey);
          if (cached) {
            sparklineMap[symbol] = JSON.parse(cached);
            return;
          }
        } catch {}
        missingSymbols.push(symbol);
      });
      await Promise.all(cachePromises);

      if (missingSymbols.length > 0) {
        const historyFetches = missingSymbols.map(async (symbol) => {
          try {
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=true`;
            const resp = await fetch(chartUrl, { headers: YF_HEADERS });
            if (!resp.ok) return { symbol, dates: [], closes: [] };

            const data = await resp.json();
            const result = data?.chart?.result?.[0];
            if (!result) return { symbol, dates: [], closes: [] };

            const timestamps = result.timestamp || [];
            const rawCloses = result.indicators?.quote?.[0]?.close || [];

            const paired = timestamps.map((ts, i) => ({
              date: new Date(ts * 1000).toISOString(),
              close: rawCloses[i]
            })).filter(p => p.close != null && p.close > 0);

            const entry = {
              dates: paired.map(p => p.date),
              closes: paired.map(p => p.close)
            };

            if (entry.closes.length > 0) {
              const cacheKey = `https://cache.local/sparkline/${tf}/${symbol}`;
              putCache(context, cacheKey, JSON.stringify(entry), 300);
            }

            return { symbol, ...entry };
          } catch {
            return { symbol, dates: [], closes: [] };
          }
        });

        const results = await Promise.all(historyFetches);
        results.forEach(r => { sparklineMap[r.symbol] = { dates: r.dates, closes: r.closes }; });
      }

      return new Response(JSON.stringify(sparklineMap), { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "โหลดประวัติราคาไม่สำเร็จ: " + err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // ─── 3. Live Prices (?symbols=) ─────────────────────────────────────────
  if (symbolsParam) {
    try {
      let symbolsList = symbolsParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      if (!symbolsList.includes("THB=X")) symbolsList.push("THB=X");

      const quotesMap = {};
      const missingSymbols = [];

      const noCache = url.searchParams.get("nocache") === "true";
      if (!noCache) {
        const cachePromises = symbolsList.map(async (symbol) => {
          const cacheKey = isDividends 
            ? `https://cache.local/price-div/${symbol}` 
            : `https://cache.local/price/${symbol}`;
          try {
            const cached = await getCache(cacheKey);
            if (cached) {
              quotesMap[symbol] = JSON.parse(cached);
              return;
            }
          } catch {}
          missingSymbols.push(symbol);
        });
        await Promise.all(cachePromises);
      } else {
        missingSymbols.push(...symbolsList);
      }

      if (missingSymbols.length > 0) {
        const priceFetches = missingSymbols.map(async (symbol) => {
          try {
            const range = isDividends ? "1y" : "1d";
            const interval = isDividends ? "1d" : "5m";
            const events = isDividends ? "&events=div" : "";
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=true${events}`;
            const resp = await fetch(chartUrl, { headers: YF_HEADERS });
            if (!resp.ok) return null;

            const data = await resp.json();
            const result = data?.chart?.result?.[0];
            if (!result) return null;

            const meta = result.meta;
            const rawPrice = meta.regularMarketPrice || 0;
            const prevClose = meta.chartPreviousClose || meta.previousClose || rawPrice;

            let marketState = "REGULAR";
            const now = Math.floor(Date.now() / 1000);
            const ctp = meta.currentTradingPeriod;
            if (ctp) {
              const pre = ctp.pre;
              const reg = ctp.regular;
              const post = ctp.post;
              
              if (pre && now >= pre.start && now < pre.end) {
                marketState = "PRE";
              } else if (reg && now >= reg.start && now < reg.end) {
                marketState = "REGULAR";
              } else if (post && now >= post.start && now < post.end) {
                marketState = "POST";
              } else {
                marketState = "CLOSED";
              }
            }

            const timestamps = result.timestamp || [];
            const rawCloses = result.indicators?.quote?.[0]?.close || [];
            const paired = timestamps.map((ts, i) => ({
              ts,
              close: rawCloses[i]
            })).filter(p => p.close != null && p.close > 0);

            const lastPoint = paired[paired.length - 1];
            const lastPrice = lastPoint ? lastPoint.close : rawPrice;

            // Determine true regular session price
            let price = rawPrice;
            let isRegularSessionNow = false;
            if (ctp && ctp.regular) {
              isRegularSessionNow = now >= ctp.regular.start && now < ctp.regular.end;
            }

            if (isRegularSessionNow) {
              price = rawPrice;
            } else {
              let chartReg = null;
              try {
                chartReg = meta.tradingPeriods?.regular?.[0]?.[0];
              } catch {}
              if (chartReg) {
                const regStart = chartReg.start;
                const regEnd = chartReg.end;
                const regularPoints = paired.filter(p => p.ts >= regStart && p.ts <= regEnd);
                if (regularPoints.length > 0) {
                  price = regularPoints[regularPoints.length - 1].close;
                } else {
                  price = rawPrice;
                }
              } else {
                price = rawPrice;
              }
            }

            const change = price - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

            let prePrice = null;
            let postPrice = null;

            if (marketState === "PRE") {
              prePrice = lastPrice;
            } else if (marketState === "POST") {
              postPrice = lastPrice;
            } else if (marketState === "CLOSED") {
              let chartPost = null;
              let chartReg = null;
              try {
                chartPost = meta.tradingPeriods?.post?.[0]?.[0];
                chartReg = meta.tradingPeriods?.regular?.[0]?.[0];
              } catch {}

              if (chartPost && lastPoint && lastPoint.ts >= chartPost.start && lastPoint.ts <= chartPost.end) {
                postPrice = lastPrice;
              } else if (chartReg && lastPoint && lastPoint.ts > chartReg.end) {
                postPrice = lastPrice;
              }
            }

            // Fetch Beta from Finnhub with Cache API
            let beta = null;
            if (symbol !== "THB=X" && !symbol.includes("=") && !symbol.includes("-")) {
              const betaCacheKey = `https://cache.local/beta/${symbol}`;
              try {
                const cachedBeta = await getCache(betaCacheKey);
                if (cachedBeta !== null) {
                  beta = cachedBeta === "null" ? null : parseFloat(cachedBeta);
                } else {
                  const fnToken = "d8e3e4hr01qm5ffvbi4gd8e3e4hr01qm5ffvbi50";
                  const fnUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${fnToken}`;
                  const fnResp = await fetch(fnUrl);
                  if (fnResp.ok) {
                    const fnData = await fnResp.json();
                    const fetchedBeta = fnData?.metric?.beta;
                    if (fetchedBeta != null) {
                      beta = parseFloat(fetchedBeta);
                      putCache(context, betaCacheKey, String(beta), 604800); // 7 days cache
                    } else {
                      putCache(context, betaCacheKey, "null", 86400); // 1 day cache for null
                    }
                  }
                }
              } catch (e) {
                console.error("Finnhub Beta error:", e);
              }
            }

            const dividends = result.events?.dividends;
            const entry = {
              symbol,
              price,
              change,
              changePercent,
              previousClose: prevClose,
              currency: meta.currency || "USD",
              marketState,
              prePrice,
              preChangePercent: prePrice && prevClose
                ? ((prePrice - prevClose) / prevClose) * 100
                : null,
              postPrice,
              postChangePercent: postPrice && price
                ? ((postPrice - price) / price) * 100
                : null,
              dividends: dividends || null,
              beta
            };

            if (entry.price > 0) {
              const cacheKey = isDividends 
                ? `https://cache.local/price-div/${symbol}` 
                : `https://cache.local/price/${symbol}`;
              const cacheTTL = isDividends ? 43200 : 30;
              putCache(context, cacheKey, JSON.stringify(entry), cacheTTL);
            }

            return entry;
          } catch {
            return null;
          }
        });

        const fetched = await Promise.all(priceFetches);
        fetched.forEach(item => {
          if (item) quotesMap[item.symbol] = item;
        });
      }

      const exchangeRate = quotesMap["THB=X"]?.price || 35.0;
      return new Response(JSON.stringify({ quotes: quotesMap, exchangeRate }), { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "โหลดราคาไม่สำเร็จ: " + err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // ─── 4. Detailed Asset History (?history=SYM&tf=1D|5D|1M|3M|6M|1Y) ──────
  const historyParam = url.searchParams.get("history");
  if (historyParam) {
    try {
      const symbol = historyParam.trim().toUpperCase();
      const tf = (url.searchParams.get("tf") || "1M").toUpperCase();

      const cacheKey = `https://cache.local/history/${tf}/${symbol}`;
      const cached = await getCache(cacheKey);
      if (cached) return new Response(cached, { status: 200, headers: corsHeaders });

      const tfMap = {
        "1D":  { range: "1d",  interval: "5m"  },
        "5D":  { range: "5d",  interval: "60m" },
        "1W":  { range: "7d",  interval: "30m" },
        "1M":  { range: "1mo", interval: "1d"  },
        "3M":  { range: "3mo", interval: "1d"  },
        "6M":  { range: "6mo", interval: "1d"  },
        "YTD": { range: "ytd", interval: "1d"  },
        "1Y":  { range: "1y",  interval: "1d"  },
        "2Y":  { range: "2y",  interval: "1d"  },
        "5Y":  { range: "5y",  interval: "1d"  },
        "MAX": { range: "max", interval: "1d"  },
      };
      const { range, interval } = tfMap[tf] || tfMap["1M"];

      const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=true`;
      const resp = await fetch(chartUrl, { headers: YF_HEADERS });
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "ดึงข้อมูลไม่สำเร็จ", status: resp.status }), { status: resp.status, headers: corsHeaders });
      }

      const data = await resp.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        return new Response(JSON.stringify({ error: "ไม่มีข้อมูลกราฟ" }), { status: 404, headers: corsHeaders });
      }

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const opens  = quote.open   || [];
      const highs  = quote.high   || [];
      const lows   = quote.low    || [];
      const closes = quote.close  || [];
      const vols   = quote.volume || [];

      const candles = timestamps.map((ts, i) => ({
        ts,
        date: new Date(ts * 1000).toISOString(),
        open:   opens[i]  ?? null,
        high:   highs[i]  ?? null,
        low:    lows[i]   ?? null,
        close:  closes[i] ?? null,
        volume: vols[i]   ?? null,
      })).filter(c => c.close != null && c.close > 0);

      const meta = result.meta || {};

      const responseBody = JSON.stringify({
        symbol,
        tf,
        interval,
        currency: meta.currency || "USD",
        regularMarketPrice: meta.regularMarketPrice,
        candles,
      });

      if (candles.length > 0) {
        putCache(context, cacheKey, responseBody, 300);
      }

      return new Response(responseBody, { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "History error: " + err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // ─── 5. Detailed Stock Fundamentals (?details=SYM) ──────────────────
  const detailsParam = url.searchParams.get("details");
  if (detailsParam) {
    try {
      const symbol = detailsParam.trim().toUpperCase();
      const cacheKey = `https://cache.local/details/${symbol}`;
      const cached = await getCache(cacheKey);
      if (cached) return new Response(cached, { status: 200, headers: corsHeaders });

      // Fetch Yahoo Finance quote summary for company description, officers, and fundamental key statistics
      let longBusinessSummary = "";
      let ceo = "";
      let yfSummary = null;
      try {
        const yfUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile,defaultKeyStatistics,financialData,calendarEvents,earnings`;
        const yfResp = await fetch(yfUrl, { headers: YF_HEADERS });
        if (yfResp.ok) {
          const yfData = await yfResp.json();
          yfSummary = yfData?.quoteSummary?.result?.[0];
          if (yfSummary) {
            const profileData = yfSummary.assetProfile;
            if (profileData) {
              longBusinessSummary = profileData.longBusinessSummary || "";
              const ceoOfficer = (profileData.companyOfficers || []).find(o => o.title?.toLowerCase().includes("ceo") || o.title?.toLowerCase().includes("chief executive"));
              if (ceoOfficer) ceo = ceoOfficer.name;
            }
          }
        }
      } catch (e) {
        console.error("YF QuoteSummary fetch failed:", e);
      }

      // Fetch Finnhub data
      const token = "d8e3e4hr01qm5ffvbi4gd8e3e4hr01qm5ffvbi50";
      const toDate = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [profileRes, metricsRes, newsRes, earningsRes, calendarRes] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`),
        fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${token}`),
        fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${token}`),
        fetch(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${token}`),
        fetch(`https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&from=${toDate}&to=${oneYearLater}&token=${token}`)
      ]);

      let profile = profileRes.ok ? await profileRes.json() : {};
      let metrics = metricsRes.ok ? await metricsRes.json() : {};
      let news = newsRes.ok ? await newsRes.json() : [];
      let earnings = earningsRes.ok ? await earningsRes.json() : [];
      let calendar = calendarRes.ok ? await calendarRes.json() : {};

      // If Finnhub profile is empty or missing name/exchange, merge from Yahoo Finance
      if (!profile || !profile.name) {
        profile = profile || {};
        profile.name = yfSummary?.quoteType?.longName || yfSummary?.quoteType?.shortName || symbol;
        profile.exchange = yfSummary?.price?.exchangeName || yfSummary?.quoteType?.exchange || "GLOBAL";
        profile.finnhubIndustry = yfSummary?.assetProfile?.sector || "ไม่ระบุ";
        profile.country = yfSummary?.assetProfile?.country || "-";
        profile.weburl = yfSummary?.assetProfile?.website || "";
        profile.shareOutstanding = (yfSummary?.defaultKeyStatistics?.sharesOutstanding?.raw) ? (yfSummary.defaultKeyStatistics.sharesOutstanding.raw / 1e6) : null;
      }

      // Always enrich metrics from Yahoo Finance if available (PE, PS, Forward PE, ROE, ROA, Debt/Equity, margins, yields)
      metrics = metrics || {};
      metrics.metric = metrics.metric || {};
      if (yfSummary) {
        const keyStats = yfSummary.defaultKeyStatistics || {};
        const finData = yfSummary.financialData || {};
        const priceData = yfSummary.price || {};
        const sumDetail = yfSummary.summaryDetail || {};
        
        metrics.metric.marketCapitalization = priceData.marketCap?.raw || keyStats.enterpriseValue?.raw || metrics.metric.marketCapitalization || null;
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
      }

      // If Finnhub news is empty, fetch news from Yahoo Finance search
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

      // If Finnhub earnings is empty, merge from Yahoo Finance
      if (!earnings || earnings.length === 0) {
        const yfEarnings = yfSummary?.earnings?.earningsChart?.quarterly || [];
        earnings = yfEarnings.map(e => {
          const match = e.date?.match(/(\d)Q(\d{4})/);
          const quarter = match ? parseInt(match[1]) : 0;
          const year = match ? parseInt(match[2]) : 0;
          const actual = e.actual?.raw ?? e.actual ?? null;
          const estimate = e.estimate?.raw ?? e.estimate ?? null;
          const surprise = (actual != null && estimate != null) ? (actual - estimate) : null;
          const surprisePercent = (surprise != null && estimate !== 0 && estimate != null) ? (surprise / Math.abs(estimate)) * 100 : 0;
          return {
            quarter,
            year,
            period: e.date,
            actual,
            estimate,
            surprise,
            surprisePercent
          };
        }).reverse(); // Latest first
      }

      // Map Yahoo Finance quarterly financials (revenue & net income) onto earnings
      const yfFinancials = yfSummary?.earnings?.financialsChart?.quarterly || [];
      const financialsMap = {};
      yfFinancials.forEach(f => {
        if (f.date) {
          financialsMap[f.date] = {
            revenue: f.revenue?.raw ?? f.revenue ?? null,
            netIncome: f.earnings?.raw ?? f.earnings ?? null
          };
        }
      });

      earnings = earnings.map(e => {
        // Match either "1Q2024" or standard quarter/year keys
        const targetDateKey1 = `${e.quarter}Q${e.year}`;
        const targetDateKey2 = e.period || "";
        const extra = financialsMap[targetDateKey1] || financialsMap[targetDateKey2] || {};
        return {
          ...e,
          revenue: extra.revenue || null,
          netIncome: extra.netIncome || null
        };
      });

      // If Finnhub calendar is empty, merge from Yahoo Finance
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

      // AI summary translation
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
        earnings: Array.isArray(earnings) ? earnings.slice(0, 4) : [],
        calendar: calendar?.earningsCalendar || []
      };

      const responseBody = JSON.stringify(result);
      putCache(context, cacheKey, responseBody, 86400); // Cache for 1 day

      return new Response(responseBody, { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Details error: " + err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // ─── 6. On-Demand Text Translation (?translate=TEXT) ──────────────────
  const translateParam = url.searchParams.get("translate");
  if (translateParam) {
    try {
      const text = translateParam.trim();
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

  return new Response(JSON.stringify({ error: "ระบุพารามิเตอร์ ?symbols= หรือ ?q= หรือ ?sparkline= หรือ ?history= หรือ ?details= หรือ ?translate=" }), { status: 400, headers: corsHeaders });

}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

// ─── Cache API Helper Functions ──────────────────────────────────────────────
async function getCache(cacheKey) {
  if (typeof caches === "undefined" || !caches.default) return null;
  try {
    const response = await caches.default.match(new Request(cacheKey));
    if (response) {
      return await response.text();
    }
  } catch {}
  return null;
}

function putCache(context, cacheKey, value, ttlSeconds) {
  if (typeof caches === "undefined" || !caches.default) return;
  try {
    const response = new Response(value, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `s-maxage=${ttlSeconds}`
      }
    });
    context.waitUntil(caches.default.put(new Request(cacheKey), response));
  } catch {}
}
