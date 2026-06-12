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
          const cacheKey = `https://cache.local/price/${symbol}`;
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
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=true`;
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
                : null
            };

            if (entry.price > 0) {
              const cacheKey = `https://cache.local/price/${symbol}`;
              putCache(context, cacheKey, JSON.stringify(entry), 30);
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

  return new Response(JSON.stringify({ error: "ระบุพารามิเตอร์ ?symbols= หรือ ?q= หรือ ?sparkline= หรือ ?history=" }), { status: 400, headers: corsHeaders });

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
