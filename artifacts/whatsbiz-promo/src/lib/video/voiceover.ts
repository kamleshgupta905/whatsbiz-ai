import { useEffect, useRef } from 'react';

const BASE_PATH = '/whatsbiz-promo/audio';

const VOICEOVER_SCRIPTS: Record<string, string[]> = {
  hook: [
    "Are you running a business on WhatsApp?",
    "Every single day, hundreds of customers message you — asking prices, placing orders, demanding updates.",
    "And you're trying to reply to all of them. Manually. One by one.",
  ],
  agitation: [
    "Think about what you're losing right now.",
    "Every unanswered message is a lost sale. Every delayed reply sends your customer straight to your competitor.",
    "You're working sixteen hours a day — and still missing messages.",
    "Your business deserves better than this.",
  ],
  intro: [
    "What if your WhatsApp could reply automatically — intelligently — even while you sleep?",
    "Introducing WhatsBiz AI —",
    "India's most powerful WhatsApp automation platform, built for ambitious businesses like yours.",
  ],
  aiReply: [
    "WhatsBiz AI uses advanced artificial intelligence to understand every customer message and send the perfect reply — instantly.",
    "Whether a customer asks about pricing, availability, delivery time, or support — the AI reads the message and responds in seconds.",
    "No delays. No mistakes. No missed opportunities.",
    "Your customers get instant, professional replies — twenty-four hours a day, seven days a week.",
  ],
  inbox: [
    "Managing hundreds of conversations used to be a nightmare.",
    "With WhatsBiz AI's Smart Inbox, every WhatsApp message is organized in one clean, powerful interface.",
    "See all conversations at a glance. Filter by status. Get AI-suggested replies.",
    "Full control. Zero chaos.",
  ],
  broadcast: [
    "Running a Diwali sale? Launching a new product?",
    "With Bulk Broadcast, send personalized WhatsApp messages to thousands of customers with a single click.",
    "Tracked delivery, read receipts, and real-time analytics included.",
  ],
  dashboard: [
    "The WhatsBiz AI dashboard gives you a complete picture of your business — in real time.",
    "See messages sent, read, and replied to. Track which products get the most inquiries.",
    "Make data-driven decisions that grow your business faster than ever before.",
  ],
  setup: [
    "Getting started with WhatsBiz AI takes less than two minutes.",
    "Simply scan a QR code with your WhatsApp — and you are instantly connected.",
    "No coding, no technical knowledge required. Your existing WhatsApp number, supercharged with AI.",
  ],
  training: [
    "WhatsBiz AI learns your business completely.",
    "Add your products, prices, and FAQs — and the AI answers customer queries accurately, every time.",
    "Train it once. It works forever.",
  ],
  pricing: [
    "WhatsBiz AI offers flexible plans for every business size.",
    "Start with our free trial — no credit card required.",
    "All plans include full AI features, unlimited devices, and priority support.",
  ],
  proof: [
    "Thousands of Indian businesses are already growing with WhatsBiz AI.",
    "From retail shops in Mumbai to startups in Bangalore.",
    "All using AI to respond faster, convert more leads, and work smarter.",
  ],
  closing: [
    "Your customers deserve instant replies. Your business deserves to grow without limits.",
    "WhatsBiz AI — Smart. Fast. Unlimited.",
    "Start your free trial today at whatsbiz dot ai.",
    "Your growth starts now.",
  ],
};

function getBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('male')) ||
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male')) ||
    voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('male')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

function speakLines(lines: string[], timers: ReturnType<typeof setTimeout>[]) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const DELAY_PER_LINE = 4000;
  const speak = () => {
    lines.forEach((text, i) => {
      const t = setTimeout(() => {
        const utt = new SpeechSynthesisUtterance(text);
        const voice = getBestVoice();
        if (voice) utt.voice = voice;
        utt.lang = 'en-IN';
        utt.rate = 0.88;
        utt.pitch = 1.0;
        utt.volume = 1.0;
        window.speechSynthesis.speak(utt);
      }, i * DELAY_PER_LINE);
      timers.push(t);
    });
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    const handler = () => { speak(); window.speechSynthesis.onvoiceschanged = null; };
    window.speechSynthesis.onvoiceschanged = handler;
    setTimeout(speak, 800);
  }
}

const audioAvailable = new Map<string, boolean>();

export function useVoiceover(sceneKey: string, enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const baseKey = sceneKey.replace(/_r[12]$/, '');

  useEffect(() => {
    const cleanup = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };

    cleanup();
    if (!enabled || typeof window === 'undefined') return cleanup;

    const lines = VOICEOVER_SCRIPTS[baseKey] ?? [];

    if (audioAvailable.get(baseKey) === false) {
      speakLines(lines, timersRef.current);
      return cleanup;
    }

    const audio = new Audio(`${BASE_PATH}/${baseKey}.wav`);
    audio.preload = 'auto';
    audioRef.current = audio;

    let resolved = false;
    const fallback = () => {
      if (resolved) return;
      resolved = true;
      audioAvailable.set(baseKey, false);
      speakLines(lines, timersRef.current);
    };

    audio.addEventListener('error', fallback, { once: true });
    audio.addEventListener('canplaythrough', () => {
      if (resolved) return;
      resolved = true;
      audioAvailable.set(baseKey, true);
      audio.play().catch(fallback);
    }, { once: true });

    const timeoutId = setTimeout(fallback, 2500);
    timersRef.current.push(timeoutId);

    return cleanup;
  }, [baseKey, enabled]);
}
