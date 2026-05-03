/**
 * Generates AI voiceover audio for all video scenes using Gemini TTS.
 * Run: GEMINI_API_KEY=your_key node scripts/generate-voiceover.mjs
 *
 * Free tier: 3 req/min. Script handles rate limits automatically.
 * Expected duration: ~5 minutes for all 12 scenes.
 *
 * Generated .wav files are saved to:
 *   artifacts/whatsbiz-promo/public/audio/<sceneKey>.wav
 *
 * Video auto-uses these files once generated, fallback to Web Speech API otherwise.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../artifacts/whatsbiz-promo/public/audio');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('ERROR: GEMINI_API_KEY not set'); process.exit(1); }

const MODEL = 'gemini-2.5-flash-preview-tts';
const VOICE = 'Charon';
const REQUEST_INTERVAL_MS = 25000;

const SCRIPTS = {
  hook:       `Are you running a business on WhatsApp? Every single day, hundreds of customers message you — asking prices, placing orders, demanding updates. And you're trying to reply to all of them. Manually. One by one.`,
  agitation:  `Think about what you're losing right now. Every unanswered message is a lost sale. Every delayed reply sends your customer straight to your competitor. You're working sixteen hours a day — and still missing messages. Your business deserves better than this.`,
  intro:      `What if your WhatsApp could reply automatically — intelligently — even while you sleep? Introducing WhatsBiz AI — India's most powerful WhatsApp automation platform, built for ambitious businesses like yours.`,
  aiReply:    `WhatsBiz AI uses advanced artificial intelligence to understand every customer message and send the perfect reply — instantly. Whether a customer asks about pricing, availability, delivery time, or support — the AI reads the message, understands the intent, and responds in seconds. No delays. No mistakes. No missed opportunities. Your customers get instant, professional replies — twenty four hours a day, seven days a week.`,
  inbox:      `Managing hundreds of conversations used to be a nightmare. With WhatsBiz AI's Smart Inbox, every WhatsApp message is organized in one clean, powerful interface. See all conversations at a glance. Filter by status. Get AI suggested replies. Take over any conversation manually whenever you choose. Full control. Zero chaos.`,
  broadcast:  `Running a Diwali sale? Launching a new product? With Bulk Broadcast, you can send personalized WhatsApp messages to thousands of customers with a single click. Upload your contact list, craft your message, add images — and send. Tracked delivery, read receipts, and real-time analytics included.`,
  dashboard:  `The WhatsBiz AI dashboard gives you a complete picture of your business in real time. See how many messages were sent, read, and replied to. Track which products get the most inquiries. Monitor your AI's performance. Make data-driven decisions that grow your business faster than ever before.`,
  setup:      `Getting started with WhatsBiz AI takes less than two minutes. Simply scan a QR code with your WhatsApp — just like WhatsApp Web — and you are instantly connected. No complicated installation, no coding, no technical knowledge required. Your existing WhatsApp number, supercharged with AI.`,
  training:   `WhatsBiz AI learns your business completely. Add your products, prices, policies, and frequently asked questions — and the AI will answer customer queries accurately, every single time. Train it once. It works forever. Set custom greetings, working hours, and automatic away messages.`,
  pricing:    `WhatsBiz AI offers flexible plans for every business size. Start with our free trial — no credit card required. Starter, Professional, and Business plans available. All plans include full AI features, unlimited devices, and priority support.`,
  proof:      `Thousands of Indian businesses are already growing with WhatsBiz AI. From retail shops in Mumbai to technology startups in Bangalore. Electronics stores, restaurants, travel agencies, real estate firms — all using AI to respond faster, convert more leads, and work smarter.`,
  closing:    `Your customers deserve instant replies. Your business deserves to grow without limits. WhatsBiz AI — Smart. Fast. Unlimited. Start your free trial today at whatsbiz dot ai. Join the revolution in WhatsApp business automation. Your growth starts now.`,
};

function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const header = Buffer.alloc(44);
  const size = pcmBuffer.length;
  header.write('RIFF', 0); header.writeUInt32LE(36 + size, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * bitDepth / 8, 28);
  header.writeUInt16LE(numChannels * bitDepth / 8, 32); header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36); header.writeUInt32LE(size, 40);
  return Buffer.concat([header, pcmBuffer]);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callTTS(text, attempt = 1) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
      systemInstruction: {
        parts: [{ text: 'You are a confident Indian business professional. Speak in clear, natural Indian English. Warm and engaging tone. Moderate, measured pace.' }],
      },
    }),
  });

  if (res.status === 429) {
    if (attempt > 5) throw new Error('Rate limit: too many retries');
    const body = await res.json().catch(() => ({}));
    const wait = (() => {
      try { return (Number(body.error.details.find(d => d.retryDelay)?.retryDelay?.replace('s','') ?? 65) + 5) * 1000; }
      catch { return 70000; }
    })();
    console.log(`  429 rate limit. Waiting ${Math.round(wait/1000)}s... (attempt ${attempt})`);
    await sleep(wait);
    return callTTS(text, attempt + 1);
  }

  if (res.status === 500) {
    if (attempt > 4) throw new Error('500 server error: too many retries');
    console.log(`  500 server error. Waiting 15s... (attempt ${attempt})`);
    await sleep(15000);
    return callTTS(text, attempt + 1);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error(`No audio in response: ${JSON.stringify(data).slice(0, 300)}`);
  return Buffer.from(b64, 'base64');
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const keys = Object.keys(SCRIPTS);
  let ok = 0, skip = 0, fail = 0;
  console.log(`\nGenerating ${keys.length} voiceover files — ~${Math.round(keys.length * REQUEST_INTERVAL_MS / 60000)} mins expected\n`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const out = path.join(OUTPUT_DIR, `${key}.wav`);
    if (fs.existsSync(out) && fs.statSync(out).size > 2000) {
      console.log(`[${i+1}/${keys.length}] ${key}: already exists (${Math.round(fs.statSync(out).size/1024)}KB), skipping`);
      skip++; continue;
    }
    process.stdout.write(`[${i+1}/${keys.length}] ${key}: generating... `);
    try {
      const pcm = await callTTS(SCRIPTS[key]);
      const wav = pcmToWav(pcm);
      fs.writeFileSync(out, wav);
      console.log(`OK (${Math.round(wav.length/1024)}KB)`);
      ok++;
      if (i < keys.length - 1) {
        process.stdout.write(`  Throttling ${REQUEST_INTERVAL_MS/1000}s...\n`);
        await sleep(REQUEST_INTERVAL_MS);
      }
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone — Generated: ${ok}  Skipped: ${skip}  Failed: ${fail}`);
  if (fail > 0) console.log('Re-run the script to retry failed files. Already-generated files will be skipped.');
}

main();
