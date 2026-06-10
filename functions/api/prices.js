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

  const kv = context.env?.PORTFOLIOS;

  // ─── 1. Autocomplete Search (?q=) ────────────────────────────────────────
  if (q) {
    try {
      const cacheKey = `cache:search:${q.trim().toLowerCase()}`;
      if (kv) {
        try {
          const cached = await kv.get(cacheKey);
          if (cached) return new Response(cached, { status: 200, headers: corsHeaders });
        } catch {}
      }

      const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
      const resp = await fetch(searchUrl, { headers: YF_HEADERS });
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "ค้นหาไม่สำเร็จ" }), { status: resp.status, headers: corsHeaders });
      }
      const data = await resp.json();
      const results = (data.quotes || []).map(item => ({
        symbol: item.symbol,
        name: item.longname || item.shortname || item.dispName || item.symbol,
        type: item.quoteType || item.typeDisp || "UNKNOWN",
        exchange: item.exchDisp || item.exchange || "GLOBAL"
      }));
      const jsonStr = JSON.stringify(results);
      if (kv) {
        try {
          await kv.put(cacheKey, jsonStr, { expirationTtl: 3600 });
        } catch {}
      }
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

      if (kv) {
        const cachePromises = symbols.map(async (symbol) => {
          const key = `cache:sparkline:${tf}:${symbol}`;
          try {
            const cached = await kv.get(key);
            if (cached) {
              sparklineMap[symbol] = JSON.parse(cached);
              return;
            }
          } catch {}
          missingSymbols.push(symbol);
        });
        await Promise.all(cachePromises);
      } else {
        missingSymbols.push(...symbols);
      }

      if (missingSymbols.length > 0) {
        const historyFetches = missingSymbols.map(async (symbol) => {
          try {
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
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

            if (kv && entry.closes.length > 0) {
              const key = `cache:sparkline:${tf}:${symbol}`;
              try {
                await kv.put(key, JSON.stringify(entry), { expirationTtl: 300 });
              } catch {}
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

      if (kv) {
        const cachePromises = symbolsList.map(async (symbol) => {
          const key = `cache:price:${symbol}`;
          try {
            const cached = await kv.get(key);
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
            const price = meta.regularMarketPrice || 0;
            const prevClose = meta.chartPreviousClose || meta.previousClose || price;
            const change = price - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

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
            const lastPrice = lastPoint ? lastPoint.close : price;

            let prePrice = null;
            let postPrice = null;

            if (marketState === "PRE") {
              prePrice = lastPrice;
            } else if (marketState === "POST") {
              postPrice = lastPrice;
            } else if (marketState === "CLOSED") {
              if (ctp && ctp.post && lastPoint && lastPoint.ts >= ctp.post.start && lastPoint.ts <= ctp.post.end) {
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

            if (kv && entry.price > 0) {
              const key = `cache:price:${symbol}`;
              try {
                await kv.put(key, JSON.stringify(entry), { expirationTtl: 120 });
              } catch {}
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

      const cacheKey = `cache:history:${tf}:${symbol}`;
      if (kv) {
        try {
          const cached = await kv.get(cacheKey);
          if (cached) return new Response(cached, { status: 200, headers: corsHeaders });
        } catch {}
      }

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

      const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
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

      if (kv && candles.length > 0) {
        try {
          await kv.put(cacheKey, responseBody, { expirationTtl: 300 });
        } catch {}
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
