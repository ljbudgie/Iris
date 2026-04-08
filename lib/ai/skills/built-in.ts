/**
 * Registers Iris's built-in tools into the skill registry.
 *
 * This module is the single source of truth for which tools are available,
 * their governance sensitivity, and how they are constructed.  The chat
 * route imports the registry rather than individual tool modules.
 *
 * Inspired by the nexus-ai-hub OpenClaw SkillRegistry pattern — each tool
 * self-declares its metadata (name, sensitivity, tags, context requirements)
 * so the registry can enforce governance rules automatically.
 */
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { generateBurgessLetter } from "@/lib/ai/tools/generate-burgess-letter";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { suggestFollowUps } from "@/lib/ai/tools/suggest-follow-ups";
import {
  executeCode,
  mathCalculation,
  webSearch,
} from "@/lib/ai/tools/tool-execution";
import { updateDocument } from "@/lib/ai/tools/update-document";
import {
  mempalaceSearchSkill,
  mempalaceStatusSkill,
  mempalaceStoreSkill,
} from "@/lib/mempalace/tools";
import { skillRegistry } from "./registry";
import type { SkillDefinition } from "./types";

// ---------------------------------------------------------------------------
// Context-free skills (no session/dataStream/modelId needed)
// ---------------------------------------------------------------------------

const weatherSkill: SkillDefinition = {
  metadata: {
    name: "getWeather",
    description:
      "Get the current weather at a location by city name or coordinates.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["utility", "external-api"],
    requiresContext: false,
  },
  tool: getWeather,
};

const followUpSkill: SkillDefinition = {
  metadata: {
    name: "suggestFollowUps",
    description:
      "Suggest 2-3 concise follow-up questions based on the conversation.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["conversational", "ux"],
    requiresContext: false,
  },
  tool: suggestFollowUps,
};

// ---------------------------------------------------------------------------
// Context-dependent skills (factory pattern — need session/dataStream/modelId)
// ---------------------------------------------------------------------------

const createDocumentSkill: SkillDefinition = {
  metadata: {
    name: "createDocument",
    description: "Create a new artifact (code, text, or spreadsheet).",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["artifact", "document"],
    requiresContext: true,
  },
  factory: (ctx) => createDocument(ctx as Parameters<typeof createDocument>[0]),
};

const editDocumentSkill: SkillDefinition = {
  metadata: {
    name: "editDocument",
    description: "Edit an existing artifact using find-and-replace.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["artifact", "document"],
    requiresContext: true,
  },
  factory: (ctx) =>
    editDocument({
      dataStream: ctx.dataStream,
      session: ctx.session,
    } as Parameters<typeof editDocument>[0]),
};

const updateDocumentSkill: SkillDefinition = {
  metadata: {
    name: "updateDocument",
    description: "Full rewrite of an existing artifact.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["artifact", "document"],
    requiresContext: true,
  },
  factory: (ctx) => updateDocument(ctx as Parameters<typeof updateDocument>[0]),
};

const requestSuggestionsSkill: SkillDefinition = {
  metadata: {
    name: "requestSuggestions",
    description: "Generate AI suggestions for an existing document.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["artifact", "document", "suggestions"],
    requiresContext: true,
  },
  factory: (ctx) =>
    requestSuggestions(ctx as Parameters<typeof requestSuggestions>[0]),
};

const burgessLetterSkill: SkillDefinition = {
  metadata: {
    name: "generateBurgessLetter",
    description:
      "Generate a personalised Burgess Principle letter from 18 templates.",
    version: "1.0.0",
    sensitivity: "sensitive",
    tags: ["burgess-principle", "legal", "advocacy"],
    requiresContext: true,
  },
  factory: (ctx) =>
    generateBurgessLetter(ctx as Parameters<typeof generateBurgessLetter>[0]),
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const builtInSkills: SkillDefinition[] = [
  weatherSkill,
  createDocumentSkill,
  editDocumentSkill,
  updateDocumentSkill,
  requestSuggestionsSkill,
  followUpSkill,
  burgessLetterSkill,
  // Tool execution skills
  {
    metadata: {
      name: "webSearch",
      description:
        "Search the web for real-time information, current events, and live data.",
      version: "1.0.0",
      sensitivity: "standard",
      tags: ["web", "search", "realtime"],
      requiresContext: false,
    },
    tool: webSearch,
  },
  {
    metadata: {
      name: "executeCode",
      description:
        "Execute code snippets and return results. Supports Python, JavaScript, TypeScript.",
      version: "1.0.0",
      sensitivity: "standard",
      tags: ["code", "execution", "sandbox"],
      requiresContext: false,
    },
    tool: executeCode,
  },
  {
    metadata: {
      name: "mathCalculation",
      description:
        "Perform mathematical calculations — arithmetic, algebra, statistics, data analysis.",
      version: "1.0.0",
      sensitivity: "standard",
      tags: ["math", "calculation", "data"],
      requiresContext: false,
    },
    tool: mathCalculation,
  },
];

for (const skill of builtInSkills) {
  skillRegistry.register(skill);
}

// ---------------------------------------------------------------------------
// MemPalace tools (conditional — only when MEMPALACE_MCP_COMMAND is set)
// ---------------------------------------------------------------------------

if (process.env.MEMPALACE_MCP_COMMAND) {
  const mempalaceSkills: SkillDefinition[] = [
    mempalaceSearchSkill,
    mempalaceStoreSkill,
    mempalaceStatusSkill,
  ];

  for (const skill of mempalaceSkills) {
    skillRegistry.register(skill);
  }
}
