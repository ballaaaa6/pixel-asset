import { THAI_STOCKS } from "./thaiStocks.js";
import { YF_HEADERS, getCache, putCache } from "./_pricesBase.js";

export async function searchSymbols(q, context, corsHeaders) {
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
      results = localMatches;
    } else {
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
        
        const seen = new Set();
        results = [...localMatches, ...yfResults].filter(item => {
          const symKey = item.symbol.toUpperCase();
          if (seen.has(symKey)) return false;
          seen.add(symKey);
          return true;
        });
      } else {
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

export async function fetchSparklines(sparklineParam, tf, context, corsHeaders) {
  try {
    const symbols = sparklineParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

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
