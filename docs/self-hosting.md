# Self-Hosting Iris Locally

Iris is designed to run 100% locally with no cloud services or API keys required. This guide maps every cloud dependency to its local alternative and walks you through a fully offline setup.

---

## Cloud → Local Dependency Map

| Cloud Service | Used For | Local Alternative |
|---|---|---|
| Neon Postgres (`POSTGRES_URL`) | Database | Local PostgreSQL instance |
| Vercel Blob (`BLOB_READ_WRITE_TOKEN`) | File uploads | Local filesystem (disable blob features or use a local S3-compatible store) |
| Redis (`REDIS_URL`) | Resumable streams | Omit — Iris gracefully falls back when Redis is unavailable |
| Vercel AI Gateway (`AI_GATEWAY_API_KEY`) | Multi-model routing | Direct provider API keys (OpenAI, Anthropic, etc.) or local models via Ollama |
| Vercel Hosting | Deployment | `next start` on your own machine or any Node.js host |

---

## Step-by-Step Local Setup

### 1. Prerequisites

- **Node.js** 20+ and **pnpm** 10+
- **PostgreSQL** 14+ (local instance)
- **Git**

### 2. Clone and Install

```bash
git clone https://github.com/ljbudgie/Iris.git
cd Iris
pnpm install
```

### 3. Configure Local PostgreSQL

Start your local PostgreSQL server and create a database:

```bash
createdb iris_local
```

### 4. Environment Variables

Copy `.env.example` to `.env.local` and configure for local use:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Generate a random secret (required for auth)
AUTH_SECRET=your-random-secret-here

# Local PostgreSQL connection string
POSTGRES_URL=postgresql://localhost:5432/iris_local

# Optional: Redis for resumable streams (omit if not needed)
# REDIS_URL=redis://localhost:6379

# Optional: MemPalace for long-term memory
# MEMPALACE_MCP_COMMAND="python -m mempalace.mcp_server"
```

### 5. Run Database Migrations

```bash
pnpm db:migrate
```

### 6. Start Iris

```bash
pnpm dev
```

Visit `http://localhost:3000` — Iris is running on your machine, fully local.

---

## Using Local AI Models

To run completely offline (no API calls to cloud AI providers), you can use [Ollama](https://ollama.ai) or any OpenAI-compatible local model server.

1. Install and start Ollama
2. Pull a model: `ollama pull llama3`
3. Configure Iris to use your local endpoint by setting the appropriate provider environment variables

---

## MemPalace (Optional Local Memory)

MemPalace is Iris's long-term verbatim memory system. It runs entirely on your machine:

```bash
pip install mempalace
```

Add to your `.env.local`:

```env
MEMPALACE_MCP_COMMAND="python -m mempalace.mcp_server"
```

All memories are stored locally — nothing leaves your machine.

---

## What Works Without Cloud Services

| Feature | Works Locally? | Notes |
|---|---|---|
| Chat conversations | ✅ | Requires a local AI model or API key |
| Burgess Principle letters | ✅ | Full template library available |
| MemPalace memory | ✅ | Local Python process |
| Chat history | ✅ | Stored in local PostgreSQL |
| User data export | ✅ | All data stays on your machine |
| Resumable streams | ⚠️ | Requires Redis (graceful fallback without) |
| File uploads | ⚠️ | Requires Vercel Blob or alternative blob storage |
| Voice input | ✅ | Browser-native speech recognition |

---

## Production Local Deployment

For a production-grade local deployment:

```bash
pnpm build
pnpm start
```

This runs the optimised production build on `http://localhost:3000`.

---

## Your Data, Your Machine

When self-hosting, every piece of data — conversations, memories, documents, audit logs — lives on your machine in your PostgreSQL database. Nothing is sent to external services unless you explicitly configure an AI provider that requires API calls.

This is the Burgess Principle in practice: **your data belongs to you**.
