import React from 'react';

export function ChatInput({ query, setQuery, onSend, startVoice, listening }) {
  return (
    <div className="flex space-x-2 mb-2">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type your query…"
        className="flex-grow px-4 py-2 rounded-full bg-gray-700 placeholder-gray-400"
      />
      <button onClick={onSend} className="px-4 py-2 bg-green-500 rounded-full">
        Send
      </button>
      <button
        onClick={startVoice}
        className={`px-4 py-2 rounded-full ${
          listening ? 'bg-red-500' : 'bg-yellow-500'
        }`}
      >
        {listening ? 'Listening…' : 'Voice'}
      </button>
    </div>
  );
}
