import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setPhase(4), 5500),
      setTimeout(() => setPhase(5), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const contacts = [
    { name: 'Raj Sharma', avatar: 'RS', delay: 0 },
    { name: 'Priya Mehta', avatar: 'PM', delay: 0.08 },
    { name: 'Amit Patel', avatar: 'AP', delay: 0.16 },
    { name: 'Sunita Devi', avatar: 'SD', delay: 0.24 },
    { name: 'Vikram Rao', avatar: 'VR', delay: 0.32 },
    { name: 'Kavya Singh', avatar: 'KS', delay: 0.4 },
  ];

  const flyingDots = Array.from({ length: 14 });

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060f1e 0%, #100a05 50%, #060f1e 100%)' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute right-[10%] top-[20%] w-[35vw] h-[35vw] rounded-full bg-[#FF6B35] blur-[130px] pointer-events-none"
        animate={{ opacity: [0.05, 0.09, 0.05], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {phase >= 3 && flyingDots.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-[#25D366] pointer-events-none"
          style={{ left: '36%', top: '50%' }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: `${(Math.cos((i / flyingDots.length) * Math.PI * 2) * 35)}vw`, y: `${(Math.sin((i / flyingDots.length) * Math.PI * 2) * 25)}vh` }}
          transition={{ duration: 1.2, delay: (i / flyingDots.length) * 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}

      <div className="flex w-full px-[7vw] gap-[4vw] items-center">
        <div className="w-[40%] shrink-0">
          <motion.div
            className="text-[#FF6B35] text-[1vw] font-bold tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            Bulk Broadcast
          </motion.div>
          <motion.h2
            className="text-[3.8vw] font-black leading-tight text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Reach Thousands<br />
            <span className="text-gradient-orange">In One Click</span>
          </motion.h2>
          <motion.p
            className="text-[1.6vw] text-[#94A3B8] leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Flash sales, Diwali offers, product launches — everyone gets your message instantly.
          </motion.p>

          <motion.div
            className="mt-6 flex gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5 }}
          >
            {[['10K+', 'Sent'], ['98%', 'Delivered'], ['3x', 'More Sales']].map(([v, l], i) => (
              <div key={l} className="bg-[#1a0c05] border border-[#FF6B35]/30 rounded-xl px-3 py-2 text-center">
                <div className="text-[1.8vw] font-black text-[#FF6B35]">{v}</div>
                <div className="text-[0.9vw] text-[#64748B]">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex-1">
          <motion.div
            className="bg-[#0d1a2e] border border-[#1e3a5f] rounded-[1.5vw] overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.15 }}
          >
            <div className="flex items-center justify-between px-[2vw] py-[1.5vh] border-b border-[#1e3a5f]">
              <div>
                <div className="text-white font-bold text-[1.3vw]">Diwali Sale 🎇</div>
                <div className="text-[#64748B] text-[1vw]">6 contacts selected</div>
              </div>
              <motion.button
                className="bg-gradient-to-r from-[#FF6B35] to-[#ff8c5a] text-white text-[1vw] font-bold px-[1.5vw] py-[0.8vh] rounded-full shadow-lg"
                animate={phase >= 2 ? { scale: [1, 0.93, 1] } : { scale: 1 }}
                transition={{ duration: 0.25, times: [0, 0.5, 1] }}
              >
                {phase >= 2 ? '✓ Sent!' : 'Send Now'}
              </motion.button>
            </div>

            <div className="px-[1.5vw] py-[1vh] flex flex-col gap-[1.2vh]">
              {contacts.map((c, i) => (
                <motion.div
                  key={c.name}
                  className="flex items-center gap-[1.2vw] bg-[#112240]/50 rounded-xl px-[1.2vw] py-[1vh]"
                  initial={{ opacity: 0, x: 20 }}
                  animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ delay: 0.3 + c.delay, duration: 0.35, ease: 'circOut' }}
                >
                  <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-[0.85vw] font-bold shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1 text-white text-[1.1vw]">{c.name}</div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={phase >= 4 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ delay: 0.2 + c.delay, type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <svg className="w-[1.4vw] h-[1.4vw] text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
