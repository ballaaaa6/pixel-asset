import { SYSTEM_PROMPT } from "./_scanValidators.js";

export async function callWorkersAIVision(ai, base64, mime) {
  let binaryString;
  try {
    binaryString = atob(base64);
  } catch (e) {
    throw new Error("Invalid base64 image data");
  }

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const imageBytes = Array.from(bytes);

  const primaryModel = "@cf/google/gemma-4-26b-a4b-it";
  const backupModel = "@cf/meta/llama-3.2-11b-vision-instruct";

  async function runModel(modelName, maxTokens) {
    if (modelName === "@cf/google/gemma-4-26b-a4b-it") {
      return await ai.run(modelName, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the transaction data from this receipt image. Your response MUST be ONLY a raw JSON object matching the schema, with no conversational filler or markdown blocks. Start directly with '{'." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
            ]
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.0,
        thinking: false,
        chat_template_kwargs: {
          enable_thinking: false
        },
        response_format: {
          type: "json_object"
        }
      });
    } else {
      return await ai.run(modelName, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Extract the transaction data from this receipt image. Your response MUST be ONLY a raw JSON object matching the schema, with no conversational filler or markdown blocks. Start directly with '{'." }
        ],
        image: imageBytes,
        max_tokens: maxTokens,
        temperature: 0.0,
        response_format: {
          type: "json_object"
        }
      });
    }
  }

  function parseTextResponse(res) {
    let resultText = "";
    if (typeof res === "string") {
      resultText = res;
    } else if (res && typeof res === "object") {
      if (Array.isArray(res.choices) && res.choices.length > 0) {
        const choice = res.choices[0];
        if (choice.message && typeof choice.message.content === "string") {
          resultText = choice.message.content;
        } else if (typeof choice.text === "string") {
          resultText = choice.text;
        }
      }
      
      if (!resultText) {
        if (typeof res.response === "string") {
          resultText = res.response;
        } else if (res.response && typeof res.response === "object") {
          resultText = res.response.text || JSON.stringify(res.response);
        } else if (typeof res.text === "string") {
          resultText = res.text;
        } else {
          resultText = JSON.stringify(res);
        }
      }
    }
    return resultText;
  }

  let response;
  let usedModel = primaryModel;
  let parsedJson = null;

  try {
    console.log(`Trying primary model: ${primaryModel}`);
    response = await runModel(primaryModel, 2048);
  } catch (err) {
    if (err.message && (err.message.includes("5016") || err.message.includes("license") || err.message.includes("agree") || err.message.includes("Acceptable Use Policy"))) {
      try {
        console.log(`Agreeing to terms for model: ${primaryModel}`);
        try {
          await ai.run(primaryModel, { prompt: "agree" });
        } catch (agreeErr) {
          if (!agreeErr.message.includes("Thank you for agreeing")) {
            throw agreeErr;
          }
        }
        await new Promise(r => setTimeout(r, 1200));
        response = await runModel(primaryModel, 2048);
      } catch (retryErr) {
        console.warn(`Primary model failed after license agreement: ${retryErr.message}. Falling back to backup.`);
        response = null;
      }
    } else {
      console.warn(`Primary model failed with error: ${err.message}. Falling back to backup.`);
      response = null;
    }
  }

  if (response) {
    try {
      const txt = parseTextResponse(response);
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        parsedJson = JSON.parse(match[0]);
        if (!parsedJson.bold_amount && !parsedJson.symbol && !parsedJson.actual_price) {
          console.warn("Primary model returned JSON but it doesn't match expected receipt schema fields. Falling back.");
          parsedJson = null;
        }
      }
    } catch (parseErr) {
      console.warn(`Failed to parse or validate JSON from primary model: ${parseErr.message}. Falling back.`);
      parsedJson = null;
    }
  }

  if (!parsedJson) {
    console.log(`Primary model failed or returned invalid data. Running backup model: ${backupModel}`);
    usedModel = backupModel;
    try {
      response = await runModel(backupModel, 512);
    } catch (err) {
      if (err.message && (err.message.includes("5016") || err.message.includes("license") || err.message.includes("agree") || err.message.includes("Acceptable Use Policy"))) {
        try {
          console.log(`Agreeing to terms for model: ${backupModel}`);
          try {
            await ai.run(backupModel, { prompt: "agree" });
          } catch (agreeErr) {
            if (!agreeErr.message.includes("Thank you for agreeing")) {
              throw agreeErr;
            }
          }
          await new Promise(r => setTimeout(r, 1200));
          response = await runModel(backupModel, 512);
        } catch (retryErr) {
          throw new Error(`Backup model run failed after license agreement: ${retryErr.message}`);
        }
      } else {
        throw new Error(`Backup model run failed: ${err.message}`);
      }
    }

    const txt = parseTextResponse(response);
    const match = txt.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Backup model did not return a valid JSON object block: ${txt.slice(0, 150)}`);
    }

    try {
      parsedJson = JSON.parse(match[0]);
    } catch (parseErr) {
      throw new Error(`Failed to parse extracted JSON from backup model text: ${parseErr.message}`);
    }
  }

  if (parsedJson) {
    parsedJson._debug_model = usedModel;
  }

  return parsedJson;
}

export function mergeLotIntoPortfolio(portfolio, slip) {
  const assetType = "stock";
  const { action, symbol, actual_price, share_amount, timestamp, broker } = slip;
  
  if (!portfolio.assets) portfolio.assets = {};
  if (!portfolio.assets[symbol]) {
    portfolio.assets[symbol] = {
      symbol,
      type: assetType,
      lots: [],
      clearedRealizedUSD: 0,
      clearedRealizedTHB: 0
    };
  }
  
  const asset = portfolio.assets[symbol];
  
  const lotId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const dateObj = new Date(timestamp || Date.now());
  const dateStr = dateObj.toISOString().split("T")[0];
  const timeStr = dateObj.toISOString().split("T")[1]?.slice(0, 5) || "12:00";
  
  const newLot = {
    id: lotId,
    type: action === "BUY" ? "buy" : "sell",
    qty: share_amount,
    price: actual_price,
    date: dateStr,
    time: timeStr,
    broker: broker || "Dime!"
  };
  
  asset.lots.push(newLot);
  asset.lots.sort((a, b) => {
    const da = new Date(`${a.date}T${a.time || "00:00"}`);
    const db = new Date(`${b.date}T${b.time || "00:00"}`);
    return da - db;
  });
  
  return portfolio;
}
