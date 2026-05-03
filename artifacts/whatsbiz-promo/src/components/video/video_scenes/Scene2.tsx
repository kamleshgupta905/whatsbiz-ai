import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const pains = [
  { icon: '💸', title: 'Lost Sales', desc: 'Every unanswered message = lost revenue' },
  { icon: '🏃', title: 'Customers Leave', desc: 'They go to your competitor instantly' },
  { icon: '😴', title: 'No Rest', desc: 'You work 16 hrs/day and still miss chats' },
  { icon: '📉', title: 'Business Suffers', desc: 'Growth is impossible without automation' },
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5500),
      setTimeout(() => setPhase(5), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #1a0608 0%, #060f1e 70%)' }}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,38,38,0.3) 0%, transparent 70%)' }}
      />

      <div className="w-full px-[8vw] flex gap-[5vw] items-center">
        <div className="w-[42%] shrink-0">
          <motion.div
            className="text-red-400 text-[1vw] font-bold tracking-[0.2em] uppercase mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            The Real Cost
          </motion.div>
          <motion.h2
            className="text-[3.8vw] font-black leading-tight text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.1, type: 'spring', stiffness: 120 }}
          >
            Every Missed Message
            <br />
            <span style={{ color: '#ef4444' }}>Costs You Money</span>
          </motion.h2>
          <motion.p
            className="text-[1.6vw] text-[#94A3B8] leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6 }}
          >
            While you're sleeping, eating, or handling other tasks — your customers are messaging, waiting, and leaving.
          </motion.p>

          <motion.div
            className="mt-6 bg-red-950/40 border border-red-800/40 rounded-2xl px-5 py-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="text-red-300 text-[1vw] font-semibold mb-1">Average business loses:</div>
            <div className="text-[2.8vw] font-black text-red-400">₹4.2L / year</div>
            <div className="text-[#94A3B8] text-[1vw]">from unanswered WhatsApp messages</div>
          </motion.div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-[1.5vw]">
          {pains.map((p, i) => (
            <motion.div
              key={p.title}
              className="bg-[#0d1a2e]/80 border border-red-900/40 rounded-[1.2vw] p-[2vw] flex flex-col gap-2"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 18 }}
            >
              <div className="text-[2.5vw]">{p.icon}</div>
              <div className="text-white font-bold text-[1.3vw]">{p.title}</div>
              <div className="text-[#94A3B8] text-[1vw] leading-snug">{p.desc}</div>
              <motion.div
                className="w-full h-0.5 bg-gradient-to-r from-red-600/60 to-transparent rounded-full mt-1"
                initial={{ scaleX: 0 }}
                animate={phase >= 4 ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                style={{ transformOrigin: 'left' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
