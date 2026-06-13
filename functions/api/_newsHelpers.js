import { getYahooCookieAndCrumb } from "./_pricesBase.js";

function isAttributionParagraph(text) {
  const lower = text.toLowerCase();
  const isAuthorSignature = 
    lower.includes("motley fool") || 
    lower.includes("reuters") || 
    lower.includes("bloomberg") || 
    lower.includes("investorplace") || 
    lower.includes("associated press") ||
    lower.includes("yahoo finance") ||
    lower.includes("ap news");

  const hasTimeOrDate = 
    lower.includes("at ") || 
    lower.includes("pm") || 
    lower.includes("am") || 
    lower.includes("time") || 
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(lower) ||
    /\d{1,2}:\d{2}/.test(lower) ||
    /\d{4}\b/.test(lower); // has year

  return isAuthorSignature && hasTimeOrDate;
}

async function fetchArticleText(url, context, uuid = "") {
  if (!url && !uuid) return null;

  if (!uuid && url) {
    const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch) {
      uuid = uuidMatch[1];
    }
  }

  if (uuid) {
    try {
      const caasUrl = `https://finance.yahoo.com/caas/content/article/?uuid=${uuid}&appid=article2_csn`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(caasUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const item = json?.items?.[0];
        const markup = item?.markup || "";
        if (markup) {
          const elementRegex = /<(p|h2|h3|h4|li)[^>]*>([\s\S]*?)<\/\1>/gi;
          let paragraphs = [];
          let match;
          while ((match = elementRegex.exec(markup)) !== null) {
            const tag = match[1].toLowerCase();
            let rawText = match[2];
            let pText = rawText
              .replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\s+/g, " ")
              .trim();

            if (pText.length > 10) {
              if (pText.includes("{") || pText.includes("}") || pText.includes("@type") || pText.includes("@context")) {
                continue;
              }

              const lower = pText.toLowerCase();
              if (
                lower.includes("terms of service") ||
                lower.includes("privacy policy") ||
                lower.includes("all rights reserved") ||
                lower.includes("subscribe to") ||
                lower.includes("sign up") ||
                lower.includes("copyright") ||
                isAttributionParagraph(pText)
              ) {
                continue;
              }

              if (tag.startsWith("h")) {
                paragraphs.push(`**${pText}**`);
              } else if (tag === "li") {
                paragraphs.push(`• ${pText}`);
              } else {
                paragraphs.push(pText);
              }
            }
          }
          if (paragraphs.length > 0) {
            return paragraphs.slice(0, 30).join("\n\n").replace(/\n{3,}/g, "\n\n");
          }
        }
      }
    } catch (e) {
      console.error("Yahoo CaaS API fetch failed:", e);
    }
  }

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
    
    let html = await res.text();

    // Target the main article body container by cropping the HTML
    let articleHtml = html;
    let startIndex = -1;
    const startSelectors = [
      'class="article-body"',
      'class="article-content"',
      'class="caas-body"',
      'class="canvas-body"',
      'itemprop="articleBody"',
      '<article'
    ];
    for (const selector of startSelectors) {
      const idx = html.indexOf(selector);
      if (idx !== -1) {
        startIndex = idx;
        break;
      }
    }

    if (startIndex !== -1) {
      let endIndex = html.length;
      const endSelectors = [
        'id="caas-feedback"',
        'class="caas-dnd-sidebar"',
        'class="caas-footer"',
        '<footer',
        'id="consent-iframe"'
      ];
      for (const selector of endSelectors) {
        const idx = html.indexOf(selector, startIndex);
        if (idx !== -1 && idx < endIndex) {
          endIndex = idx;
        }
      }
      articleHtml = html.substring(startIndex, endIndex);
    }

    // Extract elements sequentially: paragraphs, headings, list items
    const elementRegex = /<(p|h2|h3|h4|li)[^>]*>([\s\S]*?)<\/\1>/gi;
    let paragraphs = [];
    let match;
    while ((match = elementRegex.exec(articleHtml)) !== null) {
      const tag = match[1].toLowerCase();
      let rawText = match[2];
      
      let pText = rawText
        .replace(/<[^>]*>/g, "") // strip inner HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      if (pText.length > 10) {
        if (pText.includes("{") || pText.includes("}") || pText.includes("@type") || pText.includes("@context")) {
          continue;
        }

        const lower = pText.toLowerCase();
        if (
          lower.includes("terms of service") ||
          lower.includes("privacy policy") ||
          lower.includes("all rights reserved") ||
          lower.includes("subscribe to") ||
          lower.includes("sign up") ||
          lower.includes("copyright") ||
          isAttributionParagraph(pText)
        ) {
          continue;
        }

        if (tag.startsWith("h")) {
          paragraphs.push(`**${pText}**`);
        } else if (tag === "li") {
          paragraphs.push(`• ${pText}`);
        } else {
          paragraphs.push(pText);
        }
      }
    }

    if (paragraphs.length === 0) return null;
    return paragraphs.slice(0, 30).join("\n\n").replace(/\n{3,}/g, "\n\n");
  } catch (err) {
    console.error("Error fetching article text:", err);
    return null;
  }
}

export async function translateNews(headline, summary, newsUrl, context, corsHeaders, uuid = "") {
  try {
    const articleText = await fetchArticleText(newsUrl, context, uuid);
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

    // Graceful fallback: return English content immediately if AI fails or is not configured
    if (!aiSuccess) {
      result.headline = headline;
      result.summary = contentToTranslate;
      result.takeaways = [];
      result.isEnglish = true;
    }

    return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

