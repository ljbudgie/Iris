<p align="center">
  <a href="https://github.com/ljbudgie/Iris/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT_%2B_Burgess_Principle-7c3aed.svg" alt="MIT + Burgess Principle License" /></a>
  <a href="https://github.com/ljbudgie/Iris/stargazers"><img src="https://img.shields.io/github/stars/ljbudgie/Iris?style=social" alt="GitHub Stars" /></a>
  <a href="https://iris-gate.vercel.app"><img src="https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel" alt="Deployed on Vercel" /></a>
</p>

<h1 align="center">Iris ✨</h1>

<p align="center"><strong>The open-source AI assistant that puts people first.</strong></p>

<p align="center">
  Built on <a href="https://github.com/ljbudgie/burgess-principle">The Burgess Principle</a> — human-first governance, multi-model routing, and one beautiful interface.<br/>
  8 models · 5 providers · 18 letter templates · zero friction.
</p>

<p align="center">
  <a href="https://iris-gate.vercel.app">
    <img src="https://img.shields.io/badge/Try_Iris_live_%E2%86%92-7c3aed?style=for-the-badge" alt="Try Iris live →" />
  </a>
</p>

> **Origin** — Iris was built in a single day on a 2022 iPhone by someone who only discovered GitHub in January 2026. You don't need a fancy setup — just the Burgess Principle spirit and a dream.

<p align="center">
  <a href="#meet-iris"><strong>Meet Iris</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-skills--tools"><strong>Skills</strong></a> ·
  <a href="#-the-burgess-principle"><strong>Burgess Principle</strong></a> ·
  <a href="#-model-lineup"><strong>Models</strong></a> ·
  <a href="#-how-iris-compares"><strong>Compare</strong></a> ·
  <a href="#-architecture"><strong>Architecture</strong></a> ·
  <a href="#-deploy-your-own"><strong>Deploy</strong></a> ·
  <a href="#-running-locally"><strong>Run Locally</strong></a>
</p>

---

## Meet Iris

> *I'm here with you. Take your time — there's no rush. Whether you need help with a dispute, want to explore your rights, or just need someone who'll actually listen, I'm right here.*

Iris greets you with a **guided onboarding flow** — pick a common situation (benefits dispute, bailiff visit, automated decision, data access request) or jump straight into chatting. No config screens, no API key juggling, no friction.

Behind the scenes Iris routes your request to the best available model, generates streaming responses, opens documents and code in a **side-panel artifact viewer**, and can produce personalised **Burgess Principle letters** to help you challenge institutions that forgot to involve a human.

### What makes Iris different

| | |
|---|---|
| 🛡️ **Human-first governance** | Every AI output is flagged for human review via the SOVEREIGN/NULL gate |
| 📝 **Advocacy tools** | 18 letter templates for benefits disputes, bailiff visits, data access, and more |
| 🧠 **Multi-model intelligence** | 8 models across 5 providers with automatic failover — pick one or let Iris decide |
| 🎤 **Voice input** | Speak your request — Iris transcribes and responds naturally |
| 🧭 **Guided intake** | One-tap situation categories so vulnerable users aren't staring at a blank prompt |
| ⌨️ **Slash commands** | Type `/` for quick actions: new chat, clear, style changes, and more |
| 🌍 **Country-aware** | Geolocation selects the right legal framework (UK, US, EU, AU, CA) automatically |

---

## ⚡ Features

### Core

