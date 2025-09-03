// Fetch implementation for Node.js MCP server
let globalFetch: typeof fetch;

try {
  // Try to use native fetch (Node 18+)
  if (typeof globalThis.fetch !== "undefined") {
    globalFetch = globalThis.fetch;
  } else {
    // Fallback to undici
    const { fetch: undiciFetch } = await import("undici");
    globalFetch = undiciFetch as typeof fetch;
  }
} catch {
  throw new Error(
    "Neither native fetch nor undici available. Install undici: npm install undici"
  );
}

export { globalFetch as fetch };
