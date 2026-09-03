# Integration Guide

This guide explains how Iris's internal components connect and interact.
It covers the federation layer, governance gate, skill registry, tool
permissions, audit trail, and MemPalace MCP connectivity.

---

## Architecture Overview

```
User
 │
 ▼
┌──────────────────────────────────────────────────────┐
│  Next.js App Router                                  │
│  app/(chat)/api/chat/route.ts                        │
│                                                      │
│  ┌────────────────┐   ┌────────────────────────────┐ │
│  │  Auth + Rate   │   │  Conversation Budget       │ │
│  │  Limiting      │   │  (turn + token limits)     │ │
│  └───────┬────────┘   └──────────┬─────────────────┘ │
│          │                       │                    │
│          ▼                       ▼                    │
│  ┌───────────────────────────────────────────────┐   │
│  │              Skill Registry                    │   │
│  │         lib/ai/skills/registry.ts              │   │
│  │                                                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │ Weather  │ │ Document │ │ Burgess Letter │  │   │
│  │  │ standard │ │ standard │ │  sensitive     │  │   │
│  │  └──────────┘ └──────────┘ └───────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │FollowUps │ │Suggestions│ │ MemPalace     │  │   │
│  │  │ standard │ │ standard │ │  standard     │  │   │
│  │  └──────────┘ └──────────┘ └───────────────┘  │   │
│  └───────────────────┬───────────────────────────┘   │
│                      │                                │
│                      ▼                                │
│  ┌───────────────────────────────────────────────┐   │
│  │          Governance Gate                       │   │
│  │     lib/federation/governance.ts               │   │
│  │                                                │   │
│  │  SOVEREIGN ──► all tools available             │   │
│  │  NULL      ──► sensitive tools filtered out    │   │
│  └───────────────────┬───────────────────────────┘   │
│                      │                                │
│                      ▼                                │
│  ┌───────────────────────────────────────────────┐   │
│  │         Vercel AI SDK (streamText)             │   │
│  │    Multi-model routing via AI Gateway          │   │
│  │    8 models · 5 providers · auto failover      │   │
│  └───────────────────┬───────────────────────────┘   │
│                      │                                │
│                      ▼                                │
│  ┌───────────────────────────────────────────────┐   │
│  │            Audit Trail                         │   │
│  │       lib/db/schema.ts (chatAuditLog)          │   │
│  │   modelId · tokens · tools · governanceStatus  │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
         │
         │ (optional, when MEMPALACE_MCP_COMMAND is set)
         ▼
┌──────────────────────────────────────────────────────┐
│        MemPalace MCP Server (Python)                 │
│    https://github.com/ljbudgie/mempalace             │
│                                                      │
│    JSON-RPC 2.0 over stdio                           │
│    19 tools: search, store, KG, diary, Burgess       │
└──────────────────────────────────────────────────────┘
```

---

## Skill Registry

**Location:** `lib/ai/skills/`

