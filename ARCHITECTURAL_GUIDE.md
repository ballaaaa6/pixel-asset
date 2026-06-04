# US Stock Tracker - Frontend Architecture Guide

This document describes the modular architecture of the US Stock Tracker frontend. Following these guidelines ensures that the codebase remains clean, maintainable, and cost-effective for developer collaboration.

## Directory Structure

```text
src/
├── components/
│   ├── charts/                 # Chart components & SVG calculations
│   │   ├── chartUtils.js       # Mathematical curve rendering & data interpolation
│   │   ├── PortfolioChart.jsx  # Main net worth historical SVG chart
│   │   ├── AssetChart.jsx      # Technical detail candlestick/EMA chart
│   │   └── SparklineChart.jsx  # Mini-trendline charts inside tables
│   ├── common/
│   │   └── AssetLogo.jsx       # Universal logo loader with fallback cascades
│   ├── dashboard/              # Modular dashboard widgets
│   │   ├── DashboardHeader.jsx # Top navigation, settings & user profile bar
│   │   ├── KPIRow.jsx          # Top metrics indicator cards
│   │   ├── PortfolioSummary.jsx# Net Worth valuation & gain/loss hero widget
│   │   ├── DonutChart.jsx      # Asset allocation pie chart segmenting categories
│   │   ├── AssetTable.jsx      # Grid table displaying current holdings list
│   │   └── PnLDetailsModal.jsx # Comprehensive asset-by-asset gain breakdown
│   ├── AssetDetailPanel.jsx    # Drill-down panel displaying asset transaction lists
│   ├── AssetModal.jsx          # Transaction entry, slip uploading & OCR scanning UI
│   ├── Login.jsx               # User authentication login view
│   └── Register.jsx            # User authentication registration view
├── utils/
│   ├── formatters.js           # Numeric, currency (USD/THB), and date formatting
│   ├── assetHelpers.js         # Asset ticker parsing, name mappings, and realized P&L calculations
│   └── ocrParser.js            # Canvas-based slip OCR receipt scanning engine
└── index.css                   # Global styles (Vanilla CSS, NO TAILWIND)
```

## Core Design Principles

1. **Keep UI Components Lightweight (< 400 Lines)**:
   - Separate complex SVG math, chart interaction handlers, and table designs into dedicated sub-components.
   - The main views (`Dashboard.jsx`, `AssetDetailPanel.jsx`) should serve primarily as container controllers managing React states, fetching databases, and composing modular widgets.

2. **No Global/Mutable States in Utilities**:
   - Utility helpers (e.g., `fmtUSD`, `fmtQty`) should remain pure functions.
   - Value hiding (`hideValues`) must be passed down as arguments instead of depending on global mutable flags like `hideValuesGlobal`. Use `useMemo` blocks inside components to dynamically wrap formatters and preserve signature syntax (e.g. `fmt.usd(val)`).

3. **Strict Local Formatting**:
   - To make value hiding simple, bind state values locally:
     ```javascript
     const fmt = useMemo(() => ({
       usd: (n) => fmtUSD(n, hideValues),
       thb: (n, decimals = 0) => fmtTHB(n, decimals, hideValues),
       pct: fmtPct,
       qty: (n) => fmtQty(n, hideValues)
     }), [hideValues]);
     ```

4. **Vanilla CSS Only**:
   - Do not install or import TailwindCSS or utility libraries unless explicitly instructed. Customize layouts through semantic CSS classes in `src/index.css`.
