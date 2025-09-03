import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { guardCheck } from "./guard.js";

// Configuration interface (keep existing)
interface PromptConfig {
  model: string;
  ollamaUrl: string;
  workspaceRoot: string;
}

function getConfig(): PromptConfig {
  return {
    model: process.env.GUARD_MODEL || "llama-guard3:8b",
    ollamaUrl: process.env.GUARD_OLLAMA_URL || "http://localhost:11434",
    workspaceRoot: process.env.GUARD_WORKSPACE_ROOT || process.cwd(),
  };
}

export async function createPromptGuardServer(): Promise<Server> {
  const config = getConfig();

  // Create MCP server with SDK
  const server = new Server(
    {
      name: "prompt-guard-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "prompt_guard_analyze_risk",
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
                additionalProperties: true,
              },
            },
            required: ["operation"],
          },
        },
      ],
    };
  });

  // Register tools/call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "prompt_guard_analyze_risk") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = request.params.arguments as any;
    const operation = args?.operation;
    const context = args?.context;

    if (!operation || typeof operation !== "string") {
      throw new Error("Missing required parameter: operation");
    }

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

      const result = {
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
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing risk: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function startPromptGuardServer(): Promise<void> {
  try {
    const server = await createPromptGuardServer();

    // Use stdio transport (same as current implementation)
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("Prompt Guard MCP server running with official SDK");
  } catch (error) {
    console.error("Failed to start Prompt Guard server:", error);
    process.exit(1);
  }
}
