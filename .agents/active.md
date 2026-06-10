# Active Context

- **Current Branch**: `main`
- **Active Task**: Migrate stock price data caching from Workers KV to Cloudflare Cache API (`caches.default`) to resolve daily write limit exhaustion.
- **Tech Stack**: React (Vite), Cloudflare Pages Functions, SQLite (via KV/Miniflare), Cloudflare Cache API
- **Last Status Update**: 2026-06-11 (Successfully migrated price caching to Cache API, reducing daily KV writes to zero. Verified local size limits and built production bundle.)
