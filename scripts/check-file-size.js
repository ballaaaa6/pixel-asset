#!/usr/bin/env node
/**
 * check-file-size.js
 * Pre-build guard: fails the build if any .jsx/.js source file exceeds MAX_LINES.
 * Usage: node scripts/check-file-size.js [maxLines]
 * Integrated via package.json "prebuild" script.
 */

import { readdirSync, statSync, readFileSync } from "fs";
import { join, extname, relative } from "path";

const MAX_LINES = parseInt(process.argv[2] || "400", 10);
const ROOT = join(process.cwd(), "src");

// Directories to skip
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

// Files explicitly allowed to exceed limit (index.css is expected to be large)
const ALLOWLIST = new Set(["index.css"]);

/**
 * Recursively collect all .jsx/.js files under a directory.
 */
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      const ext = extname(entry);
      if ((ext === ".jsx" || ext === ".js") && !ALLOWLIST.has(entry)) {
        results.push(full);
      }
    }
  }
  return results;
}

const files = collectFiles(ROOT);
const violations = [];

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n").length;
  if (lines > MAX_LINES) {
    violations.push({ file: relative(process.cwd(), file), lines });
  }
}

if (violations.length > 0) {
  console.error("\n❌  FILE SIZE GUARD FAILED\n");
  console.error(`   Rule: No source file may exceed ${MAX_LINES} lines.`);
  console.error(`   Violations found:\n`);
  for (const v of violations) {
    console.error(`   🔴  ${v.file}  (${v.lines} lines — ${v.lines - MAX_LINES} over limit)`);
  }
  console.error("\n   ➡  Split the file before running build.\n");
  process.exit(1);
} else {
  console.log(`✅  File size check passed — all files ≤ ${MAX_LINES} lines.`);
}
