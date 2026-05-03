import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const faqs = [
  { q: 'What are your delivery charges?', a: 'Free delivery on orders above ₹500!' },
  { q: 'What are your business hours?', a: 'We are open 9 AM to 9 PM, Monday to Saturday.' },
  { q: 'Do you accept returns?', a: 'Yes, 7-day return policy on all products.' },
];

export function Scene9Training() {
  const [phase, setPhase] = useState(0);
  const [activeQ, setActiveQ] = useState(0);

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
    const id = setInterval(() => setActiveQ(q => (q + 1) % faqs.length), 2500);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060f1e 0%, #0a1a30 50%, #060f1e 100%)' }}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full px-[7vw] flex gap-[4vw] items-center">
        <div className="w-[40%] shrink-0">
          <motion.div
            className="text-[#00FF88] text-[1vw] font-bold tracking-[0.2em] uppercase mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
          >
            AI Training
          </motion.div>
          <motion.h2
            className="text-[3.8vw] font-black leading-tight text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, type: 'spring' }}
          >
            Train Once.
            <br />
            <span className="text-gradient">Works Forever</span>
          </motion.h2>
          <motion.p
            className="text-[1.6vw] text-[#94A3B8] leading-relaxed mb-6"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            Add your products, prices, and FAQs — the AI learns your business and answers every customer query perfectly.
          </motion.p>

          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : {}}
          >
            {['📦 Product catalog', '💬 Custom quick replies', '🕐 Auto working hours', '👋 Welcome messages'].map((f, i) => (
              <motion.div
                key={f}
                className="flex items-center gap-3 text-[1.1vw] text-[#94A3B8]"
                initial={{ opacity: 0, x: -16 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] shrink-0" />
                {f}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col gap-[1.5vh]">
          <motion.div
            className="bg-[#0a1628] border border-[#1e3a5f] rounded-[1.2vw] p-[2vw]"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 150, damping: 18 }}
          >
            <div className="text-[#25D366] text-[1vw] font-bold mb-3">FAQ Training — AI learns your answers</div>
            <div className="flex flex-col gap-[1.2vh]">
              {faqs.map((f, i) => (
                <motion.div
                  key={f.q}
                  className={`rounded-xl p-[1.2vw] border transition-all ${activeQ === i && phase >= 2 ? 'border-[#25D366]/50 bg-[#25D366]/8' : 'border-[#1e3a5f] bg-[#0d1a2e]/50'}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={phase >= 2 ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="text-[#94A3B8] text-[1vw] mb-1">Q: {f.q}</div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#25D366] text-black text-[0.75vw] font-black px-2 py-0.5 rounded-md shrink-0">AI</div>
                    <div className="text-white text-[1vw]">{f.a}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-[#0a1628] border border-[#1e3a5f] rounded-[1.2vw] p-[2vw] flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : {}}
          >
            <div>
              <div className="text-white font-bold text-[1.2vw]">AI Accuracy Rate</div>
              <div className="text-[#64748B] text-[0.9vw]">After training your business data</div>
            </div>
            <div className="text-[3vw] font-black text-[#25D366]">97%</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
