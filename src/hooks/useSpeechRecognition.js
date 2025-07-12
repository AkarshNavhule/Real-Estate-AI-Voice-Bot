import { useState, useRef, useEffect } from 'react';

export function useSpeechRecognition(onFinal) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    return () => { recogRef.current?.stop(); };
  }, []);

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('SpeechRecognition API not supported');
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onresult = e => {
      const txt = e.results[e.results.length - 1][0].transcript;
      if (e.results[e.results.length - 1].isFinal) {
        rec.stop();
        onFinal(txt);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recogRef.current = rec;
  }

  return { listening, start };
}
