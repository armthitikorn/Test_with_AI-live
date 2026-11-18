import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "No API Key" });
    return;
  }

  try {
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const now = Date.now();
    const token = await client.authTokens.create({
      config: {
        uses: 1, // ใช้เปิดได้ 1 เซสชันเท่านั้น
        expireTime: new Date(now + 15 * 60 * 1000).toISOString(), // token หมดอายุใน 15 นาที
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(), // ต้องเริ่มเซสชันภายใน 1 นาที
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    res.status(200).json({ token: token.name });
  } catch (err) {
    console.error("create token error:", err);
    res.status(500).json({ error: err.message || "Cannot create token" });
  }
}
