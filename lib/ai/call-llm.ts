// Shared helper for calling /api/tasks (OpenAI proxy) with a client-side timeout,
// so long-running or hung generations surface a clear error instead of spinning forever.

export class LLMTimeoutError extends Error {
  constructor() {
    super("timeout");
    this.name = "LLMTimeoutError";
  }
}

const DEFAULT_TIMEOUT_MS = 90_000;

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userPrompt }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(errorText || `HTTP ${res.status}`);
    }

    return (await res.text()).trim();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LLMTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function callLLMJson(
  systemPrompt: string,
  userPrompt: string,
  timeoutMs?: number,
): Promise<unknown> {
  const raw = await callLLM(systemPrompt, userPrompt, timeoutMs);
  return JSON.parse(getJsonCandidate(raw));
}

export function getJsonCandidate(text: string): string {
  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  return start !== -1 && end !== -1 && end > start
    ? withoutFences.slice(start, end + 1)
    : withoutFences;
}
