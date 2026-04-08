<p align="center">
  <a href="https://github.com/ljbudgie/Iris/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT_%2B_Burgess_Principle-7c3aed.svg" alt="MIT + Burgess Principle License" /></a>
  <a href="https://github.com/ljbudgie/Iris/stargazers"><img src="https://img.shields.io/github/stars/ljbudgie/Iris?style=social" alt="GitHub Stars" /></a>
  <a href="https://iris-gate.vercel.app"><img src="https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel" alt="Deployed on Vercel" /></a>
</p>

<p align="center">
  <a href="https://iris-gate.vercel.app">
    <img src="https://img.shields.io/badge/Try_it_live_%E2%86%92-7c3aed?style=for-the-badge" alt="Try it live →" />
  </a>
</p>

<h1 align="center">Iris</h1>

<p align="center"><strong>An open-source AI assistant built on <a href="https://github.com/ljbudgie/burgess-principle">The Burgess Principle</a> — human-first governance, multi-model routing, one beautiful interface.</strong></p>

<p align="center">
  Iris routes your requests across the best AI models available while ensuring every automated output is flagged for human review.<br/>
  Pick a model or let Iris choose for you. Fast responses, clean UI, built-in safeguards.
</p>

<p align="center">
  <a href="#hi-im-iris-"><strong>Meet Iris</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-how-iris-compares"><strong>Compare</strong></a> ·
  <a href="#-the-burgess-principle"><strong>Burgess Principle</strong></a> ·
  <a href="#-model-lineup"><strong>Models</strong></a> ·
  <a href="#-deploy-your-own"><strong>Deploy</strong></a> ·
  <a href="#-running-locally"><strong>Run Locally</strong></a>
</p>
<br/>

---

## Hi, I'm Iris ✨

> I connect you to the most powerful AI models and ensure a real person can always review what matters.
> Which model would you like to start with?

When you open Iris, you're greeted with a friendly onboarding step — clickable buttons for every model in the lineup, plus a **"Dismiss — use smart default"** option that picks the best model and drops you straight into chatting. No config screens, no API key juggling, no friction.

Once you pick a model (or let Iris decide), you get the full experience: streaming responses, side-panel artifacts for documents and code, Burgess Principle letter generation, and a polished dark-mode UI that feels premium from the first click.

---

## ⚡ Features

