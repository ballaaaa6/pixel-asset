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

- **Dynamic Form Input (`AssetModal.jsx`)**:
  - **Broker vs. Bank Context-Switching**: When adding/editing a Cash/Fiat asset, the input dynamically alters its labeling to "Bank (e.g. KBank, SCB, etc.)" and helper placeholders update to bank-related text. For stock, crypto, and commodity classes, it correctly displays "Broker (e.g. Dime!, Webull, etc.)".
  - Chronological transaction lists (lots) with modification logs.

- **Receipt Processing Engine (OCR Scanner)**:
  - Multi-file receipt uploader utilizing client-side canvas cropping (Tier 1) and full-image scans (Tier 2).
  - Auto-fills trade symbol, quantities, prices, action types, and default broker/bank value ("Dime!") for both single files and batch queues.

- **Backend & Database**:
  - Cloudflare Pages Functions serverless endpoints.
  - User UUID-based authentication storage routing dynamically through Cloudflare KV namespaces.

---

## 2. Pending Features & Ongoing Enhancements

- **Real-Time Data Pull Optimizations**:
  - Standardizing price queries to handle international markets and ticker suffixes (e.g., Thai Stocks with `.BK` suffix) cleanly without forcing suffixes in user search input.
  - Implementing local memory caching or session storage for Proxy Yahoo Finance queries to reduce API rate-limiting issues.

- **Authentication Improvements**:
  - Transitioning basic Bearer token mechanism into standard secure HTTP-only session cookies.

---

## 3. Next Steps (Roadmap)

1. **Deploy Production Environment**: Continuously compile files with `npm run build` and sync changes to GitHub / Cloudflare Pages.
2. **Multi-Currency Support**: Improve auto-conversion calculations for portfolios holding mixed currencies (e.g. THB cash holdings alongside USD stocks) on the home dashboard.
3. **Advanced Portfolio Analytics**: Integrate calculation indicators like Sharpe Ratio or asset covariance matrix directly into the stats panel.
