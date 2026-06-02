import fs from 'fs';
import path from 'path';
import { ocrReceiptFile } from './src/utils/ocrParser.js';

async function run() {
  const brainDir = "C:\\Users\\WINDOW XI\\.gemini\\antigravity\\brain\\d3b21038-fd97-41c4-9371-3a9aed2b3d55";
  const files = [
    "media__1780422128171.jpg", // BUY MAGS
    "media__1780422128173.jpg", // SELL MAGS
  ];

  for (const f of files) {
    const p = path.join(brainDir, f);
    if (!fs.existsSync(p)) {
      console.log(`File not found: ${p}`);
      continue;
    }
    console.log(`\n========================================\nProcessing: ${f}\n========================================`);
    const result = await ocrReceiptFile(p, (stage) => console.log(`Stage: ${stage}`));
    console.log("--- PARSED RESULT ---");
    console.log(JSON.stringify(result, null, 2));
    console.log("========================================\n");
  }
}

run().catch(console.error);