- **🧠 Intelligent multi-model routing** — 8 models across 5 providers with automatic failover via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- **⚖️ Burgess Principle governance** — SOVEREIGN/NULL gate ensures every AI output is flagged for human review before reaching vulnerable users ([learn more](#-the-burgess-principle))
- **📝 Burgess Principle letters** — 18 personalised letter templates for challenging automated decisions, requesting data access, and asserting your rights
- **🔍 Human-impact scanner** — Flags changes across 7 areas (accessibility, privacy, security, user language, billing, automated decisions, deployment) for human review
- **📊 Audit trail** — Per-turn logging of model usage, token consumption, tools invoked, and governance status
- **💰 Conversation budgets** — Per-chat turn and token limits to prevent cost overruns (guest: 20 turns / 50K tokens, registered: 80 turns / 200K tokens)
- **🎨 Beautiful UI** — Custom violet accent palette, spring animations, dark mode, built with [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://radix-ui.com)
- **⚙️ Next.js App Router** — React Server Components, Server Actions, seamless navigation
- **🤖 [Vercel AI SDK](https://ai-sdk.dev)** — Unified API for text generation, structured objects, and tool calls
- **📄 Artifacts** — Documents, code, and spreadsheets render in a side panel for easy review and editing
- **💾 Data persistence** — [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for chat history, [Vercel Blob](https://vercel.com/storage/blob) for file storage, [Redis](https://redis.io) for rate limiting
- **🌍 Country-aware legal guidance** — Geolocation-based selection of the right legal framework (UK GDPR, US CCPA/ADA, EU GDPR, AU Privacy Act, CA PIPEDA)
- **🔐 Auth.js** — Credential and guest authentication with tiered rate limits
- **🚀 One-click deploy** — Get your own Iris instance running on Vercel in minutes

---

## 🆚 How Iris Compares

Most AI chatbots are wrappers around a single model focused on general productivity. Iris is purpose-built for **advocacy, accountability, and user protection**. Here's how it stacks up:

| Feature | Iris | ChatGPT | Claude | Gemini | Copilot |
|---|:---:|:---:|:---:|:---:|:---:|
| **Open source** | ✅ [MIT + BP](LICENSE) | ❌ | ❌ | ❌ | ❌ |
| **Multi-model routing** | ✅ 8 models | ❌ Single | ❌ Single | ❌ Single | ❌ Single |
| **Automatic provider failover** | ✅ 5 providers | ❌ | ❌ | ❌ | ❌ |
| **Human-review governance gate** | ✅ SOVEREIGN/NULL | ❌ | ❌ | ❌ | ❌ |
| **Legal letter generation** | ✅ 18 templates | ❌ | ❌ | ❌ | ❌ |
| **Human-impact scanner** | ✅ 7 areas | ❌ | ❌ | ❌ | ❌ |
| **Per-turn audit trail** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Conversation budgets** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Country-aware legal guidance** | ✅ 5 jurisdictions | ❌ | ❌ | ❌ | ❌ |
| **Self-hostable** | ✅ One-click | ❌ | ❌ | ❌ | ❌ |
| **Free to use** | ✅ | Freemium | Freemium | Freemium | Freemium |
| **Artifacts / side panel** | ✅ | ✅ Canvas | ✅ Artifacts | ✅ | ❌ |
| **Streaming responses** | ✅ | ✅ | ✅ | ✅ | ✅ |

> 💡 Iris isn't trying to replace general-purpose chatbots — it's the only one designed from the ground up to **protect people who've been failed by automated systems**.

---

## ⚖️ The Burgess Principle

Iris is built on **[The Burgess Principle](https://github.com/ljbudgie/burgess-principle)** (UK Certification Mark UK00004343685) — a framework that asks one simple question:

> **"Was a human member of the team able to personally review the specific facts of my situation?"**

### Governance Gate

Every AI response passes through a **SOVEREIGN/NULL gate** before reaching the user. A response is SOVEREIGN only when a human has reviewed the output for this specific user. Everything else is flagged as NULL and queued for human review. Sensitive tools (like Burgess letter generation) are restricted to SOVEREIGN status.

### Letter Templates

When a user describes a situation involving institutional unfairness or automated decisions, Iris can generate a personalised letter using one of 18 templates:

| Category | Templates |
|---|---|
| **General** | General dispute, Human review request |
| **Data rights** | DSAR, FOI, GDPR Article 22 |
| **Disability & equality** | Equality Act, Reasonable adjustments |
| **Financial** | Benefits (PIP/UC/ESA), Council tax, Bailiffs, Direct debit |
| **Media & IP** | Media libel, Copyright, Music copyright, Platform moderation |
| **Technical** | Contract review, Coding agent review, Medical device |

### MemPalace Integration

Iris is aware of the [MemPalace](https://github.com/ljbudgie/mempalace) memory architecture — a local-first, structured memory system for AI with 96.6% recall on LongMemEval benchmarks.

---

## 🧩 Model Lineup

Iris uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to route across multiple providers with automatic failover. Models are configured in [`lib/ai/models.ts`](lib/ai/models.ts).

| Model | Provider | Routed via |
|---|---|---|
| **DeepSeek V3.2** | DeepSeek | Bedrock, DeepInfra |
| **Codestral** | Mistral | Mistral |
| **Mistral Small** | Mistral | Mistral |
| **Kimi K2 0905** *(default)* | Moonshot AI | Baseten, Fireworks |
| **Kimi K2.5** | Moonshot AI | Fireworks, Bedrock |
| **GPT OSS 20B** | OpenAI | Groq, Bedrock |
| **GPT OSS 120B** | OpenAI | Fireworks, Bedrock |
| **Grok 4.1 Fast** | xAI | xAI |

5 of the 8 models have multi-provider failover — if one provider is slow or down, Iris automatically tries the next one. You never notice.

> 💡 With the [AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers) you can swap in additional providers like OpenAI, Anthropic, Cohere, and more — just update [`lib/ai/models.ts`](lib/ai/models.ts).

### AI Gateway Authentication

- **Vercel deployments** — authentication is handled automatically via OIDC tokens.
- **Non-Vercel deployments** — set the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

---

## 🚀 Deploy Your Own

### One-click deploy (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ljbudgie/Iris)

This button:
- Forks the repo to your GitHub account
- Creates a new Vercel project
- Deploys Iris instantly

After deployment, add your API keys (for Grok, Kimi, DeepSeek, etc.) in the Vercel dashboard under **Environment Variables** (see [`.env.example`](.env.example)).

### Manual steps (if you prefer)

1. Click **Fork** on this repo (top-right)
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **New Project** → Import your forked repo
4. Deploy (Vercel auto-detects Next.js)
5. Add your model API keys in **Project Settings → Environment Variables** (see [`.env.example`](.env.example))

Your own Iris will be live at `your-username-iris.vercel.app` (or connect a custom domain).

### Customisation ideas

Once deployed, you can:
- Change the default model
- Update colours and branding
- Modify the Burgess Principle prompts
- Add or remove models in [`lib/ai/models.ts`](lib/ai/models.ts)
- Extend the federation layer

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

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request. Whether it's a bug fix, new feature, or documentation improvement — all contributions help make Iris better.

---

## 📄 License

This project uses a **dual-licence model** aligned with [The Burgess Principle](https://github.com/ljbudgie/burgess-principle):

| What | Licence |
|---|---|
| **Source code** (application logic, UI, tooling) | [MIT](LICENSE) — fork, modify, build freely |
| **Burgess Principle content** (doctrine, templates, prompts, branding) | Free for personal use; [commercial licence required](LICENSE) |
| **"The Burgess Principle"** name & certification mark | Protected trademark (UK00004343685) |

See [LICENSE](LICENSE) and [DISCLAIMER](DISCLAIMER.md) for full details.
