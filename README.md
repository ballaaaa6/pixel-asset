# US Stock & Asset Tracker

A modern, responsive personal wealth and portfolio asset tracking dashboard designed with a premium, visually stunning dark-mode/glassmorphism design language using Vanilla CSS and React. The application supports multiple asset categories, dynamic charts, manual transaction logging, and automatic trade receipt processing (OCR) using client-side/server-side components.

## Technology Stack

- **Frontend Framework**: React 18 + Vite
- **Styling**: Pure Vanilla CSS (defined globally in `src/index.css`)
- **Icons**: Lucide React
- **Serverless Backend**: Cloudflare Pages Functions (`functions/api/`)
- **Database & KV Store**: Cloudflare KV (for portfolio assets storage) + Supabase (optional authentication/backend storage)
- **Optical Character Recognition (OCR)**: Client-side Canvas Cropping and multi-tier text extraction engines

---

## Folder Structure

```text
us-stock-tracker/
├── .agents/                    # AI agent context and active session history logs
├── dist/                       # Compiled production static bundle
├── functions/                  # Cloudflare Pages Functions serverless endpoints
│   └── api/                    # Serverless API routes
│       ├── auth/               # User authentication handlers
│       ├── ocr.js              # Serverless Tesseract helper endpoints
│       ├── portfolio.js        # User portfolio GET/POST storage endpoint (KV Integration)
│       ├── prices.js           # Real-time stock, crypto, and commodity price proxy
│       ├── profile.js          # User profile settings handler
│       └── scan.js             # Cloudflare Workers AI receipt scanner
├── src/                        # React Frontend Source files
│   ├── components/             # Reusable UI components
│   │   ├── AssetDetailPanel.jsx # Asset detailed metrics, interactive charts, and lot list
│   │   ├── AssetModal.jsx      # Modal for manually adding assets/transactions & uploading receipts
│   │   ├── Dashboard.jsx       # Main application layout, total portfolio tracking, and stats
│   │   ├── Login.jsx           # Simple user login container
│   │   └── Register.jsx        # User registration container
│   ├── utils/                  # Utility functions
│   │   └── ocrParser.js        # HTML5 Canvas cropping engine and receipt regex extraction parser
│   ├── App.jsx                 # Client entry point component
│   ├── index.css               # Core CSS layout styles and custom design system
│   └── main.jsx                # DOM mounting entry
├── package.json                # Project configurations & dependency mappings
├── wrangler.toml               # Wrangler pages server deployment settings
└── vite.config.js              # Vite packaging adjustments
```

---

## Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed on your local machine.

### Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### Running the Application Local Development Server

1. **Client-only Hot-Reload Server** (Vite):
   Runs the client-side app. Note that API endpoints will not be served in this mode.
   ```bash
   npm run dev
   ```

2. **Full-stack Cloudflare Local Emulation Server** (Recommended):
   Compiles the React bundle and starts Wrangler Pages Dev server to run serverless `functions/api` and KV database simulation:
   ```bash
   npm run serve
   ```
   Open your browser and navigate to `http://localhost:8788`.

3. **Production Packaging**:
   Generates a highly-optimized output build directory (`dist/`):
   ```bash
   npm run build
   ```
