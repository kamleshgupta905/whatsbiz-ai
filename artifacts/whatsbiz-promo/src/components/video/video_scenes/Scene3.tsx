import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 bg-[#0A1628] flex items-center justify-between px-[10vw] overflow-hidden"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="absolute top-0 right-0 w-[50vw] h-full bg-gradient-to-l from-[#112240] to-transparent opacity-50" />
      
      {/* Background circles */}
      <motion.div className="absolute left-[20%] top-[30%] w-[30vw] h-[30vw] rounded-full bg-[#25D366] opacity-10 blur-[100px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity }} />

      <div className="w-[45%] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-[#00FF88] text-[1.2vw] font-bold tracking-widest uppercase mb-4">AI Auto-Reply</div>
          <h2 className="text-[4vw] leading-tight font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            AI Replies to <br/>
            <span className="text-gradient">Customer Queries</span>
          </h2>
          <p className="text-[1.8vw] text-[#94A3B8]">
            24/7. Instantly. Accurately.
          </p>
        </motion.div>
      </div>

      <div className="w-[45%] relative z-10 flex flex-col gap-[2vh]">
        {/* Chat bubble 1 - Customer */}
        <motion.div
          className="bg-white/10 backdrop-blur-md border border-white/5 p-[2vw] rounded-[2vw] rounded-bl-sm self-start max-w-[80%]"
          initial={{ opacity: 0, scale: 0.8, x: -50 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.8, x: -50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <p className="text-white text-[1.4vw]">Hi! Are you open today? Do you have the new AirPods?</p>
          <span className="text-white/40 text-[0.9vw] mt-2 block">10:00 AM</span>
        </motion.div>

        {/* Chat bubble 2 - AI typing... */}
        <motion.div
          className="bg-[#25D366]/20 border border-[#25D366]/40 p-[2vw] rounded-[2vw] rounded-br-sm self-end max-w-[80%]"
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={phase >= 3 && phase < 4 ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.8, x: 50, display: phase >= 4 ? 'none' : 'block' }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex gap-[0.5vw]">
            <motion.div className="w-[0.8vw] h-[0.8vw] bg-[#00FF88] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
            <motion.div className="w-[0.8vw] h-[0.8vw] bg-[#00FF88] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
            <motion.div className="w-[0.8vw] h-[0.8vw] bg-[#00FF88] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
          </div>
        </motion.div>

        {/* Chat bubble 3 - AI response */}
        <motion.div
          className="bg-[#25D366]/20 border border-[#25D366]/40 p-[2vw] rounded-[2vw] rounded-br-sm self-end max-w-[90%]"
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={phase >= 4 ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.8, x: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center gap-[0.8vw] mb-2">
            <span className="bg-[#25D366] text-black text-[0.8vw] font-bold px-[0.6vw] py-[0.2vw] rounded-sm">AI Agent</span>
          </div>
          <p className="text-white text-[1.4vw]">Yes, we are open until 8 PM! 🟢 We have AirPods Pro 2 in stock for ₹24,900. Would you like to reserve a pair?</p>
          <span className="text-[#25D366]/60 text-[0.9vw] mt-2 block">10:00 AM</span>
        </motion.div>
      </div>
    </motion.div>
  );
}