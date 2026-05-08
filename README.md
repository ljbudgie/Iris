# Iris — your sovereign AI companion

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fljbudgie%2FIris&project-name=iris&repository-name=iris&env=AUTH_SECRET&envDescription=Click%20%22Generate%22%20to%20create%20a%20random%20auth%20secret&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F32&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)
&nbsp; · &nbsp; [One-command local setup](#quick-start) &nbsp; · &nbsp; [30-second guide](./docs/deploy.md)

Open-source, mobile-first AI companion governed by the [Burgess Principle](https://github.com/ljbudgie/burgess-principle) (UK00004343685). Iris helps ordinary people ask institutions to treat them as real individuals — calmly, clearly, and on their own terms.

![License](https://img.shields.io/badge/license-SEE%20LICENSE-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![pnpm](https://img.shields.io/badge/pnpm-10-f69220) ![Playwright](https://img.shields.io/badge/tested%20with-Playwright-2EAD33)

---

## What is Iris?

I'm Lewis Burgess. I built Iris because I'm disabled, and I got tired of asking institutions to treat me as a real human being. The [Burgess Principle](https://github.com/ljbudgie/burgess-principle) (UK Certification Mark UK00004343685) was registered for one reason: every decision made about a person should have had a human judicial mind applied to the specific facts of that specific case. Iris is the consumer-facing tool that makes that principle pocket-sized — it sits in your pocket and helps you ask the question, calmly, in language that's hard to dismiss.

Iris is built for people navigating decisions made by councils, the DWP, HMRC, courts, tribunals, landlords, schools, the NHS and other institutions. It offers calm, factual letter templates, a Memory Palace for personal context, governance-aware routing, and tribunal-ready exports — all without sending raw personal facts to anyone you didn't intend.

> **Why I built this →** see [`docs/founder.md`](./docs/founder.md).

Iris is **not legal advice** and AI can make mistakes — please read the [Disclaimer](./DISCLAIMER.md) before relying on any output. The single source of truth for product direction is [`iris-master-vision.md`](./iris-master-vision.md); every change to the repo should advance that vision.

---

## Highlights

Recent upgrades that the rest of this README expands on:

- **One-command local setup** — `pnpm setup` brings up Postgres in Docker, writes a sovereign `.env.local`, runs migrations and starts the dev server (`scripts/setup.sh`, `scripts/setup.ps1`, `docker-compose.yml`).
- **First-run wizard & PWA** — three-step onboarding at `/onboarding` (Local / Cloud / Hybrid + provider + Burgess Principle overlay) and a one-tap "Add to home screen" prompt on mobile (`app/(chat)/onboarding/page.tsx`, `components/install-prompt.tsx`, `public/manifest.webmanifest`).
- **Local-first by default** — `IRIS_LOCAL_ONLY=1` is the new default, with an Ollama-backed local provider, a startup preflight banner, and a smart-router defence-in-depth guard (`lib/ai/providers.ts`, `lib/ai/providers/ollama.ts`, `lib/ai/preflight.ts`, `lib/ai/smart-router.ts`).
- **PersonGate enforced, visibly** — every chat turn runs a sovereign-handling assessment, with a "PersonGate active — commitment xxxx" chip surfaced on the greeting (`app/(chat)/api/chat/route.ts`, `components/chat/greeting.tsx`, `lib/person-gate/`).
- **Memory Palace as source of truth** — the `/memory` page now shows whether MemPalace is authoritative or session-only, and lets you "Forget" any row (`app/(chat)/memory/page.tsx`, `app/(chat)/api/memory/`).
- **Sovereign Hub Mode** — opt-in `IRIS_HUB_MODE=1` exposes a federation endpoint so phones / tablets in a household or advocacy office can connect to one Iris hub instead of the cloud (`app/(chat)/api/hub/route.ts`, `app/(chat)/hub/page.tsx`, [`docs/sovereign-hub.md`](./docs/sovereign-hub.md)).
- **Calm mode & reduced-motion** — the chat shell honours `prefers-reduced-motion`, auto-detects low-battery / save-data / low-memory devices, and offers a manual "Calm mode" in ⌘K (`hooks/use-reduced-motion.ts`, `hooks/use-perf-mode.ts`, `app/globals.css`, `components/chat/command-palette.tsx`).
- **Sovereign Command Centre UI** — mobile-first immersive canvas, warm teal/sandstone palette, living Iris orb, governance ribbon and ⌘K command palette (`components/chat/`, `components/ui/`, `app/globals.css`).
- **Intelligence layer** — smart router with Auto model selection, prompt templates, conversation memory, consensus mode and a quality loop (`lib/ai/smart-router.ts`, `lib/ai/templates.ts`, `lib/ai/memory.ts`, `lib/ai/consensus.ts`, `lib/ai/quality-loop.ts`, `lib/ai/system-prompt.ts`).
- **PersonGate sovereign data handling** — optional `@iris-gate/person` integration loaded dynamically so Iris keeps working when the package isn't installed (`lib/person-gate/index.ts`).
- **Federation, skill registry & MemPalace MCP** — pluggable skills, tool permissions and governance gates (`lib/federation/`, `lib/ai/skills/`, `lib/mempalace/`); see [`docs/integration.md`](./docs/integration.md).
- **Letter templates, Memory Palace, situation cards, voice input and a collaborative artifacts panel with diffs** (`lib/ai/templates.ts`, `lib/artifacts/`, `components/chat/`).
- **Accessibility layer** targeting WCAG 2.2 AA+, including screen-reader announcements (`components/accessibility.tsx`).
- **Local-first / self-hostable** — runs end-to-end without cloud services; see [`docs/self-hosting.md`](./docs/self-hosting.md).
- **Tests** — `tsx --test` unit tests (`tests/unit/`) and Playwright E2E (`playwright.config.ts`).

---

## Screenshots

A preview image lives at [`public/preview.png`](./public/preview.png) and a demo thumbnail at [`public/images/demo-thumbnail.png`](./public/images/demo-thumbnail.png). Fresh screenshots of the Sovereign Command Centre redesign are a planned follow-up.

---

## Tech stack

Versions below are taken from [`package.json`](./package.json):

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion / Motion, Lucide icons, Geist + JetBrains Mono
- **AI:** AI SDK 6 (`ai`, `@ai-sdk/react`, `@ai-sdk/provider`), Streamdown, KaTeX, Mermaid, Shiki
- **Data:** Drizzle ORM 0.34 on Postgres (`postgres`), Redis (optional, for resumable streams), Vercel Blob (optional, for uploads)
- **Auth:** NextAuth v5 (beta)
- **Tooling:** Biome / Ultracite, Playwright, `tsx`, drizzle-kit
- **Runtime:** Node.js 20+, pnpm 10+

---

## Quick start

The fastest path — one command from a fresh clone:

```bash
git clone https://github.com/ljbudgie/Iris.git
cd Iris
pnpm setup
```

`pnpm setup` brings up Postgres in Docker, writes `.env.local` (with a fresh `AUTH_SECRET` and `IRIS_LOCAL_ONLY=1`), installs deps, runs migrations and starts the dev server. See [`docs/deploy.md`](./docs/deploy.md) for the click-only Vercel path and [`docs/self-hosting.md`](./docs/self-hosting.md) for a manual walkthrough.

If you'd rather do it by hand:

```bash
pnpm install
cp .env.example .env.local   # then fill in the values you need
pnpm db:migrate
pnpm dev
```

Iris runs at <http://localhost:3000>. For one-click cloud deployment, see [`vercel-template.json`](./vercel-template.json) and the **Deploy with Vercel** button at the top of this README.

---

## Self-hosting

Iris is designed to run 100% locally with no cloud services or API keys required. Postgres can be a local instance, Redis can be omitted (Iris falls back gracefully), and you can use direct provider keys or local models via Ollama instead of the Vercel AI Gateway.

Full step-by-step instructions are in [`docs/self-hosting.md`](./docs/self-hosting.md).

---

## Scripts

From [`package.json`](./package.json):

| Script | What it does |
|---|---|
| `pnpm setup` | One-command local setup: Postgres in Docker, `.env.local`, migrations, dev server |
| `pnpm dev` | Run the Next.js dev server with Turbopack |
| `pnpm build` | Run database migrations, then build for production |
| `pnpm start` | Start the production server |
| `pnpm check` | Lint and check with Ultracite (Biome) |
| `pnpm fix` | Auto-fix lint/format issues |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations to the database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:push` / `db:pull` / `db:check` / `db:up` | Drizzle schema utilities |
| `pnpm test:unit` | Run unit tests with `tsx --test` |
| `pnpm test` | Run unit tests, then Playwright E2E (sets `PLAYWRIGHT=True`) |

---

## Architecture & integration

The main subsystems and where they live:

- **Chat route:** [`app/(chat)/api/chat/route.ts`](./app/(chat)/api/chat/route.ts) — auth, rate limiting, conversation budget and orchestration entry point.
- **Intelligence layer:** [`lib/ai/`](./lib/ai/) — smart router, system prompt, templates, memory, consensus, quality loop and providers.
- **Skill registry & tools:** [`lib/ai/skills/`](./lib/ai/skills/) and [`lib/ai/tools/`](./lib/ai/tools/).
- **Federation, governance & permissions:** [`lib/federation/`](./lib/federation/) (`governance.ts`, `registry.ts`, `tool-permissions.ts`).
- **MemPalace MCP connectivity:** [`lib/mempalace/`](./lib/mempalace/).
- **PersonGate sovereign handling:** [`lib/person-gate/index.ts`](./lib/person-gate/index.ts).
- **Collaborative artifacts:** [`lib/artifacts/`](./lib/artifacts/) and [`components/chat/`](./components/chat/).

A deeper architecture walkthrough lives in [`docs/integration.md`](./docs/integration.md).

---

## Sovereign data handling (PersonGate)

### Core rule (non-negotiable)

Whenever Iris handles anything involving a user's personal facts, case details, appeal, reasonable adjustment, disability context, or any interaction with external systems or institutions:

- **Never** send raw personal facts externally.
- **Always** use sovereign handling via [`@iris-gate/person`](https://github.com/ljbudgie/iris-gate-person).

### How it works

1. **Commit locally.** Call `personGate.commit(label, facts, tags?)`. This creates a cryptographic fingerprint (SHA-256 commitment); the real facts stay safely on-device.
2. **Send only the commitment.** Only the fingerprint is ever sent to any external party, institution or model.
3. **Receive and validate the receipt.** When a signed receipt comes back, use `personGate.receive(recordId, receipt)`.
4. **Tag the outcome.**
   - `SOVEREIGN` — a real human personally reviewed the specific facts of this case.
   - `NULL` — no individual human review (pure automation or blanket policy).
5. **If `NULL`:**
   - Add to the user's challenge list.
   - Offer to draft calm, factual advocacy language.
   - Generate a tribunal-ready export bundle with `personGate.exportRecord()`, including plain-English verification instructions.

### Available PersonGate capabilities

- `commit(label, facts, tags?)`
- `receive(recordId, receipt)`
- `challenge()` / `challengeAll()`
- `exportRecord(recordId)`
- `listRecords()`
- `search()` and encrypted vault tools

### Memory & orchestration

- Vault state and `NULL` challenges are persisted in Iris memory.
- In routing or consensus mode, PersonGate validation is required before any final output on personal matters.
- Every relevant response must internally answer the **Burgess Principle question**: *"Was a human judicial mind applied to the specific facts of this specific case?"*

### Optional dependency

`@iris-gate/person` is loaded dynamically by [`lib/person-gate/index.ts`](./lib/person-gate/index.ts), so Iris continues to run when the package isn't installed (commit `e3afd2b`). The bundled detection patterns in that file decide when sovereign handling is required.

**Core ethos:** the user is sovereign. Privacy and dignity come first. Automation must prove human review — or be challenged.

---

## Testing

- `pnpm test:unit` — runs the `tsx --test` unit suite in [`tests/unit/`](./tests/unit/) (currently `ai-helpers.test.ts`, `personal-assistant.test.ts`, `principles.test.ts`).
- `pnpm test` — runs unit tests, then Playwright E2E with `PLAYWRIGHT=True` (config in [`playwright.config.ts`](./playwright.config.ts)).
- `pnpm check` / `pnpm fix` — lint, format and auto-fix via Ultracite (Biome).

---

## Contributing

Please read [`iris-master-vision.md`](./iris-master-vision.md) first — it is the single source of truth, and every change should make Iris warmer, more human, more sovereign and unmatched on mobile. Before opening a PR:

- Run `pnpm check` and `pnpm test` (or at least `pnpm test:unit`) locally.
- Keep mobile-first and accessibility (WCAG 2.2 AA+) front of mind.
- Avoid generic defaults; push toward the Sovereign Command Centre described in the master vision.

---

## Disclaimer

Iris is **not legal advice**. Letter templates, guidance and AI-generated outputs are offered "as is" with no warranties; using them is at your own risk. AI models can make mistakes — always review generated content before sending it. If you need formal legal advice, please consult a qualified lawyer or adviser. Full text in [`DISCLAIMER.md`](./DISCLAIMER.md).

---

## License & credits

Licensed under the terms in [`LICENSE`](./LICENSE) ("SEE LICENSE IN LICENSE", per [`package.json`](./package.json)).

Built by Lewis Burgess and contributors, on top of the [Burgess Principle](https://github.com/ljbudgie/burgess-principle) (UK00004343685).

Take care.
