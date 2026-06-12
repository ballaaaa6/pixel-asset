import { THAI_STOCKS } from "./thaiStocks.js";

const STATIC_THAI_PROFILES = {
  "SCB.BK": {
    name: "SCB X Public Company Limited (SCB)",
    finnhubIndustry: "Financial Services",
    country: "Thailand",
    weburl: "https://www.scbx.com",
    ceo: "Mr. Arthid Nanthawithaya",
    longBusinessSummary: "SCB X Public Company Limited (SCBX) เป็นบริษัทโฮลดิ้งด้านเทคโนโลยีทางการเงินชั้นนำในประเทศไทย ดำเนินธุรกิจธนาคารพาณิชย์ (ธนาคารไทยพาณิชย์) ธุรกิจสินเชื่อเพื่อผู้บริโภค และธุรกิจแพลตฟอร์มเทคโนโลยีการเงินดิจิทัลระดับภูมิภาค"
  },
  "PTT.BK": {
    name: "PTT Public Company Limited (PTT)",
    finnhubIndustry: "Energy",
    country: "Thailand",
    weburl: "https://www.pttplc.com",
    ceo: "Mr. Kongkrapan Intarajang",
    longBusinessSummary: "บริษัท ปตท. จำกัด (มหาชน) ดำเนินธุรกิจพลังงานและปิโตรเคมีครบวงจรของประเทศไทย โดยครอบคลุมธุรกิจก๊าซธรรมชาติ การจัดหาและจัดจำหน่ายน้ำมันเชื้อเพลิง ปิโตรเคมีและการกลั่น ตลอดจนการลงทุนในพลังงานหมุนเวียนและเทคโนโลยีใหม่"
  },
  "KBANK.BK": {
    name: "Kasikornbank Public Company Limited (KBANK)",
    finnhubIndustry: "Financial Services",
    country: "Thailand",
    weburl: "https://www.kasikornbank.com",
    ceo: "Ms. Kattiya Indaravijaya",
    longBusinessSummary: "ธนาคารกสิกรไทย จำกัด (มหาชน) ผู้ให้บริการทางการเงินชั้นนำของประเทศไทย ให้บริการธนาคารพาณิชย์ ธนาคารดิจิทัล สินเชื่อเพื่อรายย่อยและภาคธุรกิจ ตลอดจนธุรกิจการจัดการกองทุนและบริการหลักทรัพย์ระดับสากล"
  },
  "CPALL.BK": {
    name: "CP ALL Public Company Limited (CPALL)",
    finnhubIndustry: "Retail",
    country: "Thailand",
    weburl: "https://www.cpall.co.th",
    ceo: "Mr. Yuthasak Poomsurakul",
    longBusinessSummary: "บริษัท ซีพี ออลล์ จำกัด (มหาชน) ผู้บริหารร้านอิ่มสะดวก 7-Eleven ในประเทศไทย และเป็นผู้ถือหุ้นใหญ่ในธุรกิจค้าส่งค้าปลีกสากล (Makro และ Lotus's) ดำเนินธุรกิจค้าปลีกสินค้าอุปโภคบริโภคและบริการชำระเงินดิจิทัลครบวงจร"
  },
  "AOT.BK": {
    name: "Airports of Thailand Public Company Limited (AOT)",
    finnhubIndustry: "Transportation",
    country: "Thailand",
    weburl: "https://www.airportthai.co.th",
    ceo: "Mr. Kirati Kijmanawat",
    longBusinessSummary: "บริษัท ท่าอากาศยานไทย จำกัด (มหาชน) เป็นผู้บริหารท่าอากาศยานนานาชาติหลัก 6 แห่งของประเทศไทย รวมถึงท่าอากาศยานสุวรรณภูมิและดอนเมือง ให้บริการและบริหารงานท่าอากาศยานและบริการขนส่งทางอากาศเชิงพาณิชย์"
  },
  "DELTA.BK": {
    name: "Delta Electronics (Thailand) Public Company Limited (DELTA)",
    finnhubIndustry: "Technology",
    country: "Thailand",
    weburl: "https://www.deltathailand.com",
    ceo: "Mr. Victor Cheng",
    longBusinessSummary: "บริษัท เดลต้า อีเลคโทรนิคส์ (ประเทศไทย) จำกัด (มหาชน) ผู้ผลิตชิ้นส่วนอิเล็กทรอนิกส์ พัดลมระบายความร้อน ระบบการจัดการพลังงาน และผลิตภัณฑ์การจัดการความร้อนชั้นนำระดับโลก รวมถึงโซลูชันสำหรับยานยนต์ไฟฟ้า (EV)"
  },
  "BDMS.BK": {
    name: "Bangkok Dusit Medical Services Public Company Limited (BDMS)",
    finnhubIndustry: "Healthcare",
    country: "Thailand",
    weburl: "https://www.bdms.co.th",
    ceo: "Ms. Poramaporn Prasarttong-Osoth",
    longBusinessSummary: "บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน) ผู้ดำเนินการเครือข่ายโรงพยาบาลเอกชนชั้นนำและใหญ่ที่สุดในประเทศไทย ดำเนินการโรงพยาบาลกรุงเทพ โรงพยาบาลสมิติเวช โรงพยาบาลพญาไท โรงพยาบาลเปาโล โรงพยาบาลบีเอ็นเอช และคลินิกการแพทย์ทั่วประเทศ"
  },
  "ADVANC.BK": {
    name: "Advanced Info Service Public Company Limited (ADVANC)",
    finnhubIndustry: "Telecommunications",
    country: "Thailand",
    weburl: "https://www.ais.th",
    ceo: "Mr. Somchai Lertsutiwong",
    longBusinessSummary: "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน) หรือ เอไอเอส (AIS) ผู้ให้บริการเครือข่ายโทรศัพท์เคลื่อนที่และอินเทอร์เน็ตความเร็วสูง (AIS Fibre) อันดับหนึ่งของประเทศไทย ครอบคลุมบริการสื่อสารโทรคมนาคมดิจิทัลและคลาวด์เทคโนโลยี"
  }
};

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
};

