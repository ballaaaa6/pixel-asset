import { getYahooCookieAndCrumb } from "./_pricesBase.js";

async function googleTranslate(text, targetLang = "th") {
  if (!text) return "";
  try {
    // Capping at 4000 characters to avoid URL length constraints and Google limits
    const truncatedText = text.slice(0, 4000);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(truncatedText)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return text;
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(x => x[0]).join("");
    }
    return text;
  } catch (e) {
    console.error("googleTranslate error:", e);
    return text;
  }
}

async function myMemoryTranslate(text, targetLang = "th") {
  if (!text) return "";
  try {
    // Limit to 1000 characters for MyMemory free tier limit
    const truncatedText = text.slice(0, 1000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncatedText)}&langpair=en|${targetLang}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return text;
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      let translated = data.responseData.translatedText;
      // Post-process common financial term translation mistakes
      translated = translated
        .replace(/ซื้อน้ำจิ้ม/gi, "ซื้อช่วงย่อตัว (Buy the dip)")
        .replace(/น้ำจิ้ม/gi, "ช่วงย่อตัว (dip)");
      return translated;
    }
    return text;
  } catch (e) {
    console.error("myMemoryTranslate error:", e);
    return text;
  }
}

async function robustTranslate(text, targetLang = "th") {
  if (!text) return "";
  const googleResult = await googleTranslate(text, targetLang);
  // If googleTranslate failed and returned the original text, fallback to MyMemory
  if (googleResult === text) {
    console.log("Google Translate failed or was blocked, falling back to MyMemory...");
    return await myMemoryTranslate(text, targetLang);
  }
  return googleResult;
}

async function fetchArticleText(url, context) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5"
    };

    // Use Yahoo Finance auth cookies if scraping a Yahoo Finance URL to bypass consent redirect
    if (url.includes("yahoo.com") && context) {
      try {
        const yfAuth = await getYahooCookieAndCrumb(context);
        if (yfAuth && yfAuth.cookie) {
          headers["Cookie"] = yfAuth.cookie;
        }
      } catch (cookieErr) {
        console.error("Failed to get Yahoo cookie for scraper:", cookieErr);
      }
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: "follow"
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let paragraphs = [];
    let match;
    while ((match = pRegex.exec(html)) !== null) {
      let pText = match[1]
        .replace(/<[^>]*>/g, "") // strip HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      if (pText.length > 40) {
        // Filter out JSON-LD and inline JavaScript blocks
        if (pText.includes("{") || pText.includes("}") || pText.includes("@type") || pText.includes("@context")) {
          continue;
        }

        const lower = pText.toLowerCase();
        if (
          !lower.includes("cookie") &&
          !lower.includes("terms of service") &&
          !lower.includes("privacy policy") &&
          !lower.includes("all rights reserved") &&
          !lower.includes("subscribe to") &&
          !lower.includes("sign up") &&
          !lower.includes("copyright")
        ) {
          paragraphs.push(pText);
        }
      }
    }

    if (paragraphs.length === 0) return null;
    // Increase limit to 30 paragraphs to ensure longer articles are fetched completely
    return paragraphs.slice(0, 30).join("\n\n");
  } catch (e) {
    console.error("fetchArticleText error:", e);
    return null;
  }
}

export async function translateNews(headline, summary, newsUrl, context, corsHeaders) {
  try {
    const articleText = newsUrl ? await fetchArticleText(newsUrl, context) : null;
    const contentToTranslate = articleText || summary || headline;

    let result = {
      headline: headline,
      summary: summary || "",
      takeaways: []
    };

    let aiSuccess = false;

    if (context.env.AI) {
      const prompt = `You are a professional financial news translator and analyst.
Your task is to translate the financial news article content into Thai, and summarize it with 3-5 bulleted key takeaways.

Translate the headline to a compelling Thai headline.
Translate the provided Article Content (which might be the full article or a summary) to Thai, keeping the translation natural, detailed, and comprehensive without skipping major points.
Provide 3-5 bulleted key takeaways (in Thai) explaining why this news matters and its impact.

Format the output strictly as a JSON object (no markdown, no quotes around the JSON, just raw JSON) with this exact structure:
{
  "headline": "แปลหัวข้อข่าวภาษาไทย",
  "summary": "แปลเนื้อหาข่าวฉบับเต็มภาษาไทยอย่างละเอียดครบถ้วนทุกย่อหน้าหลัก",
  "takeaways": ["ประเด็นสำคัญที่ 1", "ประเด็นสำคัญที่ 2", "ประเด็นสำคัญที่ 3"]
}

Headline: ${headline}
Article Content:
${contentToTranslate}`;

      try {
        const aiRes = await context.env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [{ role: "user", content: prompt }]
        });

        if (aiRes && aiRes.response) {
          try {
            let text = aiRes.response.trim();
            const firstBrace = text.indexOf("{");
            const lastBrace = text.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
              text = text.substring(firstBrace, lastBrace + 1);
            }
            const parsed = JSON.parse(text);
            result.headline = parsed.headline || headline;
            result.summary = parsed.summary || summary || "";
            result.takeaways = parsed.takeaways || [];
            aiSuccess = true;
          } catch (jsonErr) {
            console.error("AI response JSON parse error:", jsonErr);
          }
        }
      } catch (aiErr) {
        console.error("Cloudflare AI run failed:", aiErr);
      }
    }

    // Graceful fallback to the fast, robust translation chain if AI fails, throws, or is not configured
    if (!aiSuccess) {
      result.headline = await robustTranslate(headline);
      result.summary = await robustTranslate(contentToTranslate);
      result.takeaways = [
        "แปลด้วยระบบแปลภาษาสำรองอัตโนมัติ เนื่องจากระบบ Cloudflare AI ปิดอยู่หรือขัดข้องชั่วคราว",
        "รายละเอียดเนื้อหาข่าวและข้อความได้รับการแปลเป็นภาษาไทยเรียบร้อยแล้ว"
      ];
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
      try {
        const aiRes = await context.env.AI.run("@cf/meta/m2m100-1.2b", {
          text: text,
          source_lang: "english",
          target_lang: "thai"
        });
        if (aiRes && aiRes.translated_text) {
          translatedText = aiRes.translated_text;
        } else {
          translatedText = await robustTranslate(text);
        }
      } catch (aiErr) {
        translatedText = await robustTranslate(text);
      }
    } else {
      translatedText = await robustTranslate(text);
    }
    return new Response(JSON.stringify({ translatedText }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Translation error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
