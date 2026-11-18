export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: "No API Key" } });
    return;
  }

  const model = process.env.EVAL_MODEL || "gemini-3.6-flash";
  const { contents, generationConfig } = req.body || {};
  if (!contents) {
    res.status(400).json({ error: { message: "Missing contents" } });
    return;
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({ contents, generationConfig }),
      }
    );
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error("evaluate error:", err);
    res.status(500).json({ error: { message: err.message || "Evaluate failed" } });
  }
}
