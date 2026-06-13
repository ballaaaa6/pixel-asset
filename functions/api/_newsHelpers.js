async function fetchArticleText(url) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
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
    return paragraphs.slice(0, 12).join("\n\n");
  } catch (e) {
    console.error("fetchArticleText error:", e);
    return null;
  }
}

export async function translateNews(headline, summary, newsUrl, context, corsHeaders) {
  try {
    const articleText = newsUrl ? await fetchArticleText(newsUrl) : null;
    const contentToTranslate = articleText || summary || headline;

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

    let result = {
      headline: headline,
      summary: summary || "",
      takeaways: []
    };

    if (context.env.AI) {
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
        } catch (jsonErr) {
          console.error("AI response JSON parse error:", jsonErr, "Response was:", aiRes.response);
          // Simple fallback
          result.headline = "แปล: " + headline;
          result.summary = "แปล: " + (summary || "");
        }
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
