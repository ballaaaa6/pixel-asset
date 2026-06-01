const fs = require('fs');
const path = require('path');

const dir = path.join('D:', 'antigravity', 'us stock tracker', '.wrangler', 'state', 'v3', 'kv', 'miniflare-KVNamespaceObject');
const files = fs.readdirSync(dir);
const sqliteFile = files.find(f => f.endsWith('.sqlite'));

if (sqliteFile) {
  const filePath = path.join(dir, sqliteFile);
  console.log('Reading SQLite file buffer:', filePath);
  
  const buf = fs.readFileSync(filePath);
  const text = buf.toString('utf-8');
  
  let index = 0;
  while (true) {
    const pos = text.toUpperCase().indexOf('SNDK', index);
    if (pos === -1) break;
    
    console.log(`\n===========================================`);
    console.log(`Found "SNDK" at position ${pos}`);
    
    const startPos = Math.max(0, pos - 200);
    const endPos = Math.min(buf.length, pos + 1000);
    const subBuf = buf.slice(startPos, endPos);
    
    let cleaned = '';
    for (let i = 0; i < subBuf.length; i++) {
      const charCode = subBuf[i];
      if (charCode >= 32 && charCode <= 126) {
        cleaned += String.fromCharCode(charCode);
      } else if (charCode === 10 || charCode === 13 || charCode === 9) {
        cleaned += String.fromCharCode(charCode);
      } else {
        cleaned += '.';
      }
    }
    
    console.log('Printable context:');
    console.log(cleaned);
    
    index = pos + 10;
  }
} else {
  console.log('No SQLite database file found.');
}