function extractChartPriceInfo(symbol, result, now) {
  if (!result) return null;
  const meta = result.meta || {};
  const rawPrice = meta.regularMarketPrice || 0;
  const prevClose = meta.chartPreviousClose || meta.previousClose || rawPrice;

  let marketState = "REGULAR";
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

  const price = rawPrice;
  const change = price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  let prePrice = null;
  let postPrice = null;

  const isBK = symbol.toUpperCase().endsWith(".BK");
  const hasPrePost = meta.hasPrePostMarketData || false;

  if (lastPoint && hasPrePost && !isBK) {
    const localTime = new Date((lastPoint.ts + (meta.gmtoffset || 0)) * 1000);
    const hour = localTime.getUTCHours();
    const minute = localTime.getUTCMinutes();
    const timeInMinutes = hour * 60 + minute;

    if (timeInMinutes < 570) {
      prePrice = lastPrice;
    } else if (timeInMinutes >= 960) {
      postPrice = lastPrice;
    }
  }

  return {
    symbol,
    price,
    change,
    changePercent,
    previousClose: prevClose,
    currency: meta.currency || "USD",
    marketState,
    prePrice,
    preChangePercent: prePrice && prevClose ? ((prePrice - prevClose) / prevClose) * 100 : null,
    postPrice,
    postChangePercent: postPrice && price ? ((postPrice - price) / price) * 100 : null
  };
}

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

            const parsed = extractChartPriceInfo(symbol, result, Math.floor(Date.now() / 1000));
            if (!parsed) return null;

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
              ...parsed,
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

      // Check cache for live price first to avoid duplicate fetch
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

      // Fetch Yahoo Finance quote summary for company description, officers, and fundamental key statistics
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
              // Thai/Global friendly executive title search (MD, MDs, CEO, President, กรรมการผู้จัดการ)
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

      // Fetch Finnhub data
      const token = "d8e3e4hr01qm5ffvbi4gd8e3e4hr01qm5ffvbi50";
      const toDate = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [profileRes, metricsRes, newsRes, earningsRes, calendarRes, historyRes, liveChartRes] = await Promise.all([
        safeFetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`),
        safeFetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${token}`),
        safeFetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${token}`),
        safeFetch(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${token}`),
        safeFetch(`https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&from=${toDate}&to=${oneYearLater}&token=${token}`),
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
              const liveCacheKey = `https://cache.local/price/${symbol}`;
              putCache(context, liveCacheKey, JSON.stringify(livePriceInfo), 30);
            }
          }
        } catch (e) {
          console.error("Failed to parse live chart in details:", e);
        }
      }

      // If Finnhub profile is empty or missing name/exchange, merge from Yahoo Finance
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

      // Static Registry Fallback for Thai Stocks (especially if Yahoo blocks us)
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

        // YoY returns and growth rates to avoid blanks
        metrics.metric.revenueGrowthYoY = finData.revenueGrowth?.raw != null ? finData.revenueGrowth.raw * 100 : null;
        metrics.metric.earningsGrowthYoY = finData.earningsGrowth?.raw != null ? finData.earningsGrowth.raw * 100 : null;
        metrics.metric.priceReturn1Y = keyStats.fiftyTwoWeekChange?.raw != null ? keyStats.fiftyTwoWeekChange.raw * 100 : null;
      }

      // Calculate trailing price returns if history is available
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

      // Populate basic metrics from chart if missing (highly useful if quoteSummary fails)
      if (livePriceInfo) {
        const activePrice = livePriceInfo.postPrice || livePriceInfo.prePrice || livePriceInfo.price;
        metrics.metric.currentPrice = activePrice;
      } else {
        metrics.metric.currentPrice = metrics.metric.currentPrice || chartCurrentPrice || null;
      }
      metrics.metric["52WeekHigh"] = metrics.metric["52WeekHigh"] || chart52WHigh || null;
      metrics.metric["52WeekLow"] = metrics.metric["52WeekLow"] || chart52WLow || null;
      metrics.metric["50DayAverage"] = metrics.metric["50DayAverage"] || chart50DayAvg || null;
      metrics.metric["200DayAverage"] = metrics.metric["200DayAverage"] || chart200DayAvg || null;

      // Align Finnhub metric fields with the new keys to guarantee presence
      metrics.metric.peTrailing = metrics.metric.peTrailing || metrics.metric.peBasicExclExtraTTM || metrics.metric.peExclExtraTTM || metrics.metric.peNormalized || null;
      metrics.metric.pbCurrent = metrics.metric.pbCurrent || metrics.metric.pbQuarterly || metrics.metric.pbAnnual || null;
      metrics.metric.psTrailing = metrics.metric.psTrailing || metrics.metric.psTTM || null;
      metrics.metric.revenueGrowthYoY = metrics.metric.revenueGrowthYoY || metrics.metric.revenueGrowthQuarterlyYoy || null;
      metrics.metric.earningsGrowthYoY = metrics.metric.earningsGrowthYoY || metrics.metric.epsGrowthQuarterlyYoy || null;
      metrics.metric.priceReturn1Y = return1Y !== null ? return1Y : (metrics.metric.priceReturn1Y || metrics.metric["52WeekPriceReturnDaily"] || null);

      metrics.metric.priceReturn1W = return1W !== null ? return1W : (metrics.metric["5DayPriceReturnDaily"] || null);
      metrics.metric.priceReturn1M = return1M !== null ? return1M : null;
      metrics.metric.priceReturn3M = return3M !== null ? return3M : (metrics.metric["13WeekPriceReturnDaily"] || null);

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

      // Map Yahoo Finance quarterly financials (revenue, net income) onto earnings
      const yfIncomeHistory = yfSummary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
      const parseDate = (dStr) => {
        try { return new Date(dStr).getTime(); } catch { return 0; }
      };

      // If Finnhub earnings is empty, merge from Yahoo Finance
      if (!earnings || earnings.length === 0) {
        const yfEarnings = yfSummary?.earnings?.earningsChart?.quarterly || [];
        earnings = yfEarnings.map((e, idx) => {
          const match = e.date?.match(/(\d)Q(\d{4})/);
          const quarter = match ? parseInt(match[1]) : 0;
          const year = match ? parseInt(match[2]) : 0;
          const actual = e.actual?.raw ?? e.actual ?? null;
          const estimate = e.estimate?.raw ?? e.estimate ?? null;
          const surprise = (actual != null && estimate != null) ? (actual - estimate) : null;
          const surprisePercent = (surprise != null && estimate !== 0 && estimate != null) ? (surprise / Math.abs(estimate)) * 100 : 0;
          
          let revenue = null;
          let netIncome = null;
          let periodStr = e.date;
          
          const yfInc = yfIncomeHistory[yfIncomeHistory.length - 1 - idx];
          if (yfInc) {
            revenue = yfInc.totalRevenue?.raw || null;
            netIncome = yfInc.netIncome?.raw || null;
            if (yfInc.endDate?.raw) {
              periodStr = new Date(yfInc.endDate.raw * 1000).toISOString().slice(0, 10);
            }
          }
          
          return {
            quarter,
            year,
            period: periodStr,
            actual,
            estimate,
            surprise,
            surprisePercent,
            revenue,
            netIncome
          };
        }).reverse(); // Latest first
      } else {
        // Otherwise, map yfIncomeHistory and financialsChart onto Finnhub earnings by close matching dates or quarter name
        earnings = earnings.map(e => {
          const eTime = parseDate(e.period);
          let bestMatch = null;
          let minDiff = Infinity;
          yfIncomeHistory.forEach(item => {
            const itemTime = (item.endDate?.raw) ? (item.endDate.raw * 1000) : 0;
            const diff = Math.abs(eTime - itemTime);
            if (diff < 15 * 24 * 60 * 60 * 1000 && diff < minDiff) {
              minDiff = diff;
              bestMatch = item;
            }
          });

          let revenue = bestMatch?.totalRevenue?.raw || null;
          let netIncome = bestMatch?.netIncome?.raw || null;

          // Fallback to earnings financialsChart
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

          return {
            ...e,
            revenue,
            netIncome
          };
        });
      }

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
        earnings: Array.isArray(earnings) ? earnings.slice(0, 8) : [],
        calendar: calendar?.earningsCalendar || []
      };

      const responseBody = JSON.stringify(result);
      putCache(context, cacheKey, responseBody, 86400); // Cache for 1 day

      return new Response(responseBody, { status: 200, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Details error: " + err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // ─── 6. On-Demand News Translation and Bullet Takeaway Summary (?translateNews=true) ──────
  const translateNewsParam = url.searchParams.get("translateNews");
  if (translateNewsParam && context.env.AI) {
    try {
      const headline = url.searchParams.get("headline") || "";
      const summary = url.searchParams.get("summary") || "";
      
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

  // ─── 7. On-Demand Text Translation (?translate=TEXT) ──────────────────
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

async function getYahooCookieAndCrumb(context) {
  const cacheKey = "https://cache.local/yahoo-auth";
  const cached = await getCache(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.cookie && parsed.crumb) {
        return parsed;
      }
    } catch {}
  }

  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  try {
    const fcResponse = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": userAgent }
    });
    const cookie = fcResponse.headers.get("set-cookie");
    if (!cookie) throw new Error("No cookie returned from fc.yahoo.com");

    const crumbResponse = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        "User-Agent": userAgent,
        "Cookie": cookie
      }
    });
    if (!crumbResponse.ok) throw new Error("Failed to get crumb: " + crumbResponse.status);
    const crumb = await crumbResponse.text();
    if (!crumb) throw new Error("Empty crumb returned");

    const authData = { cookie, crumb };
    // Cache for 1 day
    putCache(context, cacheKey, JSON.stringify(authData), 86400);
    return authData;
  } catch (err) {
    console.error("Yahoo auth handshake failed:", err);
    return { cookie: "", crumb: "" };
  }
}
