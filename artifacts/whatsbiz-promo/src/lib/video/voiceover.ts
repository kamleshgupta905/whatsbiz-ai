import { useEffect, useRef } from 'react';

const VOICEOVER_SCRIPTS: Record<string, { text: string; delay: number }> = {
  hook: {
    text: 'Aapke WhatsApp pe 200 se zyada messages pending hain... aur aap sab kuch akele handle kar rahe ho? Itna pressure sahi nahi hai.',
    delay: 800,
  },
  intro: {
    text: 'Introducing WhatsBiz AI — India ka sabse smart WhatsApp business assistant. Aapke business ke liye, aapki bhasha mein.',
    delay: 600,
  },
  aiReply: {
    text: 'AI automatically har customer query ka jawab deta hai — 24 ghante, 7 din. Bina kisi break ke. Bilkul intelligent aur instant.',
    delay: 500,
  },
  broadcast: {
    text: 'Ek click mein hazaron customers ko promotion bhejo. Diwali offer ho ya naya product launch — sabtak pahuncho instantly.',
    delay: 500,
  },
  dashboard: {
    text: 'Saare WhatsApp conversations ek jagah manage karo. Real-time analytics, AI replies, aur complete customer history — sab kuch ek dashboard mein.',
    delay: 500,
  },
  closing: {
    text: 'WhatsBiz AI — Aapka business, supercharged. Smart. Fast. Unlimited. Aaj hi free trial shuru karo.',
    delay: 1200,
  },
};

function getHindiVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === 'hi-IN') ||
    voices.find(v => v.lang.startsWith('hi')) ||
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.default) ||
    voices[0] ||
    null
  );
}

export function useVoiceover(sceneKey: string, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const baseKey = sceneKey.replace(/_r[12]$/, '');
    const script = VOICEOVER_SCRIPTS[baseKey];
    if (!script) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(script.text);

      const voice = getHindiVoice();
      if (voice) utterance.voice = voice;

      utterance.lang = 'hi-IN';
      utterance.rate = 0.88;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, script.delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [sceneKey, enabled]);
}
