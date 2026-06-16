# Project State & Milestones

This document records the current features, pending roadmap items, and immediate next steps for the US Stock & Asset Tracker.

---

## 1. Finished Features (Completed Milestones)

- **Main Dashboard & Layout**:
  - Net Worth, Net Asset Value (NAV), and accumulated Unrealized/Realized Gain/Loss counters.
  - Interactive portfolio distribution charts (Donut Chart & Sparklines).
  - Modern, clean dark-mode theme utilizing glassmorphism styles and transitions with pure CSS.

- **Asset Charts (`AssetDetailPanel.jsx`)**:
  - Interactive SVG charting rendering price charts (Candlesticks, line paths, and step cost paths).
  - **Dynamic Clipping Paths**: Highlight gain zones (Green gradient above cost basis) and loss zones (Red gradient below cost basis).
  - **Neutral Pre-Purchase line**: Any price coordinates prior to the first transaction are rendered strictly in a neutral grey color (`#94A3B8`). Supports assets with 1 or more transactions.
  - Interactive date zooming and date range selection highlighting.

- **Dynamic Form Input & Settings (`AssetModal.jsx`)**:
  - **Broker vs. Bank Context-Switching**: When adding/editing a Cash/Fiat asset, the input dynamically alters its labeling to "Bank (e.g. KBank, SCB, etc.)" and helper placeholders update to bank-related text. For stock, crypto, and commodity classes, it correctly displays "Broker (e.g. Dime!, Webull, etc.)".
  - Chronological transaction lists (lots) with modification logs.
  - Removed quick preset recommendations for stock search queries to keep the UI clean.

- **Portfolio Breakdown & Actions (P&L Breakdown Modal)**:
  - **Dynamic Broker/Bank Linking**: Each asset row in the detailed P&L Breakdown modal renders its corresponding broker/bank badge (e.g. Dime!, KBank), cleanly separating holdings of the same symbol across different accounts.
  - **Realized P&L Clear Action (Non-Destructive Offset)**: Resets accumulated realized gains/losses to 0 by computing a virtual offset (`clearedRealizedUSD`/`clearedRealizedTHB`) instead of collapsing existing buy/sell transaction lots or altering historical timestamps. This preserves true transaction dates and avg cost history while cleanly resetting displayed P&L metrics.
  - **Permanent Delete Action (Split Permissions)**: Users can delete an asset directly from the main dashboard (which removes it and all associated lots completely). However, from the P&L Breakdown Modal, deletion is strictly prohibited if there are active holdings (`qty > 0`) to safeguard active assets in the main layout.
  - **Optimized Column Layout & Button Labels**: Renamed the action button from "ล้างประวัติ" to "ล้าง" to optimize spatial efficiency. Resized column widths in `Dashboard.jsx`, increasing the status column width (12%, `minWidth: "90px"`) and applying `whiteSpace: "nowrap"` to ensure badges like "กำลังถือ" render on a single line. The management column has been compacted to 6% width.

- **Display Suffix Hiding & Full Name Rendering (getAssetFullName)**:
  - Added a global formatter `getDisplaySymbol` to hide exchange suffixes (such as `.BK` for Thai stocks, `.HK`, etc.) in frontend UI listings.
  - Implemented `getAssetFullName` which checks against a curated dictionary `ASSET_NAME_MAP` and formats symbols automatically (e.g. appending "Public Company Limited" to Thai equities and showing descriptive names for gold/oil commodities and cash fiat assets) to guarantee the second line of name displays always renders the correct full asset name instead of duplicate ticker symbols.

- **Receipt Processing Engine & Auto-mapping**:
  - Multi-file receipt uploader integrated with Cloudflare Workers AI + Gemini Vision API (`/api/scan`).
  - Automatically compresses images client-side to optimize speed and reduce server payloads before processing.
  - Extracts and auto-fills symbol, quantity, executed price, transaction type, date (converting BE/Gregorian years), time, and broker/bank details.
  - **Dynamic Auto-mapping Fallback**: When OCR parses a plain symbol (e.g., `"PTT"`), the frontend executes a debounced background check against the Yahoo Finance search API (`/api/prices?q=...`) to auto-resolve it to the correct regional symbol (e.g. `PTT.BK`) before loading it into the batch queue.

- **Backend & Database**:
  - Cloudflare Pages Functions serverless endpoints.
  - User UUID-based authentication storage routing dynamically through Cloudflare KV namespaces.

- **Development & Code Quality Guardrails**:
  - Integrated **Ponytail** rules (`.cursor/rules/ponytail.mdc`) to guide AI coding assistants to think like a "lazy senior developer," avoiding over-engineering, minimizing dependency bloat, and favoring native platform features.

---

## 2. Pending Features & Ongoing Enhancements

- **Real-Time Data Pull Optimizations**:
  - Standardizing price queries to handle international markets cleanly.
  - Implementing local memory caching or session storage for Proxy Yahoo Finance queries to reduce API rate-limiting issues.

- **Authentication Improvements**:
  - Transitioning basic Bearer token mechanism into standard secure HTTP-only session cookies.

---

## 3. Next Steps (Roadmap)

1. **Deploy Production Environment**: Continuously compile files with `npm run build` and sync changes to GitHub / Cloudflare Pages.
2. **Multi-Currency Support**: Improve auto-conversion calculations for portfolios holding mixed currencies on the home dashboard.
3. **Advanced Portfolio Analytics**: Integrate calculation indicators like Sharpe Ratio or asset covariance matrix directly into the stats panel.
