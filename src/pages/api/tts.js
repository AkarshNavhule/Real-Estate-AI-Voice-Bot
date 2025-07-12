// /pages/api/tts.js
import OpenAI from "openai";

const openai = new OpenAI();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;        // use req.body, not req.json()
  if (!text) {
    return res.status(400).json({ error: "Missing text field" });
  }

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",     // your chosen TTS model
      voice: "nova",      // e.g. 'nova' for a female‑sounding voice
      input: text,
      format: "mp3",
    });

    // The SDK returns a ReadableStream, convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err) {
    console.error("[api/tts] Error:", err);
    res.status(500).json({ error: "TTS synthesis failed" });
  }
}
