import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { OpenAITTSControl } from './OpenAITTSControl';
import { BrowserTTSControl } from './BrowserTTSControl';

export default function UserChat() {
  const { history, lastBotReply, send } = useChat();
  const { listening, start } = useSpeechRecognition(send);

  const [query, setQuery] = useState('');
  const [openAITTSPlaying, setOpenAITTSPlaying] = useState(false);
  const [browserTTSPlaying, setBrowserTTSPlaying] = useState(false);

  const [browserVoices, setBrowserVoices] = useState([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState('');
  const openAIVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const [selectedOpenAIVoice, setSelectedOpenAIVoice] = useState('nova');

  const audioRef = useRef(null);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setBrowserVoices(voices);
      if (!selectedBrowserVoice && voices.length) {
        const neerja = voices.find(v => v.name.includes('Neerja'));
        setSelectedBrowserVoice(neerja?.name || voices[0].name);
      }
    };
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, [selectedBrowserVoice]);

  const onSend = () => {
    send(query);
    setQuery('');
  };

  const playPauseOpenAITTS = async () => {
    if (!lastBotReply) return;
    const audio = audioRef.current || (audioRef.current = new Audio());
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
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lastBotReply, voice: selectedOpenAIVoice }),
    });
    const blob = await res.blob();
    audio.src = URL.createObjectURL(blob);
    audio.play();
    setOpenAITTSPlaying(true);
    audio.onended = () => setOpenAITTSPlaying(false);
  };

  const playPauseBrowserTTS = () => {
    if (!lastBotReply) return;
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setBrowserTTSPlaying(false);
      return;
    }
    if (speechSynthesis.speaking && speechSynthesis.paused) {
      speechSynthesis.resume();
      setBrowserTTSPlaying(true);
      return;
    }
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(lastBotReply);
    const voiceObj = speechSynthesis.getVoices().find(v => v.name === selectedBrowserVoice);
    if (voiceObj) utt.voice = voiceObj;
    utt.onstart = () => setBrowserTTSPlaying(true);
    utt.onend = () => setBrowserTTSPlaying(false);
    utt.onerror = () => setBrowserTTSPlaying(false);
    speechSynthesis.speak(utt);
  };

  // Automatically play browser TTS when lastBotReply changes
  useEffect(() => {
    if (!lastBotReply) return;

    speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(lastBotReply);
    const voiceObj = speechSynthesis.getVoices().find(v => v.name === selectedBrowserVoice);
    if (voiceObj) utt.voice = voiceObj;

    utt.onstart = () => setBrowserTTSPlaying(true);
    utt.onend = () => setBrowserTTSPlaying(false);
    utt.onerror = () => setBrowserTTSPlaying(false);

    speechSynthesis.speak(utt);
  }, [lastBotReply, selectedBrowserVoice]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 to-indigo-950 text-gray-100 flex flex-col">
      <header className="text-center py-4 bg-gray-800 shadow-md">
        <h2 className="text-3xl font-bold">🚀 Futuristic Real‑Estate AI</h2>
      </header>
      <main className="flex-grow flex justify-center items-center">
        <div className="w-full max-w-4xl h-[80vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl p-4">
          
          {/* Chat history */}
          <ChatHistory history={history} />

          {/* User input */}
          <ChatInput
            query={query}
            setQuery={setQuery}
            onSend={onSend}
            startVoice={start}
            listening={listening}
          />

          {/* TTS Controls */}
          <div className="flex flex-col space-y-3">
            <OpenAITTSControl
              text={lastBotReply}
              voices={openAIVoices}
              playing={openAITTSPlaying}
              onToggle={playPauseOpenAITTS}
              selected={selectedOpenAIVoice}
              setSelected={setSelectedOpenAIVoice}
            />
            <BrowserTTSControl
              text={lastBotReply}
              voices={browserVoices}
              playing={browserTTSPlaying}
              onToggle={playPauseBrowserTTS}
              selected={selectedBrowserVoice}
              setSelected={setSelectedBrowserVoice}
            />
          </div>

          <audio ref={audioRef} className="hidden" />
        </div>
      </main>
    </div>
  );
}
