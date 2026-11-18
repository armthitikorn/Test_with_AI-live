export const config = { maxDuration: 60 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRY_STATUS = [429, 500, 503, 504];

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

  const { contents, generationConfig } = req.body || {};
  if (!contents) {
    res.status(400).json({ error: { message: "Missing contents" } });
    return;
  }

  // ลองโมเดลหลักก่อน ถ้าคนใช้เยอะ (503/429) จะลองซ้ำ แล้วสลับไปโมเดลสำรอง
  const models = [
    process.env.EVAL_MODEL || "gemini-3.6-flash",
    process.env.EVAL_MODEL_FALLBACK || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ];

  let last = { status: 500, data: { error: { message: "Evaluate failed" } } };

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({ contents, generationConfig }),
          }
        );
        const data = await r.json();
        if (r.ok) {
          res.status(200).json(data);
          return;
        }
        last = { status: r.status, data };
        console.error(`evaluate ${model} attempt ${attempt + 1}:`, r.status, data.error?.message);
        if (!RETRY_STATUS.includes(r.status)) break; // error ประเภทอื่น ลองซ้ำไม่ช่วย
        await sleep(1500 * (attempt + 1));
      } catch (err) {
        last = { status: 500, data: { error: { message: err.message } } };
        await sleep(1000);
      }
    }
  }

  res.status(last.status).json(last.data);
}
