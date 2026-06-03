# Session: Fix 3M Timeframe Downgrade Bug

- **Date**: 2026-06-03
- **Status**: Completed
- **Branch**: `main`

## Plan & Objective
1. Identify and resolve the issue where selecting the `3M` range tab shows identical timeline bounds and data to the `1M` range tab, despite the portfolio having transactions dating back to 2025.
2. Remove/disable the timeframe auto-downgrade logic in the sparkline fetching handler, ensuring the client fetches and displays the exact timeframe requested by the user.

## Proposed Changes

### Portfolio Sparkline Fetching
- **[Dashboard.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/Dashboard.jsx)**:
  - Removed the timeframe auto-downgrade logic block in `fetchSparklines` that compared `earliestDate` to timeframe durations.
  - Directly assigned `optimalRange` to the selected `range`.
  - Let the downstream timeline clipping logic in the `portfolioHistory` `useEffect` handle clipping naturally when the start date precedes actual transactions.

## Verification
- Run production build `npm run build` to confirm. Build compiled successfully.