- **🧠 Multi-model routing** — 8 models across 5 providers with automatic failover via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- **⚖️ Burgess Principle governance** — SOVEREIGN/NULL gate ensures every AI output is flagged for human review ([learn more](#-the-burgess-principle))
- **📝 Letter generation** — 18 personalised templates for challenging automated decisions, requesting data access, and asserting your rights
- **🔍 Human-impact scanner** — Flags changes across 7 areas (accessibility, privacy, security, user language, billing, automated decisions, deployment)

### Experience

- **🧭 Guided intake** — Situation-aware onboarding cards (benefits, bailiffs, automated decisions, council tax, data access) so users aren't staring at a blank chat
- **💬 Follow-up suggestions** — AI-generated follow-up questions after each response to keep the conversation flowing
- **🎤 Voice input** — Browser-native speech recognition for hands-free interaction
- **⌨️ Slash commands** — Type `/` for quick actions (new chat, clear, style, and more)
- **📄 Artifacts** — Documents, code, and spreadsheets render in a side panel with versioning, diffs, and one-click restore
- **🎨 Beautiful UI** — Custom violet accent palette, spring animations, dark mode — built with [shadcn/ui](https://ui.shadcn.com), [Tailwind CSS](https://tailwindcss.com), and [Radix UI](https://radix-ui.com)

### Platform

- **🧩 Extensible skill registry** — Self-declaring tools with metadata, governance-aware filtering, and a factory pattern for context-dependent skills ([learn more](#-skills--tools))
- **🧠 MemPalace memory** — Optional [MemPalace](https://github.com/ljbudgie/mempalace) integration via MCP for persistent, structured AI memory (96.6% recall on LongMemEval)
- **📊 Audit trail** — Per-turn logging of model, tokens, tools invoked, and governance status
- **💰 Conversation budgets** — Per-chat turn and token limits (guest: 20 turns / 50K tokens, registered: 80 turns / 200K tokens)
- **🌍 Country-aware legal guidance** — Geolocation-based selection of UK GDPR, US CCPA/ADA, EU GDPR, AU Privacy Act, or CA PIPEDA
- **💾 Data persistence** — [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for chat history, [Vercel Blob](https://vercel.com/storage/blob) for files, [Redis](https://redis.io) for rate limiting
- **🔐 Auth.js** — Credential and guest authentication with tiered rate limits
- **⚙️ Next.js 16 App Router** — React Server Components, Server Actions, React Compiler, Turbopack
- **🤖 [Vercel AI SDK](https://ai-sdk.dev)** — Unified API for text generation, structured objects, and tool calls
- **🚀 One-click deploy** — Get your own Iris running on Vercel in minutes

---

## 🚀 Getting Started

The fastest way to try Iris:

1. **[Try it live →](https://iris-gate.vercel.app)** — no account required, guest mode included
2. **[Deploy your own](#-deploy-your-own)** — one-click Vercel deploy with your own API keys
3. **[Run locally](#-running-locally)** — full development setup with hot reload

---

## 🧩 Skills & Tools

Iris uses a **SkillRegistry** — a self-declaring, governance-aware tool registration layer. Each skill declares its own metadata so the registry can enforce governance rules automatically. Skills are defined in [`lib/ai/skills/`](lib/ai/skills/).

### Built-in Skills

| Skill | Description | Sensitivity | Tags |
|---|---|:---:|---|
| `getWeather` | Current weather by city name or coordinates | standard | utility, external-api |
| `createDocument` | Create a new artifact (code, text, or spreadsheet) | standard | artifact, document |
| `editDocument` | Edit an existing artifact using find-and-replace | standard | artifact, document |
| `updateDocument` | Full rewrite of an existing artifact | standard | artifact, document |
| `requestSuggestions` | Generate AI suggestions for an existing document | standard | artifact, document, suggestions |
| `suggestFollowUps` | Suggest 2–3 follow-up questions based on the conversation | standard | conversational, ux |
| `generateBurgessLetter` | Generate a personalised Burgess Principle letter from 18 templates | **sensitive** | burgess-principle, legal, advocacy |
| `mempalaceSearch` | Search the user's MemPalace for relevant memories | standard | mempalace, memory, search |
| `mempalaceStore` | Store verbatim content in the user's MemPalace | standard | mempalace, memory, write |
| `mempalaceStatus` | Get MemPalace status and wake-up context | standard | mempalace, memory, status |

> The 3 MemPalace skills are **conditional** — they only register when the `MEMPALACE_MCP_COMMAND` environment variable is set.

### Governance-Aware Filtering

Skills declare a **sensitivity** level:

- **`standard`** — safe for use without human review (informational or editorial)
- **`sensitive`** — produces formal outputs that could materially affect a user's legal or financial situation; requires **SOVEREIGN** governance status

When governance is **NULL**, the registry automatically excludes sensitive skills. When governance is **SOVEREIGN** (or when no governance layer is active), all skills are available.

### Extending with Custom Skills

Adding a new skill takes three steps:

1. Create your tool in `lib/ai/tools/` using the [Vercel AI SDK `tool()` helper](https://ai-sdk.dev)
2. Define a `SkillDefinition` with metadata (name, sensitivity, tags) in [`lib/ai/skills/built-in.ts`](lib/ai/skills/built-in.ts)
3. Call `skillRegistry.register(yourSkill)` — the registry handles governance filtering automatically

Context-free skills export a pre-built `tool`; skills that need runtime context (session, dataStream, modelId) use a `factory` function instead.

---

## ⚖️ The Burgess Principle

Iris is built on **[The Burgess Principle](https://github.com/ljbudgie/burgess-principle)** (UK Certification Mark UK00004343685) — a framework that asks one simple question:

> **"Was a human member of the team able to personally review the specific facts of my situation?"**

### How It Works

1. You politely ask an institution whether a real person reviewed the specific details of *your* case.
2. If they did — great, you have confirmation.
3. If not — you have a clear written record to follow up on, often combined with statutory rights (DSAR, FOI, Article 22, Equality Act).

### Governance Gate

Every AI response passes through a **SOVEREIGN/NULL gate**. A response is SOVEREIGN only when a human has reviewed the output for this specific user. Everything else is flagged as NULL. Sensitive tools (like Burgess letter generation) are restricted to SOVEREIGN status.

| Status | Meaning | Tool access |
|--------|---------|-------------|
| **SOVEREIGN** | A human has reviewed this output | All tools available |
| **NULL** | No human review has occurred | Sensitive tools filtered out |

### Letter Templates

When a user describes institutional unfairness or automated decisions, Iris generates a personalised letter from one of 18 templates:

| Category | Templates |
|---|---|
| **General** | General dispute, Human review request |
| **Data rights** | DSAR, FOI, GDPR Article 22 |
| **Disability & equality** | Equality Act, Reasonable adjustments |
| **Financial** | Benefits (PIP/UC/ESA), Council tax, Bailiffs, Direct debit |
| **Media & IP** | Media libel, Copyright, Music copyright, Platform moderation |
| **Technical** | Contract review, Coding agent review, Medical device |

### MemPalace Integration

Iris optionally integrates with [MemPalace](https://github.com/ljbudgie/mempalace) — a local-first, structured memory system for AI with 96.6% recall on LongMemEval. The integration uses **MCP JSON-RPC over stdio** and exposes three tools:

- **`mempalaceSearch`** — semantic search across palace memories with similarity scores
- **`mempalaceStore`** — store verbatim content in the palace (never summarised)
- **`mempalaceStatus`** — palace overview (total memories, wings, rooms) for wake-up context

Enable it by setting `MEMPALACE_MCP_COMMAND` in your environment. See [`lib/mempalace/`](lib/mempalace/) for details.

---

## 🧩 Model Lineup

Iris uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) for multi-provider routing with automatic failover. Models are configured in [`lib/ai/models.ts`](lib/ai/models.ts).

| Model | Provider | Strength | Routed via |
|---|---|---|---|
| **DeepSeek V3.2** | DeepSeek | Fast reasoning | Bedrock, DeepInfra |
| **Codestral** | Mistral | Strong coding | Mistral |
| **Mistral Small** | Mistral | Vision & speed | Mistral |
| **Kimi K2 0905** | Moonshot AI | Creative & balanced | Baseten, Fireworks |
| **Kimi K2.5** | Moonshot AI | Flagship quality | Fireworks, Bedrock |
| **GPT OSS 20B** | OpenAI | Compact & fast | Groq, Bedrock |
| **GPT OSS 120B** | OpenAI | Deep analysis | Fireworks, Bedrock |
| **Grok 4.1 Fast** *(featured)* | xAI | Ultra-fast chat | xAI |

5 of the 8 models have multi-provider failover — if one provider is slow or down, Iris automatically tries the next. You never notice.

> **Default** (`DEFAULT_CHAT_MODEL`) is Kimi K2 0905 — used when no model is selected. **Featured** (`FEATURED_MODEL_ID`) is Grok 4.1 Fast — highlighted in the onboarding UI. Both are configurable in [`lib/ai/models.ts`](lib/ai/models.ts) and [`lib/constants.ts`](lib/constants.ts).

> 💡 With the [AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers) you can swap in additional providers like Anthropic, Cohere, and more — just update [`lib/ai/models.ts`](lib/ai/models.ts).

### AI Gateway Authentication

- **Vercel deployments** — authentication is handled automatically via OIDC tokens.
- **Non-Vercel deployments** — set the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

---

## 🆚 How Iris Compares

Most AI chatbots are wrappers around a single model focused on general productivity. Iris is purpose-built for **advocacy, accountability, and user protection**.

| Feature | Iris | ChatGPT | Claude | Gemini | Copilot |
|---|:---:|:---:|:---:|:---:|:---:|
| **Open source** | ✅ [MIT + BP](LICENSE) | ❌ | ❌ | ❌ | ❌ |
| **Multi-model routing** | ✅ 8 models | ❌ Single | ❌ Single | ❌ Single | ❌ Single |
| **Automatic failover** | ✅ 5 providers | ❌ | ❌ | ❌ | ❌ |
| **Human-review governance** | ✅ SOVEREIGN/NULL | ❌ | ❌ | ❌ | ❌ |
| **Legal letter generation** | ✅ 18 templates | ❌ | ❌ | ❌ | ❌ |
| **Human-impact scanner** | ✅ 7 areas | ❌ | ❌ | ❌ | ❌ |
| **Guided intake** | ✅ 6 categories | ❌ | ❌ | ❌ | ❌ |
| **Voice input** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Per-turn audit trail** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Conversation budgets** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Country-aware legal guidance** | ✅ 5 jurisdictions | ❌ | ❌ | ❌ | ❌ |
| **Extensible skill registry** | ✅ 10 skills | ❌ | ❌ | ❌ | ❌ |
| **Self-hostable** | ✅ One-click | ❌ | ❌ | ❌ | ❌ |
| **Free to use** | ✅ | Freemium | Freemium | Freemium | Freemium |
| **Artifacts / side panel** | ✅ | ✅ Canvas | ✅ Artifacts | ✅ | ❌ |
| **Streaming responses** | ✅ | ✅ | ✅ | ✅ | ✅ |

> 💡 Iris isn't trying to replace general-purpose chatbots — it's the only one designed from the ground up to **protect people who've been failed by automated systems**.

---

## 🏗 Architecture

```
User
 │
 ├─ Guided Intake / Suggested Actions / Voice Input / Slash Commands
 │
 ▼
┌──────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (React Server Components)         │
│                                                          │
│  Auth (next-auth) → Rate Limiting (Redis) → Budget Check │
│         │                                                │
│         ▼                                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Skill Registry (10 tools)               │  │
│  │  standard: weather, documents, follow-ups, memory  │  │
│  │  sensitive: Burgess letter (SOVEREIGN only)        │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Governance Gate (SOVEREIGN / NULL)          │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │     Vercel AI SDK → AI Gateway (8 models)          │  │
│  │     Multi-provider routing + auto failover         │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Audit Trail (Neon Postgres)                       │  │
│  │  model · tokens · tools · governance status        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
         │
         │ (optional)
         ▼
┌──────────────────────────────────────────────────────────┐
│  MemPalace MCP Server (JSON-RPC over stdio)              │
│  https://github.com/ljbudgie/mempalace                   │
└──────────────────────────────────────────────────────────┘
```

For a detailed breakdown of every component, see [`docs/integration.md`](docs/integration.md).

---

## 🚀 Deploy Your Own

### One-click deploy (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ljbudgie/Iris)

This button:
- Forks the repo to your GitHub account
- Creates a new Vercel project
- Deploys Iris instantly

After deployment, add your API keys (for Grok, Kimi, DeepSeek, etc.) in the Vercel dashboard under **Environment Variables** (see [`.env.example`](.env.example)).

### Manual steps

1. Click **Fork** on this repo (top-right)
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **New Project** → Import your forked repo
4. Deploy (Vercel auto-detects Next.js)
5. Add your model API keys in **Project Settings → Environment Variables** (see [`.env.example`](.env.example))

Your own Iris will be live at `your-username-iris.vercel.app` (or connect a custom domain).

### Customisation ideas

Once deployed, you can:
- Change the default or featured model in [`lib/constants.ts`](lib/constants.ts)
- Update colours and branding in [`app/globals.css`](app/globals.css)
- Modify the system prompts in [`lib/ai/prompts.ts`](lib/ai/prompts.ts)
- Add or remove models in [`lib/ai/models.ts`](lib/ai/models.ts)
- Register new skills in [`lib/ai/skills/built-in.ts`](lib/ai/skills/built-in.ts)
- Extend the federation layer in [`lib/federation/`](lib/federation/)

---

## 🛠 Running Locally

You'll need the environment variables defined in [`.env.example`](.env.example). The easiest way is to use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables), but a local `.env` file works too.

> ⚠️ Don't commit your `.env` file — it contains secrets for your AI and auth providers.

```bash
# 1. Install Vercel CLI & link your project
npm i -g vercel
vercel link
vercel env pull

# 2. Install dependencies & run
pnpm install
pnpm db:migrate
pnpm dev
```

Iris will be running at [localhost:3000](http://localhost:3000) 🎉

### Useful commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Run migrations + production build |
| `pnpm check` | Lint with Biome (via ultracite) |
| `pnpm fix` | Auto-fix lint issues |
| `pnpm db:studio` | Open Drizzle Studio for the database |
| `pnpm test` | Run Playwright end-to-end tests |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request. Whether it's a bug fix, new feature, or documentation improvement — all contributions help make Iris better for the people who need it most.

---

## 📄 License

This project uses a **dual-licence model** aligned with [The Burgess Principle](https://github.com/ljbudgie/burgess-principle):

| What | Licence |
|---|---|
| **Source code** (application logic, UI, tooling) | [MIT](LICENSE) — fork, modify, build freely |
| **Burgess Principle content** (doctrine, templates, prompts, branding) | Free for personal use; [commercial licence required](LICENSE) |
| **"The Burgess Principle"** name & certification mark | Protected trademark (UK00004343685) |

See [LICENSE](LICENSE) and [DISCLAIMER](DISCLAIMER.md) for full details.
