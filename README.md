# Prompt Guard MCP 🛡️

AI-powered security risk analysis via Model Context Protocol (MCP)

[![npm version](https://badge.fury.io/js/prompt-guard-mcp.svg)](https://badge.fury.io/js/prompt-guard-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

## Overview

Prompt Guard MCP is a security-focused MCP (Model Context Protocol) server that provides AI-powered risk analysis for operations and commands. It integrates with local Ollama models to evaluate potential security risks before operations are executed.

## Features

- 🔍 **Risk Analysis**: AI-powered security risk assessment
- 🤖 **Local AI**: Uses local Ollama models for privacy
- 🛡️ **Security-First**: Designed with security as the primary concern
- 🔌 **MCP Compatible**: Works with any MCP-compatible client
- ⚡ **Fast**: Quick risk analysis for real-time protection

## Installation

### Via npm (Recommended)

```bash
npm install -g prompt-guard-mcp
```

### Via npx (No Installation)

```bash
npx prompt-guard-mcp
```

### From Source

```bash
git clone https://github.com/dendroman/prompt-guard-mcp.git
cd prompt-guard-mcp
npm install
npm run build
npm start
```

## Prerequisites

- **Node.js**: Version 18 or higher
- **Ollama**: Local Ollama installation with a supported model

### Installing Ollama

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a supported model:
   ```bash
   ollama pull llama-guard3:1b  # Lightweight option
   ollama pull llama-guard3:8b  # Default option
   ```

## Quick Start

### 1. Install and Setup

```bash
# Install globally
npm install -g prompt-guard-mcp

# Or use without installation
npx prompt-guard-mcp
```

### 2. VS Code Integration (Recommended)

1. **Create MCP configuration**:

   ```bash
   mkdir -p .vscode
   ```

2. **Create `.vscode/mcp.json`**:

   ```json
   {
     "servers": {
       "prompt-guard-mcp": {
         "command": "npx",
         "args": ["prompt-guard-mcp"],
         "env": {
           "GUARD_MODEL": "llama-guard3:1b"
         }
       }
     }
   }
   ```

3. **Add security instructions** (create `.github/copilot-instructions.md`):

   ```markdown
   # Prompt Guard MCP Security Protocol

   **ALL AI ASSISTANTS MUST:**

   1. Execute risk analysis FIRST - Call `   mcp_prompt-guard-mcp_vibe_guard_analyze_risk` before ANY action
   2. Follow actions EXACTLY - Never override returned actions
   3. NO EXCEPTIONS - Risk analysis is mandatory, not optional
   ```

4. **Restart VS Code** to activate Prompt Guard MCP protection

### 3. Test the Integration

Use GitHub Copilot Chat or similar and try:

```json
{
  "tool": "vibe_guard_analyze_risk",
  "parameters": {
    "operation": "Install lodash package via npm",
    "context": {
      "package": "lodash",
      "environment": "development"
    }
  }
}
```

## Configuration

### Environment Variables

Configure Prompt Guard MCP using environment variables:

| Variable               | Default                  | Description              |
| ---------------------- | ------------------------ | ------------------------ |
| `GUARD_MODEL`          | `llama-guard3:8b`        | Ollama model name        |
| `GUARD_OLLAMA_URL`     | `http://localhost:11434` | Ollama server URL        |
| `GUARD_WORKSPACE_ROOT` | `process.cwd()`          | Workspace root directory |

### MCP Client Configuration

For advanced configuration or other MCP clients, you can customize the setup:

#### Advanced MCP Configuration

For development or advanced use cases, you may want additional environment variables:

```json
{
  "servers": {
    "prompt-guard-mcp": {
      "command": "npx",
      "args": ["prompt-guard-mcp"],
      "env": {
        "GUARD_WORKSPACE_ROOT": ".",
        "GUARD_MODEL": "llama-guard3:1b",
        "GUARD_OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

### Example Environment Configuration

```bash
export GUARD_MODEL=llama3:8b
export GUARD_OLLAMA_URL=http://localhost:11434
prompt-guard-mcp
```

## MCP Tools

### vibe_guard_analyze_risk

Analyzes the security risk of a proposed operation.

**Parameters**:

- `operation` (required): Description of the operation to analyze
- `context` (optional): Additional context about the operation

**Returns**:

- `risk`: Risk level (low, medium, high)
- `reasons`: Array of risk factors identified
- `actions`: Recommended actions
- `mandatory_actions`: Human-readable actions

**Example Response**:

```json
{
  "risk": "medium",
  "reasons": [
    "Operation involves file deletion",
    "Could affect system stability"
  ],
  "actions": ["require_human_confirm"],
  "mandatory_actions": "⚠️ Operation requires human confirmation"
}
```

## Usage Examples

### Command Line Testing

```bash
# Basic risk analysis
echo '{"operation": "rm -rf /tmp/*"}' | prompt-guard-mcp --stdin

# With context
echo '{
  "operation": "Install new npm package",
  "context": {"package": "lodash", "version": "4.17.21"}
}' | prompt-guard-mcp --stdin
```

### MCP Client Integration

```javascript
// Example MCP client usage
const result = await mcpClient.callTool("vibe_guard_analyze_risk", {
  operation: "Download and execute script from internet",
  context: {
    url: "https://example.com/script.sh",
    user: "developer",
  },
});

console.log(`Risk Level: ${result.risk}`);
console.log(`Mandatory actions: ${result.mandatory_actions}`);
```

## Security Model

Prompt Guard MCP follows a security-first approach:

1. **Local Processing**: All analysis happens locally using Ollama
2. **No Data Transmission**: Operations are not sent to external services
3. **Conservative Defaults**: When in doubt, flag as higher risk
4. **Transparent Analysis**: Clear reasoning for all risk assessments

### Risk Levels

- **Low**: Operation is generally safe
- **Medium**: Operation requires caution or confirmation
- **High**: Operation is potentially dangerous and should be blocked

### OWASP LLM01 Compliance

Prompt Guard MCP implements OWASP LLM01 guidelines for prompt injection prevention:

- **Input Sanitization**: All user inputs are treated as data, not instructions
- **Instruction Separation**: Clear separation between system instructions and user data
- **Fail-Closed Security**: When analysis fails, defaults to blocking the operation
- **Multi-modal Protection**: Guards against various injection vectors

## Development

### Building from Source

```bash
git clone https://github.com/dendroman/prompt-guard-mcp.git
cd prompt-guard-mcp
npm install
npm run build
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Troubleshooting

### Common Issues

**Ollama Connection Failed**

```
Error: Failed to connect to Ollama at http://localhost:11434
```

- Ensure Ollama is running: `ollama serve`
- Check if the model is available: `ollama list`
- Verify the URL in your configuration

**Model Not Found**

```
Error: Model 'llama-guard3:8b' not found
```

- Pull the model: `ollama pull llama-guard3:8b`
- Or use a different model: `export GUARD_MODEL=llama-guard3:1b`

**Permission Denied**

```
Error: EACCES: permission denied
```

- Check file permissions
- Avoid running as root unless necessary

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [Ollama](https://ollama.com/) for local AI inference
- Inspired by security-first development practices
- OWASP LLM01 compliance for prompt injection prevention

---

**Made with ❤️ for secure AI-powered development**
