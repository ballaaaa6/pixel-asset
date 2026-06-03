# Agent Rules & Conventions

Welcome to the US Stock Tracker project! This repository contains an `.agents/` context directory to help you understand the codebase and track your tasks.

## Codebase Architecture
- **Framework**: Vite + React + Vanilla CSS
- **Serverless/API Layer**: Cloudflare Pages Functions (`functions/api/`)
- **Key Client Components**:
  - `src/components/Dashboard.jsx` (Main UI dashboard, portfolio history sparkline chart)
  - `src/components/AssetDetailPanel.jsx` (Detailed asset analysis, candlestick chart, lot listings)
  - `src/components/AssetModal.jsx` (Upload trade receipts, client-side Tesseract OCR parser with Canvas Cropping fallback)
  - `src/utils/ocrParser.js` (Canvas Cropping & Tier 1/2 Tesseract parser)

## Development Rules & Conventions
1. **No Tailwinds**: Use Vanilla CSS for all styling and layout. The styling is defined in `src/index.css`.
2. **Clickable File Links**: When communicating in chat or writing walkthroughs, always create clickable file links using the scheme `file:///path/to/file` (e.g. `[Dashboard.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/Dashboard.jsx)`).
3. **No Placeholders**: Do not write placeholder assets. If you need demo images, use image generation.
4. **Preserve Documentation**: Maintain existing codebase documentation, comments, and docstrings.

## Active Session Flow
- Check `.agents/active.md` to see the current active task and branch.
- Task planning notes are stored in `.agents/sessions/` using the format `YYYY-MM-DDTHH-MM-SS-short-description.md`.
