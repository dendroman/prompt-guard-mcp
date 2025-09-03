import { fetch } from "./shims.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(
  messages: ChatMessage[],
  opts?: { model?: string; url?: string }
): Promise<string> {
  const model = opts?.model || "llama-guard3:8b";
  const url = (opts?.url || "http://localhost:11434").replace(/\/$/, "");

  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content =
    data?.message?.content || data?.choices?.[0]?.message?.content || "";
  return String(content).trim();
}
