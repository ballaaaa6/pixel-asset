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
│       ├── ocr.js                   # POST /api/ocr — Gemini Vision slip scan
│       ├── portfolio.js             # GET/POST /api/portfolio — CRUD portfolio lots
│       ├── prices.js                # GET /api/prices — Yahoo Finance price fetch
│       ├── profile.js               # GET/POST /api/profile — user profile sync
│       └── scan.js                  # POST /api/scan — full Tesseract OCR pipeline (694 lines ⚠️)
│
├── src/
│   ├── main.jsx                     # React entry point (9 lines ✅)
│   ├── App.jsx                      # Route controller: Login/Register/Dashboard (79 lines ✅)
│   ├── index.css                    # Global styles — Vanilla CSS ONLY (large but expected)
│   │
│   ├── components/
│   │   ├── Dashboard.jsx            # ⛔ 2207 lines — NEEDS SPLIT (state + profile + avatar + chart logic)
│   │   ├── AssetModal.jsx           # ⛔ 1500 lines — NEEDS SPLIT (CURRENCIES array 165+ entries + OCR + form)
│   │   ├── AssetDetailPanel.jsx     # ⚠️  649 lines — close to limit, duplicates logic from Dashboard
│   │   │
│   │   ├── charts/
│   │   │   ├── AssetChart.jsx       # ⛔ 1510 lines — NEEDS SPLIT (EMA calc + zoom + tooltip + SVG all in one)
│   │   │   ├── PortfolioChart.jsx   # ⛔ 1284 lines — NEEDS SPLIT (zoom + diff + tooltip + SVG all in one)
│   │   │   ├── chartUtils.js        # ✅ 135 lines — SVG math helpers (smoothPath, interpolateData, etc.)
│   │   │   └── SparklineChart.jsx   # ✅  25 lines — mini trend line
│   │   │
│   │   ├── common/
│   │   │   └── AssetLogo.jsx        # ✅  63 lines — logo with fallback cascade
│   │   │
│   │   └── dashboard/
│   │       ├── DashboardHeader.jsx  # ✅ 138 lines — nav bar
│   │       ├── KPIRow.jsx           # ✅  90 lines — metric cards
│   │       ├── PortfolioSummary.jsx # ✅ 150 lines — net worth hero
│   │       ├── DonutChart.jsx       # ✅ 253 lines — allocation pie
│   │       ├── AssetTable.jsx       # ✅ 394 lines — holdings table (borderline)
│   │       └── PnLDetailsModal.jsx  # ✅ 369 lines — P&L breakdown modal
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

## 6. ปัญหาที่ต้องแก้ไข (Priority Order)

### 🔴 Priority 1 — แก้ทันที (ไฟล์ใหญ่เกินกฎ)

#### Dashboard.jsx (2207 บรรทัด → ควรเป็น ~300)
แยกออกเป็น:
- `src/hooks/usePortfolioData.js` — fetchAssets, fetchPrices, sparklines, portfolioHistory
- `src/hooks/useProfile.js` — profilePic, nickname, avatarUpload, syncProfile  
- `src/components/dashboard/ProfileModal.jsx` — UI modal แก้ไข profile
- `src/components/dashboard/AvatarWidget.jsx` — avatar preview + upload button
- `src/utils/constants.js` — `PRESET_AVATARS`, `CATEGORY_LABELS` (ย้ายออกจาก Dashboard)

#### AssetModal.jsx (1500 บรรทัด → ควรเป็น ~300)
แยกออกเป็น:
- `src/utils/constants.js` — `CURRENCIES` array 165+ entries (ย้ายออก)
- `src/components/modal/LotForm.jsx` — form กรอก qty/price/date
- `src/components/modal/OcrPanel.jsx` — UI OCR / upload slip
- `src/components/modal/AssetSearch.jsx` — search + dropdown เลือก symbol

#### AssetChart.jsx (1510 บรรทัด → ควรเป็น ~350)
แยกออกเป็น:
- `src/hooks/useAssetChart.js` — zoom/drag/diff/EMA state และ mouse handlers
- `src/components/charts/AssetChartSVG.jsx` — SVG rendering เท่านั้น
- `src/components/charts/AssetChartTooltip.jsx` — tooltip UI

#### PortfolioChart.jsx (1284 บรรทัด → ควรเป็น ~350)
แยกออกเป็น:
- `src/hooks/usePortfolioChart.js` — zoom/drag/diff/interpolation state
- `src/components/charts/PortfolioChartSVG.jsx` — SVG rendering
- `src/components/charts/PortfolioChartTooltip.jsx` — tooltip UI

---

### 🟡 Priority 2 — แก้ในรอบถัดไป

#### AssetDetailPanel.jsx (649 บรรทัด)
- ลบ `getHistoricalRate` ออก → import จาก `assetHelpers.js`
- ลบ `getRealizedPnLInTHB` ออก → import จาก `assetHelpers.js`
- แยก transaction history list ออกเป็น `dashboard/AssetTransactionHistory.jsx`

#### AssetModal.jsx — duplicate functions
- ลบ local `getDisplaySymbol`, `getCurrencyTicker` ออก → import จาก `assetHelpers.js`
- ลบ local `fmtDate`, `fmtUSD`, `fmtQty` ออก → import จาก `formatters.js`

---

### 🟢 Priority 3 — Nice to have

- `scan.js` (694 บรรทัด) — แยก helper functions ออกเป็น `functions/api/_scanHelpers.js`
- เพิ่ม `src/utils/constants.js` รวม PRESET_AVATARS + CURRENCIES + CATEGORY_LABELS
- เพิ่ม JSDoc comment บน props ของทุก component

---

## 7. วิธีทำงานกับ Agent ให้ประหยัด Token

1. **บอก scope ให้ชัด** — "แก้เฉพาะ Dashboard.jsx ส่วน profile state เท่านั้น"
2. **อ้างไฟล์ด้วย path** — ใช้ link `[Dashboard.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/Dashboard.jsx)`
3. **แยกงานเป็น Priority** — ทำ Priority 1 ก่อน แล้ว review ก่อนทำ Priority 2
4. **ใช้ /goal command** สำหรับงานใหญ่ที่ต้องทำหลาย step ต่อเนื่อง
5. **ไม่ต้องบอกให้ push** — Agent จะ build + commit + push ทุกครั้งที่แก้โค้ด

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

## 10. ไฟล์ที่ตามกฎแล้ว (ห้ามทำให้ใหญ่ขึ้น)

| ไฟล์ | บรรทัด | สถานะ |
|---|---|---|
| `src/main.jsx` | 9 | ✅ |
| `src/App.jsx` | 79 | ✅ |
| `src/utils/formatters.js` | 80 | ✅ |
| `src/utils/assetHelpers.js` | 150 | ✅ |
| `src/utils/ocrParser.js` | 165 | ✅ |
| `src/components/charts/chartUtils.js` | 135 | ✅ |
| `src/components/charts/SparklineChart.jsx` | 25 | ✅ |
| `src/components/common/AssetLogo.jsx` | 63 | ✅ |
| `src/components/dashboard/DashboardHeader.jsx` | 138 | ✅ |
| `src/components/dashboard/KPIRow.jsx` | 90 | ✅ |
| `src/components/dashboard/PortfolioSummary.jsx` | 150 | ✅ |
| `src/components/dashboard/DonutChart.jsx` | 253 | ✅ |
| `src/components/dashboard/PnLDetailsModal.jsx` | 369 | ✅ |
| `src/components/dashboard/AssetTable.jsx` | 394 | ✅ (borderline) |
