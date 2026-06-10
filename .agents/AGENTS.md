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
  - `src/hooks/` (Custom hooks like `useAssetChart`, `usePortfolioChart`, `usePortfolioData`, and `useProfile`)

## Development Rules & Conventions
1. **No Tailwinds**: Use Vanilla CSS for all styling and layout. The styling is defined in `src/index.css`.
2. **Clickable File Links**: When communicating in chat or writing walkthroughs, always create clickable file links using the scheme `file:///path/to/file` (e.g. `[Dashboard.jsx](file:///d:/antigravity/us%20stock%20tracker/src/components/Dashboard.jsx)`).
3. **No Placeholders**: Do not write placeholder assets. If you need demo images, use image generation.
4. **Preserve Documentation**: Maintain existing codebase documentation, comments, and docstrings.
5. **Always Push/Upload to Cloud**: Every time you modify, fix, or optimize any code, compile/build it successfully and then commit and push/upload the changes to the remote cloud repository (GitHub/Cloudflare Pages) immediately in the same turn without waiting for the user to ask or prompt.
6. **Modular Architecture & File Size Limits**: Keep UI components and hooks focused and lightweight (< 400 lines). Avoid creating massive monolithic files. Place charts, shared components, and dashboard sub-components in their respective subdirectories (`src/components/charts/`, `src/components/common/`, `src/components/dashboard/`). Place interaction and state logic in `src/hooks/`. Extract formatting helpers to `src/utils/formatters.js` and shared business logic to `src/utils/assetHelpers.js` to ensure zero global mutable states. The pre-build script `scripts/check-file-size.js` enforces this limit. Refer to [ARCHITECTURAL_GUIDE.md](file:///d:/antigravity/us%20stock%20tracker/ARCHITECTURAL_GUIDE.md) for structural mapping.
7. **Proactive Size Estimation**: Before modifying any file, the agent must check the current line count and calculate the projected post-edit line count (`Current + Inserted - Deleted`). If the projected line count exceeds 400 lines or gets close to the limit (380-400 lines), the agent must plan to split functions or components into sub-modules **before** starting to write the actual code. This ensures proactive prevention rather than reactive fixing after a build failure.
8. **Strict Planning & Approval Protocol**: The agent must act as a Junior Developer working under the supervision of the Lead Developer (user):
   - **Plan First When Unsure**: If a task is complex or architectural choices are unclear, the agent must perform research and draft an Implementation Plan first for the user to review.
   - **Autonomy in Execution**: Once the user approves the initial plan or orders the task to begin, the agent is trusted to execute the changes all the way to completion (including coding, building, committing, and pushing) without pausing to ask for permission mid-way.
   - **Double-Check Compliance**: For every edit, the agent must review all rules (including clickable file links, no placeholders, no TailwindCSS, and the ≤ 400 lines limit) and verify code correctness before compiling and committing.

## Active Session Flow
- Check `.agents/active.md` to see the current active task and branch.
- Task planning notes are stored in `.agents/sessions/` using the format `YYYY-MM-DDTHH-MM-SS-short-description.md`.
