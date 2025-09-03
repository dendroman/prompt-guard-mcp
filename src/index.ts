#!/usr/bin/env node

/**
 * Vibe Guard MCP Server
 * AI-powered security risk analysis via Model Context Protocol
 */

import { guardCheck } from "./guard.js";

// Configuration
interface VibeConfig {
  model: string;
  ollamaUrl: string;
  workspaceRoot: string;
}

function getConfig(): VibeConfig {
  return {
    model: process.env.GUARD_MODEL || "llama-guard3:8b",
    ollamaUrl: process.env.GUARD_OLLAMA_URL || "http://localhost:11434",
    workspaceRoot: process.env.GUARD_WORKSPACE_ROOT || process.cwd(),
  };
}

// Simple JSON-RPC 2.0 implementation
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number; // Optional for notifications
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number; // Optional for notifications
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class VibeGuardMCPServer {
  private config: VibeConfig;

  constructor() {
    this.config = getConfig();
  }

  async handleRequest(
    request: JsonRpcRequest
  ): Promise<JsonRpcResponse | null> {
    console.error(
      `[DEBUG] Received method: ${request.method}`,
      JSON.stringify(request.params || {})
    );

    try {
      switch (request.method) {
        case "initialize":
          return this.initialize(request);
        case "initialized":
          // This is a notification, no response needed
          console.error("[DEBUG] Initialized notification received");
          return null;
        case "ping":
          return this.ping(request);
        case "tools/list":
          return this.listTools(request);
        case "tools/call":
          return this.callTool(request);
        case "notifications/initialized":
          // This is a notification, no response needed
          console.error(
            "[DEBUG] Notifications initialized notification received"
          );
          return null;
        default:
          console.error(`[ERROR] Unknown method: ${request.method}`);
          if (request.id !== undefined) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32601,
                message: `Method not found: ${request.method}`,
              },
            };
          }
          return null; // No response for unknown notifications
      }
    } catch (error) {
      console.error(`[ERROR] Error handling ${request.method}:`, error);
      if (request.id !== undefined) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32603,
            message: "Internal error",
            data: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
      return null;
    }
  }

  private initialized(request: JsonRpcRequest): JsonRpcResponse {
    console.error("[DEBUG] Initialized called");
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {},
    };
  }

  private notificationsInitialized(request: JsonRpcRequest): JsonRpcResponse {
    console.error("[DEBUG] Notifications initialized called");
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {},
    };
  }

  private initialize(request: JsonRpcRequest): JsonRpcResponse {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "vibe-guard",
          version: "1.0.0",
        },
      },
    };
  }

  private ping(request: JsonRpcRequest): JsonRpcResponse {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {},
    };
  }

  private listTools(request: JsonRpcRequest): JsonRpcResponse {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: [
          {
            name: "vibe_guard_analyze_risk",
            description: "Analyze the security risk of a proposed operation",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  description: "Description of the operation to analyze",
                },
                context: {
                  type: "object",
                  description: "Additional context about the operation",
                },
              },
              required: ["operation"],
            },
          },
        ],
      },
    };
  }

  private async callTool(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "vibe_guard_analyze_risk":
        return await this.analyzeRisk(request, args);
      default:
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: "Unknown tool",
          },
        };
    }
  }

  private async analyzeRisk(
    request: JsonRpcRequest,
    args: any
  ): Promise<JsonRpcResponse> {
    const { operation, context } = args;

    try {
      const guard = await guardCheck({
        userPrompt: operation,
        plan: {
          edits:
            context?.files?.map((f: string) => ({
              path: f,
              content: "",
              operation: "replace_file" as const,
            })) || [],
        },
        untrusted: [],
        toolCall: {
          name: context?.command ? "shell.run" : "fs.write",
          args: context || {},
        },
      });

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  operation,
                  context,
                  risk: guard?.risk || "unknown",
                  reasons: guard?.reasons || [],
                  actions: guard?.actions || [],
                  mandatory_actions: guard?.actions?.includes("block")
                    ? "🚫 Operation should be blocked"
                    : guard?.actions?.includes("require_human_confirm")
                    ? "⚠️ Operation requires human confirmation"
                    : "✅ Operation appears safe",
                },
                null,
                2
              ),
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async start() {
    process.stdin.setEncoding("utf8");

    let buffer = "";
    process.stdin.on("data", async (chunk) => {
      buffer += chunk;

      // Process complete JSON-RPC messages
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.trim()) {
          try {
            const request = JSON.parse(line) as JsonRpcRequest;
            const response = await this.handleRequest(request);
            if (response !== null) {
              process.stdout.write(JSON.stringify(response) + "\n");
            }
          } catch (error) {
            console.error("Error processing request:", error);
          }
        }
      }
    });

    console.error("Vibe Guard MCP server running on stdio");
  }
}

// Start the server
const server = new VibeGuardMCPServer();
server.start().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
