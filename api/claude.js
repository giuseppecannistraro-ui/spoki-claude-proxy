/**
 * Spoki Meeting Agent — Vercel serverless proxy per Claude (Anthropic)
 */

const ALLOWED_MODELS = new Set([
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022"
]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY not configured on the Vercel project"
    });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});
  const { model, system, messages, max_tokens, temperature } = body;

  if (!model || !ALLOWED_MODELS.has(model)) {
    return res.status(400).json({
      error: "Missing or invalid 'model'. Allowed: " + [...ALLOWED_MODELS].join(", ")
    });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing 'messages' array" });
  }

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        system: system || undefined,
        messages,
        max_tokens: max_tokens ?? 2000,
        temperature: temperature ?? 0.5
      })
    });
  } catch (err) {
    return res.status(502).json({ error: "Upstream fetch failed: " + err.message });
  }

  const text = await upstream.text();
  res.status(upstream.status);
  res.setHeader("Content-Type", "application/json");
  res.send(text);
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
