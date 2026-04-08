/**
 * Type definitions for the MemPalace MCP client.
 *
 * These types mirror the MemPalace MCP server's JSON-RPC protocol
 * (mempalace/mcp_server.py) and the palace data structures.
 */

// ---------------------------------------------------------------------------
// MCP JSON-RPC protocol types
// ---------------------------------------------------------------------------

export type McpRequest = {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
};

export type McpResponse = {
  jsonrpc: "2.0";
  id: number;
  result?: {
    content?: { type: string; text: string }[];
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
  };
};

// ---------------------------------------------------------------------------
// MemPalace tool argument types
// ---------------------------------------------------------------------------

export type SearchArgs = {
  query: string;
  limit?: number;
  wing?: string;
  room?: string;
};

export type AddDrawerArgs = {
  wing: string;
  room: string;
  content: string;
  source_file?: string;
  added_by?: string;
};

export type KgQueryArgs = {
  entity: string;
  as_of?: string;
  direction?: "outgoing" | "incoming" | "both";
};

export type KgAddArgs = {
  subject: string;
  predicate: string;
  object: string;
  valid_from?: string;
  source_closet?: string;
};

export type DiaryWriteArgs = {
  agent_name: string;
  entry: string;
  topic?: string;
};

export type DiaryReadArgs = {
  agent_name: string;
  last_n?: number;
};

// ---------------------------------------------------------------------------
// MemPalace response shapes (parsed from JSON text content)
// ---------------------------------------------------------------------------

export type PalaceStatus = {
  total_drawers: number;
  wings: Record<string, number>;
  rooms: Record<string, number>;
  palace_path: string;
  protocol: string;
  aaak_dialect: string;
};

export type SearchResult = {
  results: {
    id: string;
    content: string;
    wing: string;
    room: string;
    similarity: number;
  }[];
};

export type KgQueryResult = {
  entity: string;
  facts: {
    subject: string;
    predicate: string;
    object: string;
    valid_from?: string;
    valid_to?: string;
  }[];
};

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export type MemPalaceConfig = {
  /**
   * The command to start the MemPalace MCP server.
   * Example: "python -m mempalace.mcp_server"
   */
  command: string;

  /**
   * Optional arguments to pass to the command.
   */
  args?: string[];

  /**
   * Timeout in milliseconds for individual tool calls.
   * Defaults to 10_000 (10 seconds).
   */
  timeoutMs?: number;
};
