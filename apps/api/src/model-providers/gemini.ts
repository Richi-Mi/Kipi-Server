type GeminiGenerateTextInput = {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userMessage: string;
  temperature?: number;
  timeoutMs?: number;
};

type GeminiGenerateTextResult =
  | { ok: true; text: string; raw?: unknown }
  | { ok: false; error: string; raw?: unknown };

function extractTextFromGeminiResponse(json: any): string | null {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
  const first = candidates[0];
  const parts = Array.isArray(first?.content?.parts) ? first.content.parts : [];
  const text = parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("");
  const out = String(text ?? "").trim();
  return out ? out : null;
}

export async function geminiGenerateText(input: GeminiGenerateTextInput): Promise<GeminiGenerateTextResult> {
  const timeoutMs = typeof input.timeoutMs === "number" ? input.timeoutMs : 12_000;
  const temperature = typeof input.temperature === "number" ? input.temperature : 0.45;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent` +
      `?key=${encodeURIComponent(input.apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: input.systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: input.userMessage }] }],
        generationConfig: { temperature },
      }),
    });

    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const msg =
        typeof json?.error?.message === "string"
          ? json.error.message
          : `Gemini HTTP ${String(res.status)}`;
      return { ok: false, error: msg, raw: json };
    }

    const text = extractTextFromGeminiResponse(json);
    if (!text) return { ok: false, error: "Respuesta vacía del modelo.", raw: json };
    return { ok: true, text, raw: json };
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Timeout al llamar a Gemini." : e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}

