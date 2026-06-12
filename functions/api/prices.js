import { searchSymbols, fetchSparklines } from "./_pricesSearch.js";
import { fetchLivePrices, fetchDetailedAssetHistory } from "./_pricesLive.js";
import { fetchDetailedAsset, translateNews, translateText } from "./_pricesDetails.js";

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const symbolsParam = url.searchParams.get("symbols");
  const sparklineParam = url.searchParams.get("sparkline");
  const dividendsParam = url.searchParams.get("dividends");
  const isDividends = dividendsParam === "true";
  const noCache = url.searchParams.get("nocache") === "true";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // 1. Autocomplete Search (?q=)
  if (q) {
    return searchSymbols(q, context, corsHeaders);
  }

  // 2. Sparkline History (?sparkline=SYM1,SYM2&tf=1M)
  if (sparklineParam) {
    const tf = (url.searchParams.get("tf") || "1M").toUpperCase();
    return fetchSparklines(sparklineParam, tf, context, corsHeaders);
  }

  // 3. Live Prices (?symbols=)
  if (symbolsParam) {
    return fetchLivePrices(symbolsParam, isDividends, noCache, context, corsHeaders);
  }

  // 4. Detailed Asset History (?history=SYM&tf=1D|5D|1M|3M|6M|1Y)
  const historyParam = url.searchParams.get("history");
  if (historyParam) {
    const tf = (url.searchParams.get("tf") || "1M").toUpperCase();
    return fetchDetailedAssetHistory(historyParam, tf, context, corsHeaders);
  }

  // 5. Detailed Stock Fundamentals (?details=SYM)
  const detailsParam = url.searchParams.get("details");
  if (detailsParam) {
    const tf = (url.searchParams.get("tf") || "1Y").toUpperCase();
    return fetchDetailedAsset(detailsParam, tf, context, corsHeaders);
  }

  // 6. On-Demand News Translation and Bullet Takeaway Summary (?translateNews=true)
  const translateNewsParam = url.searchParams.get("translateNews");
  if (translateNewsParam && context.env.AI) {
    const headline = url.searchParams.get("headline") || "";
    const summary = url.searchParams.get("summary") || "";
    return translateNews(headline, summary, context, corsHeaders);
  }

  // 7. On-Demand Text Translation (?translate=TEXT)
  const translateParam = url.searchParams.get("translate");
  if (translateParam) {
    return translateText(translateParam, context, corsHeaders);
  }

  return new Response(
    JSON.stringify({ error: "ระบุพารามิเตอร์ ?symbols= หรือ ?q= หรือ ?sparkline= หรือ ?history= หรือ ?details= หรือ ?translate=" }), 
    { status: 400, headers: corsHeaders }
  );
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
