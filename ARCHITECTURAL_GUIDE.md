# US Stock Tracker — Architectural Guide

> **Version**: 486e0dd · Last updated: 2026-06-10  
> อ่านก่อนแก้โค้ดทุกครั้ง เพื่อให้ระบบอ่านง่าย ไม่พัง และประหยัด token

---

## 1. Stack Overview

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vite + React 18 + Vanilla CSS | ห้ามใช้ Tailwind |
| Serverless API | Cloudflare Pages Functions (`functions/api/`) | Edge runtime |
| Database | Supabase (PostgreSQL) | Auth + portfolio data |
| OCR | Tesseract.js (client-side) + Gemini API | Slip scanning |
| Deployment | Cloudflare Pages (auto deploy on push) | `main` branch |

---

## 2. Directory Structure (สมบูรณ์)

```
d:/antigravity/us stock tracker/
├── functions/
│   └── api/                         # Cloudflare Pages Functions (serverless)
│       ├── auth/
│       │   ├── login.js             # POST /api/auth/login
│       │   ├── register.js          # POST /api/auth/register
│       │   └── change-password.js   # POST /api/auth/change-password
│       ├── _pricesBase.js           # Price caching, cookie crumb and base helpers
│       ├── _pricesDetails.js        # Company detail parsing and news translation helpers
│       ├── _pricesLive.js           # Live prices and history helper logic
│       ├── _pricesMetrics.js        # Metrics calculation and model formatting logic
│       ├── _pricesSearch.js         # Autocomplete query and sparkline helpers
│       ├── _scanModel.js            # Workers AI scanner model and portfolio lot merger
│       ├── _scanValidators.js       # Receipt prompt heuristics and data validator
│       ├── ocr.js                   # POST /api/ocr — Gemini Vision slip scan
│       ├── portfolio.js             # GET/POST /api/portfolio — CRUD portfolio lots
│       ├── prices.js                # GET /api/prices — Main price API entry point (80 lines ✅)
│       ├── profile.js               # GET/POST /api/profile — user profile sync
│       ├── scan.js                  # POST /api/scan — Main OCR scan API entry point (115 lines ✅)
│       └── thaiStocks.js            # GET /api/thaiStocks — list of Thai stock names/symbols
│
├── src/
│   ├── main.jsx                     # React entry point (9 lines ✅)
│   ├── App.jsx                      # Route controller: Login/Register/Dashboard (84 lines ✅)
│   ├── index.css                    # Global styles — Vanilla CSS ONLY (large but expected)
│   │
│   ├── components/
│   │   ├── charts/                  # SVG charts, tooltips, and helpers
│   │   │   ├── AssetChart.jsx       # Chart container (142 lines ✅)
│   │   │   ├── AssetChartSVG.jsx    # SVG rendering (308 lines ✅)
│   │   │   ├── TechnicalChart.jsx   # Candlestick/EMA (345 lines ✅)
│   │   │   └── ...
│   │   ├── common/                  # Shared UI components (BrokerBadge, AssetLogo, GlowTiltCard)
│   │   ├── dashboard/               # Dashboard parts (AssetTable, StockAnalyzer, DonutChart)
│   │   ├── modal/                   # Modals (AssetSearchSelector, ReceiptUploadZone)
│   │   │
│   │   ├── AssetDetailPanel.jsx     # Detail sidebar panel (276 lines ✅)
│   │   ├── AssetModal.jsx           # Add/edit transaction form (311 lines ✅)
│   │   ├── Dashboard.jsx            # Main dashboard shell (325 lines ✅)
│   │   ├── Login.jsx                # Login page (137 lines ✅)
│   │   └── Register.jsx             # Register page (157 lines ✅)
│   │
│   ├── hooks/                       # Custom hooks for state and fetching
│   │   ├── useAssetChart.js         # Zoom/pan/mouse state for asset charts
│   │   ├── usePortfolioData.js      # Core portfolio data state (335 lines ✅)
│   │   └── ...
│   │
│   └── utils/                       # Core utility functions
│       ├── assetHelpers.js          # Business logic, ticker conversion (322 lines ✅)
│       ├── formatters.js            # Standard data formatters (83 lines ✅)
│       └── ocrParser.js             # Client-side OCR parser (166 lines ✅)
│
├── ARCHITECTURAL_GUIDE.md           # (this file)
├── .agents/active.md                # Current task & branch info
├── .agents/sessions/                # Task planning notes
├── vite.config.js
├── wrangler.toml
├── package.json
```eakdown modal
│   │
│   └── utils/
│       ├── formatters.js            # ✅  80 lines — pure format functions (USD, THB, date, pct, qty)
│       ├── assetHelpers.js          # ✅ 150 lines — ticker parsing, name maps, realized P&L calc
│       └── ocrParser.js             # ✅ 165 lines — canvas crop + Tesseract/Gemini parser
│
├── ARCHITECTURAL_GUIDE.md           # (this file)
├── .agents/active.md                # Current task & branch info
├── .agents/sessions/                # Task planning notes
├── vite.config.js
├── wrangler.toml
└── package.json
```

---

## 3. Core Design Rules (สำคัญมาก)

### 3.1 ขนาดไฟล์ < 400 บรรทัด
ทุก component ต้องไม่เกิน 400 บรรทัด แยกออกไปตาม pattern นี้:

| ประเภท | ย้ายไปที่ |
|---|---|
| Data fetching + state | Custom hook `src/hooks/useXxx.js` |
| SVG rendering | `src/components/charts/XxxSVG.jsx` |
| Tooltip UI | `src/components/charts/XxxTooltip.jsx` |
| Sub-widget | `src/components/dashboard/Xxx.jsx` |
| Static data (arrays, maps) | `src/utils/constants.js` |

### 3.2 ห้าม Global Mutable State
- `hideValues` ต้อง pass เป็น prop/parameter เสมอ
- Formatter ต้อง wrap ด้วย `useMemo` ใน component:
  ```javascript
  const fmt = useMemo(() => ({
    usd: (n) => fmtUSD(n, hideValues),
    thb: (n, decimals = 0) => fmtTHB(n, decimals, hideValues),
    pct: fmtPct,
    qty: (n) => fmtQty(n, hideValues),
    date: fmtDate,
  }), [hideValues]);
  ```

### 3.3 ห้าม Duplicate Code
ปัจจุบันมีการ duplicate ที่ต้องแก้ไข:

| Code ที่ซ้ำ | มีอยู่ใน | ควรเป็น |
|---|---|---|
| `getDisplaySymbol()` | `AssetModal.jsx` + `assetHelpers.js` | ใช้จาก `assetHelpers.js` เท่านั้น |
| `getCurrencyTicker()` | `AssetModal.jsx` + `assetHelpers.js` | ใช้จาก `assetHelpers.js` เท่านั้น |
| `fmtDate/fmtUSD/fmtQty` (local copy) | `AssetModal.jsx` | ใช้จาก `formatters.js` เท่านั้น |
| `getHistoricalRate()` | `Dashboard.jsx` + `AssetDetailPanel.jsx` | ย้ายไป `assetHelpers.js` หรือ custom hook |
| `getRealizedPnLInTHB()` | `Dashboard.jsx` + `AssetDetailPanel.jsx` | ย้ายไป `assetHelpers.js` |

### 3.4 Vanilla CSS เท่านั้น
- ห้ามใช้ TailwindCSS, styled-components, CSS-in-JS
- Class ใหม่ทุกตัวต้องเพิ่มใน `src/index.css`
- ตั้งชื่อ class ตาม component เช่น `.asset-chart-tooltip`, `.dashboard-kpi-row`

---

## 4. Data Flow

```
User Action (click/input)
       │
       ▼
  Component State (useState/useCallback)
       │
       ├──► /api/* (Cloudflare Functions) ──► Supabase DB
       │
       └──► localStorage (portfolio_name, profile_pic, hide_portfolio_values, ema_*)
              │
              ▼
        Dashboard.jsx (master state owner)
              │
    ┌─────────┼──────────────┬──────────────┐
    ▼         ▼              ▼              ▼
DashboardHeader  KPIRow  AssetTable   PortfolioChart
(profile/nav)  (metrics) (holdings)   (history chart)
                               │
                               ▼
                        AssetDetailPanel (drill-down)
                               │
                               ▼
                          AssetChart (candles/EMA/zoom)
```

---

## 5. API Layer (functions/api/)

| Endpoint | File | Method | หน้าที่ |
|---|---|---|---|
| `/api/auth/login` | `auth/login.js` | POST | JWT login |
| `/api/auth/register` | `auth/register.js` | POST | สมัครสมาชิก |
| `/api/auth/change-password` | `auth/change-password.js` | POST | เปลี่ยนรหัสผ่าน |
| `/api/portfolio` | `portfolio.js` | GET/POST | โหลด/บันทึก lots |
| `/api/prices` | `prices.js` | GET | ดึงราคาหุ้น (Yahoo Finance) |
| `/api/profile` | `profile.js` | GET/POST | โหลด/บันทึก profile |
| `/api/ocr` | `ocr.js` | POST | Gemini Vision scan สลิป |
| `/api/scan` | `scan.js` | POST | Tesseract pipeline ⚠️ 694 บรรทัด |

---

## 6. สถานะการควบคุมขนาดไฟล์ (File Size Status)

### 🟢 ทุกไฟล์ใน `src/` ผ่านกฎขนาดไฟล์ ≤ 400 บรรทัดแล้ว (100% Completed)
การแยกองค์ประกอบของ UI Components, Hooks, และ Utilities เสร็จสมบูรณ์แล้ว ทำให้ทุกไฟล์ใน `src/` มีขนาดไม่เกิน 400 บรรทัด (ตรวจสอบและผ่านการทดสอบด้วย `check-file-size.js` เรียบร้อย)

---

### ⚠️ ไฟล์ฝั่ง Backend (`functions/api/`) ที่มีขนาดใหญ่และควรแยกในอนาคต (Nice to Have)
ปัจจุบันกฎขนาดไฟล์ 400 บรรทัดครอบคลุมเฉพาะไฟล์ภายใต้ `src/` แต่ไฟล์ของ backend functions เหล่านี้ค่อนข้างใหญ่ และควรพิจารณา refactor เมื่อมีโอกาส เพื่อประหยัด Token และทำความเข้าใจง่ายขึ้น:
- `functions/api/prices.js` (1124 บรรทัด ⚠️) — จัดการ Live Prices, Sparklines, Search และ Company Details (มีขนาดใหญ่เนื่องจากรวมโค้ด API endpoint logic เข้าด้วยกัน)
- `functions/api/scan.js` (797 บรรทัด ⚠️) — ตัวจัดการ OCR Slip Scan pipeline และ Cross-validation

---

## 7. วิธีทำงานกับ Agent ให้ประหยัด Token

1. **บอก scope ให้ชัด** — "แก้เฉพาะ Dashboard.jsx ส่วน profile state เท่านั้น"
2. **อ้างไฟล์ด้วย path** — ใช้ link `[Dashboard.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/Dashboard.jsx)`
3. **แยกงานเป็นเรื่องย่อย** — ทำเป็นส่วนๆ แล้วตรวจสอบความถูกต้องก่อนเริ่มส่วนอื่น
4. **ใช้ /goal command** สำหรับงานใหญ่ที่ต้องทำงานต่อเนื่องหลายขั้นตอน
5. **ไม่ต้องบอกให้ push** — Agent จะ build + commit + push ทุกครั้งที่แก้โค้ดสำเร็จ

---

## 8. Naming Conventions

| ประเภท | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Component | PascalCase `.jsx` | `AssetChartTooltip.jsx` |
| Hook | camelCase `use` prefix `.js` | `usePortfolioData.js` |
| Util/Helper | camelCase `.js` | `formatters.js`, `assetHelpers.js` |
| CSS class | kebab-case | `.asset-chart-tooltip` |
| API endpoint file | camelCase `.js` | `prices.js` |
| Constants | UPPER_SNAKE_CASE | `PRESET_AVATARS`, `CURRENCIES` |

---

## 9. Git Workflow

```bash
# ทุกครั้งที่แก้โค้ดเสร็จ:
npm run build          # ต้องผ่านก่อน commit
git add -A
git commit -m "type: short description"
git push origin main   # Cloudflare Pages auto-deploy
```

Commit types: `feat`, `fix`, `refactor`, `docs`, `chore`

---

## 10. ขนาดไฟล์ล่าสุด (ตรวจสอบเมื่อ 2026-06-13)

| ไฟล์ | บรรทัด | สถานะ |
|---|---|---|
| `src/main.jsx` | 9 | ✅ |
| `src/App.jsx` | 84 | ✅ |
| `src/components/Dashboard.jsx` | 325 | ✅ |
| `src/components/AssetModal.jsx` | 311 | ✅ |
| `src/components/AssetDetailPanel.jsx` | 276 | ✅ |
| `src/components/charts/AssetChart.jsx` | 142 | ✅ |
| `src/components/charts/PortfolioChart.jsx` | 149 | ✅ |
| `src/hooks/usePortfolioData.js` | 335 | ✅ |
| `src/utils/assetHelpers.js` | 322 | ✅ |
| `src/utils/formatters.js` | 83 | ✅ |
| `src/utils/ocrParser.js` | 166 | ✅ |
| `functions/api/prices.js` | 80 | ✅ |
| `functions/api/scan.js` | 115 | ✅ |
| `functions/api/_pricesBase.js` | 210 | ✅ |
| `functions/api/_pricesDetails.js` | 280 | ✅ |
| `functions/api/_pricesLive.js` | 200 | ✅ |
| `functions/api/_pricesMetrics.js` | 160 | ✅ |
| `functions/api/_pricesSearch.js` | 120 | ✅ |
| `functions/api/_scanModel.js` | 240 | ✅ |
| `functions/api/_scanValidators.js` | 370 | ✅ |
