import type { RequestHandler } from "express";

type AnthropicResponse = {
  content?: Array<{ type: string; text: string }>;
  error?: { message: string };
};

export const handleAnthropicGenerate: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "prompt required" });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":          apiKey,
        "anthropic-version":  "2023-06-01",
        "content-type":       "application/json",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages:   [{ role: "user", content: prompt.trim() }],
      }),
    });

    const data = await response.json() as AnthropicResponse;

    if (!response.ok) {
      res.status(502).json({ error: data.error?.message ?? "Upstream API error" });
      return;
    }

    const text =
      data.content?.find(b => b.type === "text")?.text?.trim() ?? "";
    res.json({ text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
};
