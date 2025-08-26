// /lib/qdrant.js
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI();
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = 'real_estate_docs';

export async function initCollection(vectorSize) {
  console.log(`[qdrant] Initializing collection '${COLLECTION}' with vector size ${vectorSize}`);
  await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, {
    vectors: { size: vectorSize, distance: 'Cosine' },
  });
  console.log('[qdrant] Collection initialized');
}

export async function uploadChunks(chunks) {
  console.log(`[qdrant] Uploading ${chunks.length} chunk(s) to '${COLLECTION}'`);
  const embeds = await Promise.all(
    chunks.map((c, i) => {
      console.log(`[qdrant] Generating ADA embedding for chunk ${i}`);
      return openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: c,
      })
      .then(r => r.data[0].embedding)
      .finally(() => console.log(`[qdrant] Completed embedding for chunk ${i}`));
    })
  );

  const points = embeds.map((vector, i) => ({
    id: i,
    vector,
    payload: { text: chunks[i] },
  }));

  console.log('[qdrant] Upserting points to Qdrant');
  await axios.put(
    `${QDRANT_URL}/collections/${COLLECTION}/points`,
    { points }
  );
  console.log('[qdrant] Upload complete');
}

export async function searchQuery(query, topK = 5) {
  console.log(`[qdrant] Searching for query: "${query}"`);
  
  // embed with same model
  const embedRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  const vector = embedRes.data[0].embedding;
  console.log('[qdrant] Embedding generated for search query');

  const res = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
    { vector, limit: topK, with_payload: true }
  );
  console.log(`[qdrant] Received ${res.data.result.length} result(s) from Qdrant`);

  return res.data.result.map(hit => ({
    score: hit.score,
    text: hit.payload.text,
  }));
}
