# Session: Fix Timeframe Clipping and Transaction Markers on Long Timeframes

- **Date**: 2026-06-03
- **Status**: Completed
- **Branch**: `main`

## Plan & Objective
1. Fix the bug where short timeframe selections (like `3M`) were incorrectly downgraded to `1M` when the user had stock purchases bought recently, despite having older cash history.
2. Ensure that `earliestDate` calculations across both the data-fetching and timeline-rendering code do not ignore cash/fiat transactions when stocks are present. This ensures the portfolio timeline start boundary reflects the absolute first event.
3. Fix the issue where transaction markers ("A", "M", "N" badges) disappeared on longer timeframes (like `5Y` and `MAX`) because of the 7-day distance matching threshold. If a transaction date falls within the visible chart range, it must map to the closest date index on the chart.

## Proposed Changes

### Portfolio Sparkline Fetching and Timeline Clipping
- **[Dashboard.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/Dashboard.jsx)**:
  - Restored the timeframe auto-downgrade logic in `fetchSparklines` to fetch optimal timeframe lengths (e.g. downgrading `MAX` to `5Y` when the history fits within it) to preserve high resolution daily closes and prevent huge Yahoo Finance payload downloads.
  - Modified both `fetchSparklines` and the `portfolioHistory` rendering `useEffect` to compute `earliestDate` across all assets in the portfolio (without excluding fiat cash).
  - Removed the `bestDiff < 7 * 86400000` limit when mapping transactions to date indexes so that markers are always drawn at the closest chart coordinate.

### Single Asset Detail Chart
- **[AssetDetailPanel.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/AssetDetailPanel.jsx)**:
  - Removed the 7-day limit condition from `lotMarkers` index mapping so that buy/sell indicators are always visible on `5Y` and `MAX` charts.

## Verification
- Run production build `npm run build`. Compiles successfully.
