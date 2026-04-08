import { type ChildProcess, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type {
  AddDrawerArgs,
  DiaryReadArgs,
  DiaryWriteArgs,
  KgAddArgs,
  KgQueryArgs,
  McpRequest,
  McpResponse,
  MemPalaceConfig,
  SearchArgs,
} from "./types";

/**
 * MemPalace MCP Client — connects Iris to a running MemPalace MCP server.
 *
 * The MemPalace MCP server (https://github.com/ljbudgie/mempalace) speaks
 * JSON-RPC 2.0 over stdio.  This client manages the child process lifecycle
 * and exposes typed methods for each MemPalace tool.
 *
 * Usage:
 *   const client = new MemPalaceClient({ command: "python", args: ["-m", "mempalace.mcp_server"] });
 *   await client.connect();
 *   const status = await client.status();
 *   await client.disconnect();
 */
export class MemPalaceClient {
  private process: ChildProcess | null = null;
  private nextId = 1;
  private readonly pending = new Map<
    number,
    {
      resolve: (value: McpResponse) => void;
      reject: (reason: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private connected = false;
  private readonly config: MemPalaceConfig;

  constructor(config: MemPalaceConfig) {
    this.config = config;
  }

  /**
   * Spawn the MCP server subprocess and perform the initialize handshake.
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const [cmd, ...defaultArgs] = this.config.command.split(/\s+/);
    const args = [...defaultArgs, ...(this.config.args ?? [])];

    this.process = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error("Failed to spawn MemPalace MCP server process");
    }

    // Log stderr from the MCP server for transparency
    if (this.process.stderr) {
      this.process.stderr.on("data", (data: Buffer) => {
        console.error(
          "[Iris] MemPalace MCP server stderr:",
          data.toString().trim()
        );
      });
    }

    const rl = createInterface({ input: this.process.stdout });

    rl.on("line", (line: string) => {
      try {
        const response = JSON.parse(line) as McpResponse;
        const pending = this.pending.get(response.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(response.id);
          pending.resolve(response);
        }
      } catch {
        // Ignore non-JSON lines (e.g. server log messages on stdout)
      }
    });

    this.process.on("exit", () => {
      this.connected = false;
      console.error(
        "[Iris] MemPalace MCP server process exited — palace memory is temporarily unavailable."
      );
      for (const [, p] of this.pending) {
        clearTimeout(p.timer);
        p.reject(new Error("MemPalace MCP server process exited"));
      }
      this.pending.clear();
    });

    // Initialize handshake
    await this.send("initialize", {});
    this.connected = true;
  }

  /**
   * Shut down the MCP server subprocess.
   */
  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;
  }

  /**
   * Whether the client is currently connected to the MCP server.
   */
  isConnected(): boolean {
    return this.connected;
  }

  // -----------------------------------------------------------------------
  // Read tools
  // -----------------------------------------------------------------------

  /** Palace overview — total drawers, wing and room counts. */
  status(): Promise<unknown> {
    return this.callTool("mempalace_status", {});
  }

  /** Semantic search across palace memories. */
  search(args: SearchArgs): Promise<unknown> {
    return this.callTool("mempalace_search", args);
  }

  /** Full taxonomy: wing → room → drawer count. */
  getTaxonomy(): Promise<unknown> {
    return this.callTool("mempalace_get_taxonomy", {});
  }

  /** Get the AAAK dialect specification. */
  getAaakSpec(): Promise<unknown> {
    return this.callTool("mempalace_get_aaak_spec", {});
  }

  /** Query the knowledge graph for an entity's relationships. */
  kgQuery(args: KgQueryArgs): Promise<unknown> {
    return this.callTool("mempalace_kg_query", args);
  }

  /** Knowledge graph stats. */
  kgStats(): Promise<unknown> {
    return this.callTool("mempalace_kg_stats", {});
  }

  // -----------------------------------------------------------------------
  // Write tools
  // -----------------------------------------------------------------------

  /** File verbatim content into the palace. */
  addDrawer(args: AddDrawerArgs): Promise<unknown> {
    return this.callTool("mempalace_add_drawer", args);
  }

  /** Add a fact to the knowledge graph. */
  kgAdd(args: KgAddArgs): Promise<unknown> {
    return this.callTool("mempalace_kg_add", args);
  }

  /** Write to the agent diary in AAAK format. */
  diaryWrite(args: DiaryWriteArgs): Promise<unknown> {
    return this.callTool("mempalace_diary_write", args);
  }

  /** Read recent diary entries. */
  diaryRead(args: DiaryReadArgs): Promise<unknown> {
    return this.callTool("mempalace_diary_read", args);
  }

  /** Run a Burgess Principle human-impact review on content. */
  burgessReview(content: string): Promise<unknown> {
    return this.callTool("mempalace_burgess_review", { content });
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.send("tools/call", {
      name,
      arguments: args,
    });

    if (response.error) {
      throw new Error(
        `MemPalace tool "${name}" failed: ${response.error.message}`
      );
    }

    // Parse the JSON text content from the MCP response
    const textContent = response.result?.content?.find(
      (c) => c.type === "text"
    );
    if (textContent) {
      try {
        return JSON.parse(textContent.text);
      } catch {
        return textContent.text;
      }
    }

    return response.result;
  }

  private send(
    method: string,
    params: Record<string, unknown>
  ): Promise<McpResponse> {
    if (!this.process?.stdin) {
      throw new Error("MemPalace MCP server is not connected");
    }

    const id = this.nextId++;
    const request: McpRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<McpResponse>((resolve, reject) => {
      const timeoutMs = this.config.timeoutMs ?? 10_000;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MemPalace tool call timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.process?.stdin?.write(`${JSON.stringify(request)}\n`);
    });
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let _client: MemPalaceClient | null = null;

/**
 * Returns the singleton MemPalace MCP client, creating it on first call.
 * Returns null if the MEMPALACE_MCP_COMMAND environment variable is not set.
 */
export function getMemPalaceClient(): MemPalaceClient | null {
  const command = process.env.MEMPALACE_MCP_COMMAND;
  if (!command) {
    return null;
  }

  if (!_client) {
    _client = new MemPalaceClient({ command });
  }

  return _client;
}
