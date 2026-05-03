import { useEffect, useRef } from 'react';

export interface VoiceoverLine {
  text: string;
  startDelay: number;
}

export const VOICEOVER_SCRIPTS: Record<string, VoiceoverLine[]> = {
  hook: [
    { text: "Are you drowning in hundreds of unanswered WhatsApp messages?", startDelay: 600 },
    { text: "Your customers are waiting — and you simply can't do this alone anymore.", startDelay: 4200 },
  ],
  intro: [
    { text: "Introducing WhatsBiz AI —", startDelay: 500 },
    { text: "India's most powerful WhatsApp automation platform, built for ambitious businesses like yours.", startDelay: 2200 },
  ],
  aiReply: [
    { text: "Our intelligent AI reads every customer message and sends the perfect reply — instantly.", startDelay: 400 },
    { text: "24 hours a day, 7 days a week. Never miss a sale again.", startDelay: 5500 },
  ],
  broadcast: [
    { text: "Send promotions to thousands of customers with a single click.", startDelay: 400 },
    { text: "Flash sales, Diwali offers, product launches — everyone gets your message, instantly.", startDelay: 4200 },
  ],
  dashboard: [
    { text: "Manage all your WhatsApp conversations from one powerful dashboard.", startDelay: 400 },
    { text: "Real-time analytics, AI insights, and complete customer control — all in one place.", startDelay: 4800 },
  ],
  closing: [
    { text: "WhatsBiz AI.", startDelay: 1500 },
    { text: "Smart. Fast. Unlimited.", startDelay: 3200 },
    { text: "Join the revolution in WhatsApp business automation.", startDelay: 5000 },
    { text: "Start your free trial today.", startDelay: 7800 },
  ],
};

function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
    voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
    voices.find(v => v.lang === 'en-IN' && v.name.includes('Google')) ||
    voices.find(v => v.lang.startsWith('en-') && !v.name.includes('Alex')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices.find(v => v.default) ||
    voices[0] ||
    null
  );
}

function speak(text: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1;
  return utterance;
}

export function useVoiceover(sceneKey: string, enabled: boolean) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const baseKey = sceneKey.replace(/_r[12]$/, '');
    const lines = VOICEOVER_SCRIPTS[baseKey];
    if (!lines) return;

    const ensureVoices = (cb: () => void) => {
      if (window.speechSynthesis.getVoices().length > 0) { cb(); return; }
      window.speechSynthesis.onvoiceschanged = () => { cb(); window.speechSynthesis.onvoiceschanged = null; };
    };

    ensureVoices(() => {
      lines.forEach(line => {
        const timer = setTimeout(() => {
          const utt = speak(line.text);
          window.speechSynthesis.speak(utt);
        }, line.startDelay);
        timersRef.current.push(timer);
      });
    });

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sceneKey, enabled]);
}
