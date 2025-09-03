#!/usr/bin/env node

/**
 * Prompt Guard MCP Server
 * AI-powered security risk analysis via Model Context Protocol
 */

import { startPromptGuardServer } from "./mcp-server.js";

// Start the server using the official MCP SDK
startPromptGuardServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
