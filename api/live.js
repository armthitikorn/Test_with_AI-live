export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "No API Key" });
      return;
    }

    const now = Date.now();
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1alpha/auth_tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          uses: 1, // เปิดเซสชันได้ 1 ครั้ง
          expireTime: new Date(now + 15 * 60 * 1000).toISOString(), // token หมดอายุใน 15 นาที
          newSessionExpireTime: new Date(now + 60 * 1000).toISOString(), // ต้องเริ่มเซสชันภายใน 1 นาที
        }),
      }
    );

    const data = await r.json();
    if (!r.ok || !data.name) {
      console.error("auth_tokens error:", JSON.stringify(data));
      res.status(500).json({ error: data.error?.message || "Cannot create token", detail: data });
      return;
    }

    res.status(200).json({ token: data.name });
  } catch (err) {
    console.error("live handler error:", err);
    res.status(500).json({ error: err.message || "Unexpected error" });
  }
}
