import { useState, useRef, useEffect } from 'react';

export default function UserChat() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [listening, setListening] = useState(false);
  const [openAITTSPlaying, setOpenAITTSPlaying] = useState(false);
  const [browserTTSPlaying, setBrowserTTSPlaying] = useState(false);
  const [lastBotReply, setLastBotReply] = useState('');

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      audioRef.current?.pause();
      speechSynthesis.cancel();
    };
  }, []);

  const extractImages = text => {
    const urlRegex = /(https?:\/\/\S+\.(?:png|jpe?g|gif|webp))/gi;
    const found = [];
    const cleaned = text.replace(urlRegex, match => {
      found.push(match);
      return '';
    }).trim();
    return { cleaned, found };
  };

  const talk = async text => {
    if (!text.trim()) return;

    setQuery('');
    const updatedHistory = [...history, { user: text }];
    setHistory(updatedHistory);

    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText: text, history: updatedHistory }),
    });

    const { reply } = await res.json();
    const { cleaned, found } = extractImages(reply);

    const newHistory = [...updatedHistory, { bot: cleaned, images: found }];
    setHistory(newHistory);
    setLastBotReply(cleaned);
  };

  const onSend = () => talk(query);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('SpeechRecognition API not supported');

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => setListening(true);
    rec.onresult = e => {
      const txt = e.results[e.results.length - 1][0].transcript;
      setQuery(txt);
      if (e.results[e.results.length - 1].isFinal) {
        rec.stop();
        talk(txt);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();

    recognitionRef.current = rec;
  };

  const playPauseOpenAITTS = async () => {
    if (!lastBotReply) return;
    const audio = audioRef.current;

    if (openAITTSPlaying) {
      audio.pause();
      setOpenAITTSPlaying(false);
      return;
    }

    if (audio.src) {
      audio.play();
      setOpenAITTSPlaying(true);
      return;
    }

    const ttsRes = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lastBotReply }),
    });
    const blob = await ttsRes.blob();
    const url = URL.createObjectURL(blob);

    audio.src = url;
    audio.play();
    setOpenAITTSPlaying(true);

    audio.onended = () => setOpenAITTSPlaying(false);
  };

  const playPauseBrowserTTS = () => {
    if (!lastBotReply) return;

    if (browserTTSPlaying) {
      speechSynthesis.pause();
      setBrowserTTSPlaying(false);
      return;
    }

    if (speechSynthesis.speaking && speechSynthesis.paused) {
      speechSynthesis.resume();
      setBrowserTTSPlaying(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(lastBotReply);
    utteranceRef.current = utterance;
    utterance.onstart = () => setBrowserTTSPlaying(true);
    utterance.onend = () => setBrowserTTSPlaying(false);

    speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 to-indigo-950 text-gray-100 flex flex-col">
      <header className="text-center py-4 bg-gray-800 shadow-md">
        <h2 className="text-3xl font-bold tracking-wide">
          🚀 Futuristic Real‑Estate AI
        </h2>
      </header>

      <main className="flex-grow flex justify-center items-center">
        <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl shadow-2xl p-4">

          <div className="flex-1 space-y-2 overflow-y-auto mb-4 px-2 scrollbar-thin scrollbar-thumb-indigo-500">
            {history.map((m, i) => (
              <div key={i} className="space-y-1">
                {m.user && (
                  <div className="text-right">
                    <span className="inline-block bg-indigo-700 px-3 py-1 rounded-xl">
                      {m.user}
                    </span>
                  </div>
                )}

                {m.bot && (
                  <div className="text-left">
                    <span className="inline-block bg-indigo-500 px-3 py-1 rounded-xl">
                      {m.bot}
                    </span>

                    {m.images && m.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {m.images.map((src, j) => (
                          <img
                            key={j}
                            src={src}
                            alt={`property-${i}-${j}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-indigo-400"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type your query..."
              className="flex-grow px-4 py-2 rounded-full bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={onSend}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-md"
            >
              Send
            </button>
            <button
              onClick={startVoice}
              className={`px-4 py-2 rounded-full shadow-md ${
                listening ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white`}
            >
              {listening ? 'Listening…' : 'Voice'}
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={playPauseOpenAITTS}
              disabled={!lastBotReply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-md"
            >
              {openAITTSPlaying ? '⏸ OpenAI Voice' : '▶️ OpenAI Voice'}
            </button>
            <button
              onClick={playPauseBrowserTTS}
              disabled={!lastBotReply}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-md"
            >
              {browserTTSPlaying ? '⏸ Browser Voice' : '▶️ Browser Voice'}
            </button>
          </div>

          <audio ref={audioRef} className="hidden" />
        </div>
      </main>
    </div>
  );
}
