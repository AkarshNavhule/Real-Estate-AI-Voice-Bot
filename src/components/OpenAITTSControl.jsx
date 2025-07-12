import React, { useState, useRef } from 'react';

export function OpenAITTSControl({ text, voices, playing, onToggle, selected, setSelected }) {
  const audioRef = useRef(null);

  // onToggle is the playPauseOpenAITTS from parent

  return (
    <div className="flex items-center space-x-2">
      <select
        className="bg-gray-700 px-3 py-1 rounded"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        {voices.map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <button
        onClick={onToggle}
        disabled={!text}
        className="px-4 py-2 bg-blue-600 rounded-full"
      >
        {playing ? '⏸ OpenAI' : '▶️ OpenAI'}
      </button>
    </div>
  );
}
