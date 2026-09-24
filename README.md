# Iris

Iris is for every person. If a system made a decision about you — a bill, a benefit, a job, a school, a tenancy, a hospital, a platform — Iris helps you ask whether a named human reviewed the specific facts of your specific situation before they acted.

It is governed by [The Burgess Principle](https://github.com/ljbudgie/burgess-principle) (UK Certification Mark UK00004343685). Iris is **not legal advice**. The legal foundations live in the principle repository. Please read the [disclaimer](./DISCLAIMER.md) before you rely on anything Iris drafts.

**[Open Iris](https://iris-gate.vercel.app)** &nbsp; · &nbsp; **[Run it on your own machine](./docs/self-hosting.md)** &nbsp; · &nbsp; **[One-command setup](#quick-start)**

![License](https://img.shields.io/badge/license-SEE%20LICENSE-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![pnpm](https://img.shields.io/badge/pnpm-10-f69220) ![Playwright](https://img.shields.io/badge/tested%20with-Playwright-2EAD33)

---

## The question

Ask this, word for word:

> Was a human member of the team able to personally review the specific facts of my specific situation?

There are three findings. Process language is not a person.

| Finding | What it means |
|---|---|
| **SOVEREIGN** | A named human individually reviewed your specific facts before they acted. |
| **NULL** | No individual human reviewed them. The decision was processed, not considered. |
| **AMBIGUOUS** | Vague process language — "human oversight", "reviewed in line with policy", "a member of the team" — without a named person and the facts they reviewed. |

**NULL** or **AMBIGUOUS** is the place you ask again, for a name, a role, and a date. It is not a verdict on you. **SOVEREIGN** means a named person looked at your facts before power was used. A finding is advisory until a named human stands behind it.

That is the whole test. You do not need legal training to ask it. It is the same question in any country, to any institution, about any person.

## What Iris does with it

Iris is the governing layer on the model underneath it. Iris is not a second chatbot, and the model does not get to grade the principle.

1. **Ask the question** with you, in calm language you can send.
2. **Classify a reply they sent** as SOVEREIGN, NULL, or AMBIGUOUS inside Iris, before the model speaks. See [`docs/governing-layer.md`](./docs/governing-layer.md).
3. **Bind that finding.** The model may explain it. The model may not change it, soften it, or argue both sides of it.
4. **Keep your facts with you.** Memory stays on your device unless you choose to include it. A letter carries the question word for word.
5. **Say who spoke.** The reply names the model and says Iris governed it.

Your own account of what happened is not treated as the institution's reply. Ordinary conversation is not classified.

## Who it is for

Everyone a system can process.

You do not need to be a lawyer, a developer, or disabled. You do not need to live in the UK. You do not need to have heard of the framework before today.

Access needs are the floor, not a special case. Calm mode, reduced motion, and email-only contact are built in. If a reasonable adjustment was refused, that is an ordinary thing to bring here.

Lewis Burgess built Iris because he is disabled and got tired of being processed instead of reviewed. That is why it exists. It is not a limit on who it is for.

> **Why I built this →** [`docs/founder.md`](./docs/founder.md). Product direction lives in [`iris-master-vision.md`](./iris-master-vision.md).

---

## Quick start

The fastest path — one command from a fresh clone:

```bash
git clone https://github.com/ljbudgie/Iris.git
cd Iris
pnpm setup
```

`pnpm setup` brings up Postgres in Docker, writes `.env.local` (with a fresh `AUTH_SECRET` and `IRIS_LOCAL_ONLY=1`), installs deps, runs migrations and starts the dev server. See [`docs/deploy.md`](./docs/deploy.md) for the fastest offline path and [`docs/self-hosting.md`](./docs/self-hosting.md) for a manual walkthrough.

If you'd rather do it by hand:

```bash
pnpm install
cp .env.example .env.local   # then fill in the values you need
pnpm db:migrate
pnpm dev
```

Iris runs at <http://localhost:3000>. Local-only is the default, so a fresh install does not need a cloud key.

---

## If you are running Iris

- **Local-first by default.** `IRIS_LOCAL_ONLY=1` keeps Iris on your machine via Ollama. The router will not silently pick a cloud model. See [`docs/self-hosting.md`](./docs/self-hosting.md).
- **The gate is on with no peers.** Federation is optional. Zero peers is not a broken Iris. Models and peers are counted separately.
- **The finding is computed in Iris** ([`lib/ai/governing-layer.ts`](./lib/ai/governing-layer.ts)) and handed to the model as a binding note.
- **No single company is the product.** If one model is withdrawn, rate-limited, or switched off, Iris tries the next and tells you. One provider going dark does not take Iris with it. See [Resilience](#resilience-by-design).
- **Memory can be forgotten.** The `/memory` page shows whether MemPalace is authoritative or session-only, and a row can be forgotten.
- **Calm mode.** The shell honours `prefers-reduced-motion`, and ⌘K can turn animation off.
- **A household hub.** `IRIS_HUB_MODE=1` lets phones on the same network use one machine instead of the cloud ([`docs/sovereign-hub.md`](./docs/sovereign-hub.md)).

## Resilience by design

On 12–13 June 2026, the US Commerce Department ordered Anthropic to suspend
access to its newest models — Claude Fable 5 and Claude Mythos 5 — for
export-control reasons. Anthropic complied by disabling both models
**globally, for every user, including paying enterprise customers and
Anthropic's own staff** — not as a targeted block on one country's users,
but as a complete, overnight withdrawal because the order's scope made
anything narrower impractical.

Nobody using those models — anywhere, including in the US — had any warning,
and no recourse. One regulatory letter to one company removed a tool that
hundreds of millions of people had access to three days earlier.

This is exactly the failure mode Iris is built to survive, and it isn't a
hypothetical anymore.

**How Iris handles it:**

- **Local-first is the default.** `IRIS_LOCAL_ONLY=1` runs Iris entirely on
  your own machine via Ollama — no cloud provider, no API call, nothing for
  any company or government to switch off. See
  [`docs/self-hosting.md`](./docs/self-hosting.md).

- **No single provider is "the" provider.** When running with cloud models,
  Iris's [smart router](./lib/ai/smart-router.ts) draws from eight models
  across seven providers (Mistral, Moonshot AI, DeepSeek, OpenAI, xAI, and
  others via the Vercel AI Gateway). The default model is Kimi K2 — not a
  model from the provider whose models were just pulled. Anthropic models
  are not part of Iris's default pool at all.

- **Automatic fallback within a session.** If your chosen model returns an
  availability-shaped error — withdrawn, rate-limited, region-blocked,
  overloaded — Iris automatically tries the next model in its resilience
  pool and tells you plainly what happened ("Switched to Kimi K2 0905 —
  Codestral was temporarily unavailable"). Your conversation continues. See
  [`lib/ai/providers.resilient.ts`](./lib/ai/providers.resilient.ts).

- **Defence-in-depth for local-only mode.** When `IRIS_LOCAL_ONLY=1` is set,
  the smart router refuses to select any cloud model — even if one is
  explicitly requested — and the provider layer enforces the same rule
  independently. Two layers, so a bug in one doesn't silently leak a request
  to the cloud.

**The point:** whatever happens to any one AI company's models — a
regulatory order, a policy change, a pricing shift, a jailbreak finding, a
company shutting down — Iris keeps working. Not because Iris bet on the
"safe" provider, but because it never bet on one provider at all. If you
want the strongest version of that guarantee, run Iris locally; nothing
above the hardware you own can take it away.

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

- **Governing layer:** [`lib/ai/governing-layer.ts`](./lib/ai/governing-layer.ts) — classifies a pasted reply before the model is called. See [`docs/governing-layer.md`](./docs/governing-layer.md).
- **Chat route:** [`app/(chat)/api/chat/route.ts`](./app/(chat)/api/chat/route.ts) — auth, rate limiting, conversation budget and orchestration entry point.
- **Intelligence layer:** [`lib/ai/`](./lib/ai/) — smart router, system prompt, templates, memory, consensus, quality loop and providers.
- **Skill registry & tools:** [`lib/ai/skills/`](./lib/ai/skills/) and [`lib/ai/tools/`](./lib/ai/tools/).
- **Federation, governance & permissions:** [`lib/federation/`](./lib/federation/) (`governance.ts`, `registry.ts`, `tool-permissions.ts`).
- **MemPalace MCP connectivity:** [`lib/mempalace/`](./lib/mempalace/).
- **PersonGate sovereign handling:** [`lib/person-gate/index.ts`](./lib/person-gate/index.ts).
- **Collaborative artifacts:** [`lib/artifacts/`](./lib/artifacts/) and [`components/chat/`](./components/chat/).

A deeper architecture walkthrough lives in [`docs/integration.md`](./docs/integration.md).

---

## Personal facts (PersonGate)

### Core rule (non-negotiable)

Whenever Iris handles anything involving a user's personal facts, case details, appeal, reasonable adjustment, disability context, or any interaction with external systems or institutions:

- **Never** send raw personal facts externally.
- **Always** use sovereign handling via [`@iris-gate/person`](https://github.com/ljbudgie/iris-gate-person).

### How it works

1. **Commit locally.** Call `personGate.commit(label, facts, tags?)`. This creates a cryptographic fingerprint (SHA-256 commitment). The facts stay on the device.
2. **Share the commitment, not the file.** When a record is handed to an institution or another system, the fingerprint is what goes. A message you type in chat is still sent to the model you chose to run. If that model is on your machine (`IRIS_LOCAL_ONLY=1`), it does not leave it.
3. **Receive and validate the receipt.** When a signed receipt comes back, use `personGate.receive(recordId, receipt)`.
4. **Tag the outcome.** One finding only.
   - `SOVEREIGN` — a named human reviewed the specific facts before acting.
   - `NULL` — no individual human reviewed them.
   - `AMBIGUOUS` — process language, and no named person.
5. **If `NULL` or `AMBIGUOUS`:**
   - Add it to the person's challenge list.
   - Offer calm language that asks the question again.
   - A tribunal-ready export is available with `personGate.exportRecord()`, including plain-English verification instructions. It is not legal advice.

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
- Every relevant response must hold the **Burgess question**, word for word: *"Was a human member of the team able to personally review the specific facts of my specific situation?"*

### Optional dependency

`@iris-gate/person` is loaded dynamically by [`lib/person-gate/index.ts`](./lib/person-gate/index.ts), so Iris continues to run when the package isn't installed (commit `e3afd2b`). The bundled detection patterns in that file decide when sovereign handling is required.

**Core ethos:** a person is not a data point. Dignity comes first. Automation names the human who reviewed the specific facts, or the finding stays NULL or AMBIGUOUS.

---

## Testing

- `pnpm test:unit` — runs the `tsx --test` unit suite in [`tests/unit/`](./tests/unit/), including the governing-layer classifier.
- `pnpm test` — runs unit tests, then Playwright E2E with `PLAYWRIGHT=True` (config in [`playwright.config.ts`](./playwright.config.ts)).
- `pnpm check` / `pnpm fix` — lint, format and auto-fix via Ultracite (Biome).

---

## Contributing

Please read [`iris-master-vision.md`](./iris-master-vision.md) and [`docs/governing-layer.md`](./docs/governing-layer.md) first. Every change should make Iris warmer, more human, and faithful to the Burgess test — one question, three findings, the model bound by the finding — and unmatched on mobile. Before opening a PR:

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
