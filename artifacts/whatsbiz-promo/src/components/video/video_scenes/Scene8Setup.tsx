import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const steps = [
  { num: '01', title: 'Sign Up', desc: 'Create your WhatsBiz AI account in 30 seconds', done: true },
  { num: '02', title: 'Scan QR Code', desc: 'Link your WhatsApp — just like WhatsApp Web', done: true },
  { num: '03', title: 'You\'re Live!', desc: 'AI starts replying to customers instantly', done: false },
];

export function Scene8Setup() {
  const [phase, setPhase] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (phase < 2) return;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 2500);
      setScanProgress(p);
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [phase]);

  const qrCells = Array.from({ length: 7 * 7 });

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060f1e 0%, #0a2018 50%, #060f1e 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full px-[8vw] flex gap-[5vw] items-center">
        <div className="w-[42%] shrink-0">
          <motion.div
            className="text-[#25D366] text-[1vw] font-bold tracking-[0.2em] uppercase mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
          >
            Quick Setup
          </motion.div>
          <motion.h2
            className="text-[3.8vw] font-black leading-tight text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, type: 'spring' }}
          >
            Ready in
            <br />
            <span className="text-gradient">Under 2 Minutes</span>
          </motion.h2>
          <motion.p
            className="text-[1.6vw] text-[#94A3B8] leading-relaxed mb-8"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            No coding. No installation. No technical knowledge required.
          </motion.p>

          <div className="flex flex-col gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -24 }}
                animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  className="w-[2.8vw] h-[2.8vw] rounded-full flex items-center justify-center text-[1vw] font-black shrink-0 border-2"
                  style={
                    phase >= 3 && s.done
                      ? { background: '#25D366', borderColor: '#25D366', color: '#000' }
                      : { background: 'transparent', borderColor: '#1e3a5f', color: '#64748B' }
                  }
                  animate={phase >= 3 && s.done ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {phase >= 3 && s.done ? '✓' : s.num}
                </motion.div>
                <div>
                  <div className="text-white font-bold text-[1.2vw]">{s.title}</div>
                  <div className="text-[#64748B] text-[1vw]">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <motion.div
            className="relative bg-[#0a1628] border-2 border-[#1e3a5f] rounded-[2vw] p-[2vw] flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.2 }}
            style={{ width: '60%' }}
          >
            <div className="text-white text-[1.2vw] font-semibold mb-[2vh]">Scan to Connect WhatsApp</div>

            <div className="relative p-3 bg-white rounded-[1vw]">
              <div className="grid gap-[0.2vw]" style={{ gridTemplateColumns: 'repeat(7, 1fr)', width: '14vw', height: '14vw' }}>
                {qrCells.map((_, i) => {
                  const isCorner = (r: number, c: number) => (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
                  const r = Math.floor(i / 7), c = i % 7;
                  const filled = isCorner(r, c) || Math.random() > 0.45;
                  return (
                    <div
                      key={i}
                      className="rounded-[0.1vw]"
                      style={{ background: filled ? '#000' : '#fff', aspectRatio: '1' }}
                    />
                  );
                })}
              </div>

              <motion.div
                className="absolute inset-0 rounded-[1vw] overflow-hidden"
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-[0.4vw] rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #25D366, transparent)' }}
                  animate={phase >= 2 ? { top: `${scanProgress * 100}%` } : { top: '0%' }}
                  transition={{ duration: 0.05 }}
                />
              </motion.div>
            </div>

            <motion.div
              className="mt-[2vh] flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/30 rounded-full px-4 py-2"
              initial={{ opacity: 0, scale: 0 }}
              animate={phase >= 3 ? { opacity: 1, scale: 1 } : {}}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span className="text-[#25D366] text-[1vw] font-semibold">Connected Successfully!</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
