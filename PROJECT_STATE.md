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
  - **Realized P&L Clear Action**: Re-consolidates historical transaction lots down to a single starting BUY lot matching the current quantity and weighted average cost. This resets accumulated past realized gains/losses to 0 without affecting the current portfolio valuation or cost basis.
  - **Permanent Delete Action (With Safety Checks)**: Allows permanent removal of an asset from the portfolio. Enforces a safety rule preventing deletion if the current holding quantity is greater than 0 (`qty > 0`) to prevent data corruption between the main board and breakdown panels.
  - **Optimized Column Layout & Button Labels**: Renamed the action button from "ล้างประวัติ" to "ล้าง" to optimize spatial efficiency. Resized column widths in `Dashboard.jsx`, increasing the status column width (12%, `minWidth: "90px"`) and applying `whiteSpace: "nowrap"` to ensure badges like "กำลังถือ" render on a single line. The management column has been compacted to 6% width.

- **Display Suffix Hiding (Dynamic Symbol Clean)**:
  - Added a global formatter `getDisplaySymbol` to hide exchange suffixes (such as `.BK` for Thai stocks, `.HK`, etc.) in frontend UI listings (main board, P&L breakdown table, dropdowns, and details panel) while safely maintaining the original symbols in the backend/KV store for pricing proxy synchronization.

- **Receipt Processing Engine & Auto-mapping**:
  - Multi-file receipt uploader utilizing client-side canvas cropping (Tier 1) and full-image scans (Tier 2).
  - Auto-fills trade symbol, quantities, prices, action types, and default broker/bank value ("Dime!").
  - **Dynamic Auto-mapping Fallback**: When OCR parses a plain symbol (e.g., `"PTT"`), the frontend executes a debounced background check against the Yahoo Finance search API (`/api/prices?q=...`) to auto-resolve it to the correct regional symbol (e.g. `PTT.BK`) before loading it into the batch queue.

- **Backend & Database**:
  - Cloudflare Pages Functions serverless endpoints.
  - User UUID-based authentication storage routing dynamically through Cloudflare KV namespaces.

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
