// Simple test for guard JSON parsing functionality
import { GuardResult } from "../src/guard";

function describe(name: string, fn: () => void) {
  console.log(`\n=== ${name} ===`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error}`);
    throw error;
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain: (expected: any) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
  };
}

// Test JSON salvage functionality
function tryParseJsonObject(s: string): Record<string, unknown> | null {
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj === "object") return obj as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  const match = s.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      if (obj && typeof obj === "object") return obj as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function coerceGuardResult(raw: Record<string, unknown>): GuardResult {
  const okRisk = new Set(["low", "medium", "high"]);
  const okActions = new Set([
    "allow",
    "block",
    "require_human_confirm",
    "strip_untrusted",
  ]);

  const risk =
    typeof raw.risk === "string" && okRisk.has(raw.risk)
      ? (raw.risk as any)
      : undefined;

  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons.filter((x) => typeof x === "string")
    : undefined;

  const actions = Array.isArray(raw.actions)
    ? raw.actions.filter((x) => typeof x === "string" && okActions.has(x))
    : undefined;

  const finalActions =
    actions && actions.length
      ? actions
      : risk === "high"
      ? ["block"]
      : ["allow"];

  return { risk, reasons, actions: finalActions };
}

describe("Guard JSON Parsing", () => {
  it("should parse valid JSON", () => {
    const input = `{"risk":"low","actions":["allow"],"reasons":["safe"]}`;
    const result = tryParseJsonObject(input);
    expect(result?.risk).toBe("low");
  });

  it("should salvage JSON from markdown response", () => {
    const input = `Here is the analysis:\n\`\`\`json\n{"risk":"high","actions":["block"]}\n\`\`\``;
    const result = tryParseJsonObject(input);
    expect(result?.risk).toBe("high");
  });

  it("should handle malformed responses", () => {
    const input = `This is not JSON at all`;
    const result = tryParseJsonObject(input);
    expect(result).toBe(null);
  });

  it("should coerce invalid risk levels", () => {
    const raw = { risk: "invalid", actions: ["allow"] };
    const result = coerceGuardResult(raw);
    expect(result.risk).toBe(undefined);
    expect(result.actions?.[0]).toBe("allow");
  });

  it("should default to block for high risk", () => {
    const raw = { risk: "high" };
    const result = coerceGuardResult(raw);
    expect(result.actions?.[0]).toBe("block");
  });
});

// Run the tests
if (require.main === module) {
  console.log("Running Guard Tests...");
}
