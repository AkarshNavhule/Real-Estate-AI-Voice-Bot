import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI();
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = 'real_estate_docs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userText, history = [] } = req.body || {};
  if (!userText) {
    return res.status(400).json({ error: 'Missing userText' });
  }

  console.log('[api/search] User text:', userText);

  try {
    // 1️⃣ Refine prompt
    const refine = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a prompt engineer. Rewrite the user request into a concise semantic search query for a real-estate vector database.' },
        { role: 'user', content: userText },
      ],
      temperature: 0.2,
    });
    const searchPrompt = refine.choices[0].message.content.trim();
    console.log('[api/search] Search prompt:', searchPrompt);

    // 2️⃣ Embed & query Qdrant
    const embed = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: searchPrompt,
    });
    const vector = embed.data[0].embedding;
    const qr = await axios.post(
      `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
      { vector, limit: 5, with_payload: true }
    );
    const matches = qr.data.result.map(m => m.payload.text);
    console.log('[api/search] Matches:', matches.length);
    
    // 3️⃣ Compose chat history context
    const contextMessages = [
      {
        role: 'system',
        content:
          `You are a friendly real-estate assistant. 
          Answer user queries about properties clearly and helpfully. 
          If available, include relevant property image URLs (one or more) as direct links in your response. 
          Make sure the image URLs are separate and easy to extract.`,
      },
      ...history.map((m) =>
        m.user
          ? { role: 'user', content: m.user }
          : { role: 'assistant', content: m.bot }
      ),
      {
        role: 'user',
        content: `User asked: "${userText}"\n\nTop matches:\n${matches.join('\n\n')}`,
      },
    ];


    // 4️⃣ Get final reply
    const reply = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: contextMessages,
      temperature: 0.7,
    });
    const finalReply = reply.choices[0].message.content.trim();
    console.log('[api/search] Final reply:', finalReply);

    return res.status(200).json({ reply: finalReply, matches });
  } catch (err) {
    console.error('[api/search] Error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