The skill registry is a self-describing, governance-aware tool registration
layer inspired by the [nexus-ai-hub](https://github.com/ljbudgie/nexus-ai-hub)
OpenClaw `SkillRegistry` pattern. Each skill declares its own metadata
(name, sensitivity, tags) so the registry can enforce governance rules
automatically.

### How It Works

1. **Skills are defined** in `lib/ai/skills/built-in.ts` — each wraps an
   existing tool from `lib/ai/tools/` with metadata.

2. **Skills declare sensitivity** — `"standard"` or `"sensitive"`. Sensitive
   skills (like `generateBurgessLetter`) are filtered out when governance
   status is `NULL`.

3. **The chat route** imports `@/lib/ai/skills/built-in` to register all
   skills, then calls `skillRegistry.buildTools(ctx, governanceStatus)` to
   construct the `tools` object for `streamText()`.

4. **Tool permissions** (`lib/federation/tool-permissions.ts`) now delegate
   to the registry instead of maintaining separate hardcoded lists.

### Adding a New Skill

```typescript
// 1. Create the tool in lib/ai/tools/my-tool.ts
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Does something useful",
  inputSchema: z.object({ input: z.string() }),
  execute: async ({ input }) => ({ result: input }),
});

// 2. Register it in lib/ai/skills/built-in.ts
import { myTool } from "@/lib/ai/tools/my-tool";

const mySkill: SkillDefinition = {
  metadata: {
    name: "myTool",
    description: "Does something useful",
    version: "1.0.0",
    sensitivity: "standard", // or "sensitive"
    tags: ["custom"],
    requiresContext: false,
  },
  tool: myTool,
};

// Add to builtInSkills array
```

For skills that need runtime context (session, dataStream, modelId), use
the factory pattern:

```typescript
const myContextSkill: SkillDefinition = {
  metadata: {
    name: "myContextTool",
    description: "Needs session context",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["custom"],
    requiresContext: true,
  },
  factory: (ctx) => myContextTool(ctx as MyToolProps),
};
```

---

## Governance Gate (SOVEREIGN/NULL)

**Location:** `lib/federation/governance.ts`

The Burgess Principle governance gate ensures every AI output is flagged
for human review. The gate operates on a binary status:

| Status | Meaning | Tool access |
|--------|---------|-------------|
| **SOVEREIGN** | A human has reviewed this output for this user | All tools available |
| **NULL** | No human review has occurred | Sensitive tools filtered out |

### How It Connects

1. The chat route determines `governanceStatus` (currently defaults to
   `undefined` → treated as SOVEREIGN for direct Iris usage).

2. `getPermittedTools(governanceStatus)` queries the skill registry to
   return only permitted tool names.

3. `skillRegistry.buildTools(ctx, governanceStatus)` excludes sensitive
   tools from the tools object when status is NULL.

4. The governance status is recorded in every audit log entry.

### Federation Providers

The federation layer (`lib/federation/registry.ts`) maintains an in-memory
registry of external providers. Each provider:

- Must accept the governance protocol (UK Certification Mark UK00004343685)
- Starts with `NULL` governance status
- Can be promoted to `SOVEREIGN` via `updateGovernanceStatus()`

Federated responses pass through `applyGovernanceGate()` which enforces
the SOVEREIGN/NULL binary.

---

## Integration Contract v2.0 Endpoints

Iris exposes the [Integration Contract v2.0](https://github.com/ljbudgie/burgess-principle)
core verification surface locally. All classifications are **advisory only**
until a named human attributes the finding.

### `POST /api/verify`

Verify Burgess reasoning text against a SHA-256 digest
(`app/(chat)/api/verify/route.ts`, `lib/certification/verify-digest.ts`).

```json
{ "text": "reasoning text…", "digest": "64-char sha-256 hex" }
```

Returns `{ "match": true|false, "algorithm": "SHA-256", "computed_digest": "…" }`.

### `POST /api/scrutiny/assess`

Run the pre-decision Burgess gate before a system acts on an identified
individual (`app/(chat)/api/scrutiny/assess/route.ts`, `lib/scrutiny/assess.ts`).
Accepts the Model Clause limb answers (`namedOfficer`, `role`,
`reviewedSpecificFacts`, `adjustmentApplied`, `liveProceedingChecked`,
`recordedAndDisclosable`, `processLanguage`) and returns SOVEREIGN, NULL, or
AMBIGUOUS plus the required next action.

Optionally include an `attribution` block (`{ "name", "role", "reviewedAt" }`)
to have a named human attribute the finding
(`lib/scrutiny/attribution.ts`). Attribution is refused for collective or
process language ("the team", "customer services", "automated process") —
the Burgess standard requires a specific named human being.

### `POST /api/loop/classify`

Classify a local correspondence thread for institutional delay patterns
(`app/(chat)/api/loop/classify/route.ts`, `lib/loop/classify-thread.ts`).

### `/api/challenges`

- `GET` lists the statutory challenge routes Iris can draft (SAR, Article
  15(1)(h), Article 16, Article 17, DUAA 2025 notice, Equality Act 2010
  adjustment notice, pre-action protocol) with their statutory bases and
  deadline rules.
- `POST` generates a statutory challenge letter from a completed NULL or
  AMBIGUOUS certification record (`lib/challenges/workflow.ts`). SOVEREIGN
  records are rejected — there is nothing to challenge.

---

## Tool Permission Gating

**Location:** `lib/federation/tool-permissions.ts`

Tool permissions are now derived from the skill registry rather than
hardcoded arrays. The module provides:

- `getPermittedTools(governanceStatus)` — returns tool names permitted for
  the given status
- `isToolPermitted(toolName, governanceStatus)` — checks a single tool

Both functions delegate to the skill registry, which checks each skill's
`sensitivity` metadata field.

---

## Audit Trail

**Location:** `lib/db/schema.ts` → `chatAuditLog` table

Every assistant turn is logged with:

| Field | Type | Description |
|-------|------|-------------|
| `chatId` | UUID | Chat session identifier |
| `messageId` | string | Message identifier |
| `userId` | UUID | User who initiated the turn |
| `modelId` | string | AI model used (e.g. `moonshotai/kimi-k2-0905`) |
| `promptTokens` | integer | Input tokens consumed |
| `completionTokens` | integer | Output tokens generated |
| `totalTokens` | integer | Total tokens for the turn |
| `toolsInvoked` | JSON | Array of tool names called during the turn |
| `governanceStatus` | enum | `SOVEREIGN` or `NULL` at time of response |
| `createdAt` | timestamp | When the turn was processed |

The audit trail is written non-blocking via `saveChatAuditEntry()` after
each `streamText()` completion. It captures token usage and tool
invocations for compliance tracking.

### Viewing Audit Logs

The audit UI is at `/audit` (requires authentication). It shows per-turn
entries with model, token usage, tools invoked, and governance status.

---

## Conversation Budgets

**Location:** `lib/ai/conversation-budget.ts`, `lib/ai/entitlements.ts`

Iris enforces per-chat turn and token budgets to prevent cost overruns:

| User type | Max turns/chat | Max tokens/chat | Max messages/hour |
|-----------|---------------|----------------|-------------------|
| Guest | 20 | 50,000 | 100 |
| Regular | 80 | 200,000 | 1,000 |

Budget enforcement happens in the chat route before `streamText()`:

1. Count assistant turns in the conversation
2. Sum total tokens from the audit log
3. If either limit is exceeded, return a rate limit error

---

## MemPalace MCP Connectivity

**Location:** `lib/mempalace/`

When the `MEMPALACE_MCP_COMMAND` environment variable is set, Iris spawns
a [MemPalace MCP server](https://github.com/ljbudgie/mempalace) and
connects via JSON-RPC 2.0 over stdio. This enables the L0-L3 memory stack
described in the system prompt to actually function.

### Setup

```bash
# 1. Install MemPalace
pip install mempalace

# 2. Initialise a palace
mempalace init ~/my-palace
mempalace mine ~/my-palace

# 3. Configure Iris
echo 'MEMPALACE_MCP_COMMAND="python -m mempalace.mcp_server"' >> .env.local
```

### Available Tools

When MemPalace is configured, three AI tools become available:

| Tool | Description | Sensitivity |
|------|-------------|-------------|
| `mempalaceSearch` | Semantic search across palace memories | standard |
| `mempalaceStore` | File verbatim content into the palace | standard |
| `mempalaceStatus` | Palace overview and wake-up context | standard |

These are registered in the skill registry conditionally — they only
appear when `MEMPALACE_MCP_COMMAND` is set.

### Client Architecture

```
Iris (Node.js)                    MemPalace (Python)
─────────────                    ──────────────────
MemPalaceClient                  mcp_server.py
  │                                │
  ├─ connect()                     │
  │   spawn child process ────────►│ main() loop
  │                                │
  ├─ search({query: "..."}) ──────►│ tool_search()
  │   JSON-RPC request             │
  │◄── JSON-RPC response ─────────┤ ChromaDB query
  │                                │
  ├─ addDrawer({...}) ────────────►│ tool_add_drawer()
  │◄── JSON-RPC response ─────────┤ ChromaDB insert
  │                                │
  └─ disconnect()                  │
      kill child process ─────────►│ exit
```

The client manages the process lifecycle, request/response correlation,
timeouts, and JSON parsing. It exposes typed methods matching the
MemPalace MCP server's 19 tools.

---

## Multi-Model Routing

**Location:** `lib/ai/models.ts`, `lib/ai/providers.ts`

Iris routes requests across 8 models from 5 providers using the
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway):

| Model | Provider | Failover providers |
|-------|----------|--------------------|
| DeepSeek V3.2 | DeepSeek | Bedrock, DeepInfra |
| Codestral | Mistral | Mistral |
| Mistral Small | Mistral | Mistral |
| Kimi K2 0905 *(default)* | Moonshot AI | Baseten, Fireworks |
| Kimi K2.5 | Moonshot AI | Fireworks, Bedrock |
| GPT OSS 20B | OpenAI | Groq, Bedrock |
| GPT OSS 120B | OpenAI | Fireworks, Bedrock |
| Grok 4.1 Fast | xAI | xAI |

Model capabilities (tools, vision, reasoning) are fetched dynamically
from the AI Gateway and cached. Models that don't support tools have
`experimental_activeTools` set to an empty array.

---

## Full Request Flow

```
1. POST /api/chat
   │
2. ├── Auth check (next-auth)
   ├── Rate limit check (IP + hourly message count)
   ├── Conversation budget check (turns + tokens)
   │
3. ├── Determine governance status
   ├── Get permitted tools from skill registry
   ├── Build tools object from skill registry
   │
4. ├── streamText() with Vercel AI SDK
   │   ├── Model selection + gateway routing
   │   ├── System prompt (Burgess Principle + MemPalace awareness)
   │   ├── Tool execution (weather, documents, letters, MemPalace)
   │   └── Streaming response
   │
5. ├── Audit trail: save turn metadata
   │   (modelId, tokens, toolsInvoked, governanceStatus)
   │
6. └── Persist messages to database
```
