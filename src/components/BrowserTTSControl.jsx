import React, { useState, useEffect } from 'react';

export function BrowserTTSControl({ text, playing, onToggle, voices, selected, setSelected }) {
  useEffect(() => {
    const load = () => {
      const vs = speechSynthesis.getVoices();
      voices.splice(0, voices.length, ...vs); 
      // parent’s voices array is updated
      if (!selected && vs.length) {
        const neerja = vs.find(v => v.name.includes('Neerja'));
        setSelected(neerja?.name || vs[0].name);
      }
    };
    speechSynthesis.onvoiceschanged = load;
    load();
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <select
        className="bg-gray-700 px-3 py-1 rounded"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        {voices.map(v => (
          <option key={v.name} value={v.name}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>
      <button
        onClick={onToggle}
        disabled={!text}
        className="px-4 py-2 bg-purple-600 rounded-full"
      >
        {playing ? '⏸ Browser' : '▶️ Browser'}
      </button>
    </div>
  );
}
