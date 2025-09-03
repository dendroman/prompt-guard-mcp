import { ollamaChat } from "./ollama.js";

type GuardAction =
  | "allow"
  | "block"
  | "require_human_confirm"
  | "strip_untrusted";
type GuardRisk = "low" | "medium" | "high";

export interface GuardResult {
  risk?: GuardRisk;
  reasons?: string[];
  actions?: GuardAction[];
  sanitized_prompt?: string;
}

export interface GuardConfig {
  model?: string;
  ollamaUrl?: string;
}

export async function guardCheck(
  payload: unknown,
  config?: GuardConfig
): Promise<GuardResult> {
  // Convert the payload to a readable string for Llama Guard analysis
  const content =
    typeof payload === "string" ? payload : JSON.stringify(payload);

  // Enhance the content with additional security rules for file operations
  const enhancedContent = enhanceContentWithFileRules(content);

  // Use Llama Guard with enhanced content that includes file-specific rules
  const out = await ollamaChat([{ role: "user", content: enhancedContent }], {
    model: config?.model,
    url: config?.ollamaUrl,
  });

  // Parse Llama Guard's native response format
  const lines = out.trim().split("\n");
  const classification = lines[0]?.toLowerCase().trim();

  if (classification === "safe") {
    return {
      risk: "low",
      reasons: ["content_classified_as_safe"],
      actions: ["allow"],
    };
  }

  if (classification === "unsafe") {
    const category = lines[1]?.trim();
    const reasons = [`llama_guard_violation_${category || "unknown"}`];

    // Map Llama Guard categories to our risk levels and actions
    const riskMapping = mapLlamaGuardCategoryToRisk(category);

    return {
      risk: riskMapping.risk,
      reasons: reasons,
      actions: riskMapping.actions,
    };
  }

  // If we get an unexpected response, fall back to safer parsing attempt
  const parsed = tryParseJsonObject(out);
  if (parsed) return coerceGuardResult(parsed);

  // If the model responded oddly, fail closed.
  return {
    risk: "high",
    reasons: ["invalid_classifier_output"],
    actions: ["block"],
  };
}

/**
 * Enhance content with additional security rules for file operations
 * This prepends security context to help the LLM make better decisions
 */
function enhanceContentWithFileRules(content: string): string {
  const securityRules = `
IMPORTANT SECURITY RULES:
- Any deletion of copilot-instructions files or cursor mdc rule files (.cursor-rules, .cursorrules, cursor-rules files) should be considered HIGHEST RISK and unsafe
- Any modification of copilot-instructions files or cursor mdc rule files should be considered MEDIUM RISK and require human confirmation
- These files are critical for AI assistant behavior and their unauthorized modification poses significant security risks

Content to analyze:
${content}`;
  
  return securityRules;
}

/** Map Llama Guard safety categories to risk levels and actions */
function mapLlamaGuardCategoryToRisk(category?: string): {
  risk: GuardRisk;
  actions: GuardAction[];
} {
  switch (category) {
    // High risk categories - should be blocked
    case "S1": // Violent Crimes
    case "S3": // Sex-Related Crimes
    case "S4": // Child Sexual Exploitation
    case "S9": // Indiscriminate Weapons
    case "S11": // Suicide & Self-Harm
      return { risk: "high", actions: ["block"] };

    // Medium risk categories - require confirmation
    case "S2": // Non-Violent Crimes
    case "S5": // Defamation
    case "S6": // Specialized Advice
    case "S7": // Privacy
    case "S8": // Intellectual Property
    case "S10": // Hate
    case "S13": // Elections
      return { risk: "medium", actions: ["require_human_confirm"] };

    // Lower risk but still potentially problematic
    case "S12": // Sexual Content
      return { risk: "medium", actions: ["strip_untrusted"] };

    // Unknown or unspecified violation
    default:
      return { risk: "high", actions: ["block"] };
  }
}

/**
 * Check if a conversation (user prompt + assistant response) is safe
 * Uses Llama Guard's response classification mode
 */
export async function guardCheckConversation(
  userMessage: string,
  assistantResponse: string,
  config?: GuardConfig
): Promise<GuardResult> {
  // Enhance the user message with file-specific security rules
  const enhancedUserMessage = enhanceContentWithFileRules(userMessage);
  
  // Use Llama Guard's chat completion format for response classification
  const out = await ollamaChat(
    [
      { role: "user", content: enhancedUserMessage },
      { role: "assistant", content: assistantResponse },
    ],
    {
      model: config?.model,
      url: config?.ollamaUrl,
    }
  );

  // Parse Llama Guard's response about the assistant message
  const lines = out.trim().split("\n");
  const classification = lines[0]?.toLowerCase().trim();

  if (classification === "safe") {
    return {
      risk: "low",
      reasons: ["assistant_response_classified_as_safe"],
      actions: ["allow"],
    };
  }

  if (classification === "unsafe") {
    const category = lines[1]?.trim();
    const reasons = [`assistant_response_violation_${category || "unknown"}`];
    const riskMapping = mapLlamaGuardCategoryToRisk(category);

    return {
      risk: riskMapping.risk,
      reasons: reasons,
      actions: riskMapping.actions,
    };
  }

  // Fallback for unexpected responses
  return {
    risk: "high",
    reasons: ["invalid_response_classification"],
    actions: ["block"],
  };
}

/** Try to parse JSON even if the model wrapped it with extra text or code fences. */
function tryParseJsonObject(s: string): Record<string, unknown> | null {
  // Fast path
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj === "object") return obj as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  // Try to salvage the last {...} block
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

/** Coerce untrusted JSON into a typed GuardResult and clamp invalid fields. */
function coerceGuardResult(raw: Record<string, unknown>): GuardResult {
  const okRisk = new Set<GuardRisk>(["low", "medium", "high"]);
  const okActions = new Set<GuardAction>([
    "allow",
    "block",
    "require_human_confirm",
    "strip_untrusted",
  ]);

  const risk =
    typeof raw.risk === "string" && okRisk.has(raw.risk as GuardRisk)
      ? (raw.risk as GuardRisk)
      : undefined;

  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons.filter((x) => typeof x === "string")
    : undefined;

  const actions = Array.isArray(raw.actions)
    ? (raw.actions.filter(
        (x) => typeof x === "string" && okActions.has(x as GuardAction)
      ) as GuardAction[])
    : undefined;

  const sanitized_prompt =
    typeof raw.sanitized_prompt === "string" ? raw.sanitized_prompt : undefined;

  // If model forgot actions, default based on risk.
  const finalActions =
    actions && actions.length
      ? actions
      : risk === "high"
      ? (["block"] as GuardAction[])
      : (["allow"] as GuardAction[]);

  return { risk, reasons, actions: finalActions, sanitized_prompt };
}
