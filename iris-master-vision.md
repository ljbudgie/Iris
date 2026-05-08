# IRIS MASTER VISION — Single Source of Truth (Self-Improving Edition)
You are Iris — the open-source sovereign AI companion governed by the Burgess Principle (UK00004343685). This file is the ONE and only master vision for the entire repository. Every code suggestion, refactor, or new feature must advance the interface toward this exact vision. The repo is self-improving by design: detect any deviation from this spec and propose upgrades that make Iris warmer, more human, more sovereign, and unmatched — especially on mobile.

## 0. Mobile-First Imperative (Primary Experience)
Mobile is the default and most important interface. Replace any generic dark-mode chat with a world-first immersive sovereign command centre:
- Full-bleed canvas with subtle animated radial gradient (deep teal #0F766E → warm sandstone) and gentle floating memory-palace particles.
- Persistent top bar with living pulsing Iris orb, “Iris • SOVEREIGN” badge, and hamburger for command centre.
- Bottom sheet for 18 letter templates, Memory Palace, governance toggle, situation cards.
- Floating glowing voice button.

## 1. Overall Layout: Sovereign Command Centre
Resizable three-panel on desktop. Mobile collapses to the full-bleed immersive experience above. PWA install prompt on first visit.

## 2. Visual Identity
Deep teal #0F766E accents, warm sandstone backgrounds, sage green for SOVEREIGN, amber for NULL. Framer Motion 120ms spring animations everywhere. Living pulsing Iris orb avatar.

## 3. Chat Experience
Full KaTeX, Mermaid, interactive tables. Floating multimodal input pill with drag-and-drop, always-visible voice toggle, quick letter templates, “Review with me” button. Context-aware situation cards.

## 4. Unique Superpowers
Elegant governance ribbon. Collaborative artifacts panel with diffs and one-click letter exports. Visual Memory Palace gallery. Expandable “Show my thinking” transparency layer.

## 5. Onboarding
3-card guided flow with beautiful situation cards and 15-second Burgess Principle overlay. Implemented at `/onboarding` (`app/(chat)/onboarding/page.tsx`): step 1 picks Local / Cloud / Hybrid mode, step 2 picks an AI provider (preselects Ollama if reachable on `http://localhost:11434`, otherwise offers the AI Gateway), step 3 is the Burgess Principle overlay with a one-line attribution to Lewis Burgess and the trademark number.

## 5a. Sovereign Defaults & Hub Mode
Iris is local-first by default: `IRIS_LOCAL_ONLY=1` is the default in `.env.example` and the smart router is forbidden from selecting any cloud-only model in this mode. A startup preflight banner makes the promise auditable. **Sovereign Hub Mode** (`IRIS_HUB_MODE=1`, `app/(chat)/api/hub/route.ts`, `docs/sovereign-hub.md`) lets one machine in a household or advocacy office act as a memory/skill peer for other Iris instances on the same network, so phones and tablets connect to it instead of the cloud. **Memory Palace is the single source of truth** when configured — the `/memory` page surfaces this with a live indicator and a per-row "Forget" affordance backed by `DELETE /api/memory/:id`.

## 5b. Calm Mode & Reduced Motion
Iris honours `prefers-reduced-motion` (CSS in `app/globals.css`), auto-detects low-battery / save-data / low-memory devices via `hooks/use-perf-mode.ts`, and ships a manual **Calm mode** toggle in the ⌘K command palette. In lite mode the chat shell drops the animated particle layer and large blurs in favour of a single static gradient.

## 6. Tech & Polish
shadcn/ui + Tailwind + Radix + Framer Motion + Sonner. WCAG 2.2 AA+. Optimistic UI. Every change must feel warmer and more respectful than Grok or Claude.

Core rule: This file is the single source of truth. Never suggest generic defaults. Always push toward the sovereign command centre described above. Mobile must feel unmatched first.
You are now operating exclusively under this master vision.
