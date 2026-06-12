import { validateSlipData } from "./_scanValidators.js";
import { callWorkersAIVision, mergeLotIntoPortfolio } from "./_scanModel.js";

// ─── CORS headers ────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type":                 "application/json",
};

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const auth = request.headers.get("Authorization") || "";
    const userId = auth.replace("Bearer ", "").trim();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await request.json();
    const { images, skipSave } = body;

    const hasWorkersAI = !!env.AI;
    if (!hasWorkersAI) {
      return new Response(
        JSON.stringify({ error: "Cloudflare Workers AI binding [env.AI] is missing in this project" }),
        { status: 500, headers: CORS }
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "images array is required and must not be empty" }),
        { status: 400, headers: CORS }
      );
    }
    if (images.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 images per request" }),
        { status: 400, headers: CORS }
      );
    }

    // ── Load existing portfolio from KV ───────────────────────────────────────
    const PORTFOLIOS = env.PORTFOLIOS;
    let portfolio = [];
    try {
      const raw = await PORTFOLIOS.get(`portfolio:${userId}`);
      if (raw) portfolio = JSON.parse(raw);
      if (!Array.isArray(portfolio)) portfolio = [];
    } catch {
      portfolio = [];
    }

    // ── Process each image via Workers AI ─────────────────────────────────────
    const results = [];
    const errors  = [];

    for (let i = 0; i < images.length; i++) {
      const { base64, mime } = images[i];
      if (!base64 || !mime) {
        errors.push({ index: i, error: "Missing base64 or mime for image" });
        continue;
      }

      try {
        const parsed = await callWorkersAIVision(env.AI, base64, mime);
        if (!parsed) {
          throw new Error("Failed to extract data using Workers AI.");
        }

        const validated = validateSlipData(parsed);
        if (!validated) {
          throw new Error(
            `Extracted data is incomplete or invalid: ${JSON.stringify(parsed).slice(0, 120)}`
          );
        }

        // Merge into portfolio if not skipping save
        if (!skipSave) {
          portfolio = mergeLotIntoPortfolio(portfolio, validated);
        }

        results.push({ index: i, ...validated, raw_ai: parsed, saved: !skipSave, engine: "Cloudflare Workers AI" });

      } catch (imgErr) {
        errors.push({ index: i, error: imgErr.message });
      }
    }

    // ── Persist updated portfolio to KV ───────────────────────────────────────
    if (results.length > 0 && !skipSave) {
      await PORTFOLIOS.put(`portfolio:${userId}`, JSON.stringify(portfolio));
    }

    return new Response(
      JSON.stringify({ results, errors }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: CORS }
    );
  }
}

// ─── CORS preflight ───────────────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
