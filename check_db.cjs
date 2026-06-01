const fs = require('fs');
const path = require('path');

const dir = path.join('D:', 'antigravity', 'us stock tracker', '.wrangler', 'state', 'v3', 'kv', 'miniflare-KVNamespaceObject');
const files = fs.readdirSync(dir);
const sqliteFile = files.find(f => f.endsWith('.sqlite'));

if (sqliteFile) {
  const filePath = path.join(dir, sqliteFile);
  console.log('Found SQLite file:', filePath);
  
  let loaded = false;
  const pathsToTry = [
    'better-sqlite3',
    path.join('D:', 'antigravity', 'us stock tracker', 'node_modules', 'better-sqlite3'),
    path.join('D:', 'antigravity', 'us stock tracker', 'node_modules', 'wrangler', 'node_modules', 'better-sqlite3')
  ];

  for (const p of pathsToTry) {
    try {
      const Database = require(p);
      const db = new Database(filePath);
      const rows = db.prepare("SELECT * FROM kvs").all();
      console.log('KVS Rows count:', rows.length);
      rows.forEach(r => {
        console.log(`Key: ${r.key}`);
        try {
          const val = JSON.parse(r.value.toString());
          console.log('Value:', JSON.stringify(val, null, 2));
        } catch {
          console.log('Value (raw):', r.value.toString().slice(0, 100));
        }
      });
      loaded = true;
      break;
    } catch (err) {
      console.log(`Failed path ${p}:`, err.message);
    }
  }
  if (!loaded) {
    console.error('Failed to load any SQLite library');
  }
} else {
  console.log('No SQLite file found!');
}
