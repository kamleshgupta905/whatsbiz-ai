import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => setPhase(4), 6200),
      setTimeout(() => setPhase(5), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060f1e 0%, #0a1628 50%, #060f1e 100%)' }}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute left-[15%] top-[25%] w-[28vw] h-[28vw] rounded-full bg-[#25D366] blur-[120px] opacity-8 pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex w-full px-[8vw] gap-[4vw] items-center">
        <div className="w-[42%] shrink-0">
          <motion.div
            className="text-[#25D366] text-[1vw] font-bold tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            AI Auto-Reply
          </motion.div>
          <motion.h2
            className="text-[3.8vw] font-black leading-tight text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Perfect Reply,<br />
            <span className="text-gradient">Every Time</span>
          </motion.h2>
          <motion.p
            className="text-[1.6vw] text-[#94A3B8] leading-relaxed mb-6"
            style={{ fontFamily: 'var(--font-body)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            AI reads every message and responds instantly — no delays, no mistakes.
          </motion.p>

          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {[['24/7', 'Always On'], ['0s', 'Response Time'], ['100%', 'Coverage']].map(([val, lbl], i) => (
              <motion.div
                key={lbl}
                className="bg-[#0a1f36] border border-[#1e3a5f] rounded-xl px-3 py-2 text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={phase >= 5 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
              >
                <div className="text-[1.8vw] font-black text-[#25D366]">{val}</div>
                <div className="text-[0.9vw] text-[#64748B]">{lbl}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <motion.div
            className="self-start max-w-[80%] bg-white/8 border border-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3"
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          >
            <p className="text-white text-[1.3vw]">Hi! Do you have the iPhone 15 Pro in stock? What's the price?</p>
            <span className="text-white/35 text-[0.85vw] mt-1 block">Customer · 10:42 AM</span>
          </motion.div>

          <motion.div
            className="self-end max-w-[75%] bg-[#0a2418] border border-[#25D366]/30 rounded-2xl rounded-tr-sm px-4 py-3"
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={phase >= 3 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          >
            <div className="flex gap-[0.5vw] py-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <motion.div
                  key={i}
                  className="w-[0.9vw] h-[0.9vw] rounded-full bg-[#25D366]"
                  animate={phase >= 3 && phase < 4 ? { y: [0, -5, 0] } : { y: 0 }}
                  transition={{ duration: 0.55, repeat: phase >= 3 && phase < 4 ? Infinity : 0, delay: d }}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="self-end max-w-[85%] bg-[#0a2418] border border-[#25D366]/40 rounded-2xl rounded-tr-sm px-4 py-3"
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={phase >= 4 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#25D366] text-black text-[0.75vw] font-black px-2 py-0.5 rounded-md">WhatsBiz AI</div>
              <span className="text-[#25D366]/60 text-[0.85vw]">Replied instantly</span>
            </div>
            <p className="text-white text-[1.3vw] leading-snug">
              Yes! iPhone 15 Pro is in stock. 128GB at ₹1,34,900 and 256GB at ₹1,44,900. We have all colors available. Would you like to reserve one? 😊
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[#25D366]/50 text-[0.85vw]">10:42 AM</span>
              <div className="flex gap-1">
                <svg className="w-[1.2vw] h-[1.2vw] text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <svg className="w-[1.2vw] h-[1.2vw] text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
