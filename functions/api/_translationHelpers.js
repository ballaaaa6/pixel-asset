async function googleTranslate(text, targetLang = "th") {
  if (!text) return "";
  try {
    // Capping at 4500 characters to fit Google's translation limits
    const truncatedText = text.slice(0, 4500);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    // Using POST to bypass URL length limits (414 Request-URI Too Long)
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: `q=${encodeURIComponent(truncatedText)}`,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return text;
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(x => x[0]).join("");
    }
    return text;
  } catch (e) {
    console.error("googleTranslate POST error:", e);
    return text;
  }
}

async function myMemoryTranslate(text, targetLang = "th") {
  if (!text) return "";
  try {
    // MyMemory limits single query to 500 characters. 
    // We split it into 400-character chunks to completely avoid the 500-char error.
    const chunkSize = 400;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    
    const translatedChunks = [];
    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|${targetLang}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        translatedChunks.push(chunk);
        continue;
      }
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        let translated = data.responseData.translatedText;
        // Post-process common financial term translation mistakes
        translated = translated
          .replace(/ซื้อน้ำจิ้ม/gi, "ซื้อช่วงย่อตัว (Buy the dip)")
          .replace(/น้ำจิ้ม/gi, "ช่วงย่อตัว (dip)");
        translatedChunks.push(translated);
      } else {
        translatedChunks.push(chunk);
      }
    }
    return translatedChunks.join("");
  } catch (e) {
    console.error("myMemoryTranslate error:", e);
    return text;
  }
}

export async function robustTranslate(text, targetLang = "th") {
  if (!text) return "";
  const googleResult = await googleTranslate(text, targetLang);
  // If googleTranslate failed and returned the original text, fallback to MyMemory chunked
  if (googleResult === text) {
    console.log("Google Translate failed or was blocked, falling back to MyMemory...");
    return await myMemoryTranslate(text, targetLang);
  }
  return googleResult;
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
        translatedText = aiRes?.translated_text || await robustTranslate(text);
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
