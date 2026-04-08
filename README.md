<p align="center">
  <a href="https://github.com/ljbudgie/iris-gate/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/ljbudgie/iris-gate/stargazers"><img src="https://img.shields.io/github/stars/ljbudgie/iris-gate?style=social" alt="GitHub Stars" /></a>
  <a href="https://iris-gate.vercel.app"><img src="https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel" alt="Deployed on Vercel" /></a>
</p>

<p align="center">
  <a href="https://iris-gate.vercel.app">
    <img src="https://img.shields.io/badge/Try_it_live_%E2%86%92-7c3aed?style=for-the-badge" alt="Try it live →" />
  </a>
</p>

<a href="https://github.com/ljbudgie/iris-gate">
  <img alt="Iris" src="https://github.com/user-attachments/assets/98745b11-aa84-4e8b-b8cc-d748ab123a1c">
  <h1 align="center">Iris</h1>
</a>

<p align="center"><strong>The smartest way to access top AI models — one beautiful interface, zero hassle.</strong></p>

<p align="center">
  Iris is an open-source AI gateway that intelligently routes your requests across the best models available.<br/>
  Pick a model or let Iris choose for you. Fast responses, clean UI, one-click deploy.
</p>

<p align="center">
  <a href="#hi-im-iris-"><strong>Meet Iris</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-model-lineup"><strong>Models</strong></a> ·
  <a href="#-deploy-your-own"><strong>Deploy</strong></a> ·
  <a href="#-running-locally"><strong>Run Locally</strong></a>
</p>
<br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/4378028b-7dee-4e03-a5c1-0a8b9e601dff" alt="Iris chat interface" width="300" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://github.com/user-attachments/assets/dd678baa-41fb-42cf-98bf-e2b982619ef4" alt="Iris model selector" width="300" />
</p>

---

## Hi, I'm Iris ✨

> I connect you to the most powerful AI models and intelligently match each request to the best one for the job.
> Which model would you like to start with?

When you open Iris, you're greeted with a friendly onboarding step — clickable buttons for every model in the lineup, plus a **"Dismiss — use smart default"** option that picks the best model and drops you straight into chatting. No config screens, no API key juggling, no friction.

Once you pick a model (or let Iris decide), you get the full experience: streaming responses, side-panel artifacts for documents and code, and a polished dark-mode UI that feels premium from the first click.

---

## ⚡ Features

- **🧠 Intelligent multi-model routing** — 8 models across 5 providers with automatic failover via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- **🎨 Beautiful UI** — Custom violet accent palette, spring animations, dark mode, built with [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://radix-ui.com)
- **⚙️ Next.js App Router** — React Server Components, Server Actions, seamless navigation
- **🤖 [Vercel AI SDK](https://ai-sdk.dev)** — Unified API for text generation, structured objects, and tool calls
- **📄 Artifacts** — Documents, code, and spreadsheets render in a side panel for easy review and editing
- **💾 Data persistence** — [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for chat history, [Vercel Blob](https://vercel.com/storage/blob) for file storage, [Redis](https://redis.io) for rate limiting
- **🔐 Auth.js** — Credential and guest authentication with tiered rate limits
- **🚀 One-click deploy** — Get your own Iris instance running on Vercel in minutes

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

Get your own Iris up and running with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ljbudgie/iris-gate)

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

This project is open source under the [MIT License](LICENSE).
