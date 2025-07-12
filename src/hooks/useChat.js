import { useState } from 'react';

export function useChat() {
  const [history, setHistory] = useState([]);
  const [lastBotReply, setLastBotReply] = useState('');

  function extractImages(text) {
    const urlRegex = /(https?:\/\/\S+\.(?:png|jpe?g|gif|webp))/gi;
    const found = [];
    const cleaned = text.replace(urlRegex, m => (found.push(m), ''));
    return { cleaned: cleaned.trim(), found };
  }

  async function send(userText) {
    if (!userText.trim()) return;
    const updated = [...history, { user: userText }];
    setHistory(updated);

    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText, history: updated }),
    });
    const { reply } = await res.json();
    const { cleaned, found } = extractImages(reply);
    const newHist = [...updated, { bot: cleaned, images: found }];
    setHistory(newHist);
    setLastBotReply(cleaned);
  }

  return { history, lastBotReply, send };
}
