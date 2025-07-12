import React from 'react';

export function ChatHistory({ history }) {
  return (
    <div className="flex-1 overflow-y-auto mb-4 px-2 space-y-2">
      {history.map((m, i) => (
        <div key={i} className={m.user ? 'text-right' : 'text-left'}>
          <span className={`inline-block px-3 py-1 rounded-xl ${
            m.user ? 'bg-indigo-700' : 'bg-indigo-500'
          }`}>
            {m.user || m.bot}
          </span>
          {m.images?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {m.images.map((src, j) => (
                <img
                  key={j}
                  src={src}
                  className="w-full h-32 object-cover rounded-lg border-2 border-indigo-400"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
