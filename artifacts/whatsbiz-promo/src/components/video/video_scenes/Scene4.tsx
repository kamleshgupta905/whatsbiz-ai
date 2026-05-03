import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const recipients = [
    { name: 'Raj Kumar', avatar: 'RK', delay: 0 },
    { name: 'Priya S.', avatar: 'PS', delay: 0.1 },
    { name: 'Amit T.', avatar: 'AT', delay: 0.15 },
    { name: 'Sunita D.', avatar: 'SD', delay: 0.2 },
    { name: 'Vikram M.', avatar: 'VM', delay: 0.25 },
    { name: 'Meera G.', avatar: 'MG', delay: 0.3 },
    { name: 'Rohit B.', avatar: 'RB', delay: 0.35 },
    { name: 'Kavya P.', avatar: 'KP', delay: 0.4 },
  ];

  return (
    <motion.div
      className="absolute inset-0 bg-[#0A1628] flex items-center justify-between px-[8vw] overflow-hidden"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute right-[5%] top-[20%] w-[40vw] h-[40vw] rounded-full bg-[#FF6B35] opacity-5 blur-[120px]"
        animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-[5%] bottom-[10%] w-[30vw] h-[30vw] rounded-full bg-[#25D366] opacity-8 blur-[100px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="w-[42%] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-[#FF6B35] text-[1.2vw] font-bold tracking-widest uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Bulk Broadcast
          </div>
          <h2 className="text-[3.8vw] leading-tight font-extrabold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Ek Click Mein<br />
            <span className="text-gradient-orange">Hazaron Tak Pahuncho</span>
          </h2>
          <p className="text-[1.6vw] text-[#94A3B8] leading-relaxed">
            Send promotions to thousands of customers instantly — no one missed.
          </p>
        </motion.div>

        <motion.div
          className="mt-[4vh] flex items-center gap-[2vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-[#FF6B35]/20 border border-[#FF6B35]/40 rounded-2xl px-[2vw] py-[1vw]">
            <div className="text-[3vw] font-black text-[#FF6B35]">10,000+</div>
            <div className="text-[1vw] text-[#94A3B8]">Messages Sent</div>
          </div>
          <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl px-[2vw] py-[1vw]">
            <div className="text-[3vw] font-black text-[#25D366]">98%</div>
            <div className="text-[1vw] text-[#94A3B8]">Delivered</div>
          </div>
        </motion.div>
      </div>

      <div className="w-[48%] relative z-10">
        <motion.div
          className="bg-[#0D1F3C] border border-[#1E3A5F] rounded-[2vw] p-[2.5vw] shadow-2xl"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
          <div className="flex items-center justify-between mb-[2vh]">
            <div>
              <div className="text-white font-bold text-[1.4vw]">Diwali Offer 🎇</div>
              <div className="text-[#94A3B8] text-[1vw]">Sending to 8 contacts...</div>
            </div>
            <motion.div
              className="bg-[#FF6B35] text-white text-[1vw] font-bold px-[1.5vw] py-[0.6vw] rounded-full"
              animate={phase >= 3 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: phase >= 3 ? Infinity : 0 }}
            >
              LIVE
            </motion.div>
          </div>

          <div className="flex flex-col gap-[1.2vh]">
            {recipients.map((r, i) => (
              <motion.div
                key={r.name}
                className="flex items-center gap-[1.2vw] bg-[#112240]/60 rounded-xl px-[1.5vw] py-[1vh]"
                initial={{ opacity: 0, x: 30 }}
                animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                transition={{ delay: r.delay, duration: 0.4, ease: 'circOut' }}
              >
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gradient-to-tr from-[#25D366] to-[#00FF88] flex items-center justify-center text-black text-[0.8vw] font-bold shrink-0">
                  {r.avatar}
                </div>
                <div className="flex-1 text-white text-[1.1vw]">{r.name}</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={phase >= 3 ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: r.delay + 0.5, type: 'spring' }}
                >
                  <svg className="w-[1.5vw] h-[1.5vw] text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
