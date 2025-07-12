// /pages/api/upload.js
import mammoth from 'mammoth';
import formidable from 'formidable';
import OpenAI from 'openai';
import { initCollection, uploadChunks } from '../../lib/qdrant';

const openai = new OpenAI();

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  console.log('[api/upload] Request received');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // parse form
  let files;
  try {
    ({ files } = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ files });
      });
    }));
  } catch (err) {
    console.error('[api/upload] Form parse error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }

  // grab first file
  let uploaded = files.file;
  if (Array.isArray(uploaded)) uploaded = uploaded[0];
  if (!uploaded) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = uploaded.filepath;
  console.log('[api/upload] Filepath:', filePath);

  // extract text
  let rawText;
  try {
    ({ value: rawText } = await mammoth.extractRawText({ path: filePath }));
    console.log('[api/upload] Extracted text length:', rawText.length);
  } catch (err) {
    console.error('[api/upload] Mammoth error:', err);
    return res.status(500).json({ error: 'Text extraction failed' });
  }

  // chunk
  const chunks = rawText
    .replace(/\r\n|\n{2,}/g, '\n')
    .match(/[\s\S]{1,500}/g) || [];
  console.log('[api/upload] Chunk count:', chunks.length);
  if (!chunks.length) return res.status(400).json({ error: 'No text content' });

  // get vector size from first chunk using ADA
  let vectorSize;
  try {
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunks[0],
    });
    vectorSize = embedRes.data[0].embedding.length;
    console.log('[api/upload] Determined vector size:', vectorSize);
  } catch (err) {
    console.error('[api/upload] Embedding error:', err);
    return res.status(500).json({ error: 'Embedding failed' });
  }

  // init Qdrant
  try {
    await initCollection(vectorSize);
  } catch (err) {
    console.error('[api/upload] Qdrant init error:', err);
    return res.status(500).json({ error: 'Qdrant init failed' });
  }

  // upload all
  try {
    await uploadChunks(chunks);
  } catch (err) {
    console.error('[api/upload] Qdrant upload error:', err);
    return res.status(500).json({ error: 'Qdrant upload failed' });
  }

  console.log('[api/upload] Indexing complete');
  return res.status(200).json({ message: 'Indexed successfully', count: chunks.length });
}
