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
7. **Proactive Size Estimation (การคำนวณขนาดไฟล์เชิงรุก)**: ก่อนลงมือเขียนหรือแก้ไขไฟล์ใด ๆ เอเจนต์ต้องทำการตรวจสอบจำนวนบรรทัดปัจจุบันและคำนวณจำนวนบรรทัดสุทธิที่จะเกิดขึ้นหลังจากแก้ไข (`จำนวนปัจจุบัน + ที่จะเขียนเพิ่ม - ที่จะลบออก`) หากประเมินแล้วว่าจะเกิน 400 บรรทัด หรือใกล้เคียงขีดจำกัด (380-400 บรรทัด) ต้องวางแผนแยกฟังก์ชันหรือ Component ออกเป็นโมดูลย่อย **ก่อน** เริ่มลงมือโค้ดจริงทุกครั้ง เพื่อการป้องกันเชิงรุกไม่ใช่การแก้ไขหลังจากเกิด Build Fail
8. **Strict Planning & Approval Protocol (ระเบียบขั้นตอนการสั่งงานและการอนุมัติอย่างเป็นระบบ)**: เอเจนต์ต้องวางตัวเป็น Junior Developer ที่ทำงานภายใต้การควบคุมของ Lead Developer (ผู้ใช้งาน) อย่างเคร่งครัด:
   - **ห้ามแก้ไขซอร์สโค้ดทันที**: เมื่อได้รับคำสั่งใหม่ เอเจนต์ต้องทำวิจัย ทำการคำนวณขนาดไฟล์ และร่างแผนงานลงในเอกสารสำหรับอนุมัติก่อนเสมอ
   - **ต้องได้รับการอนุมัติอย่างชัดเจน (Explicit Approval)**: เอเจนต์ต้องรอการยืนยันและการอนุมัติแผนงานจากผู้ใช้ในช่องแชทก่อนจะเริ่มแตะต้องหรือแก้ไขซอร์สโค้ดจริง
   - **ตรวจทานวินัยร่วมกับผลงานทุกรอบการคอมมิต**: ทุกๆ รอบการแก้ไข เอเจนต์ต้องทบทวนความถูกต้องตามกฎระเบียบทั้งหมด (รวมถึงลิงก์ไฟล์ที่คลิกได้และไม่มี Placeholder) ร่วมกับการแก้ไขโค้ดเสมอ

## Active Session Flow
- Check `.agents/active.md` to see the current active task and branch.
- Task planning notes are stored in `.agents/sessions/` using the format `YYYY-MM-DDTHH-MM-SS-short-description.md`.
