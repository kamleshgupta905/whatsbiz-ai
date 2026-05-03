import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const rings = [1.6, 2.2, 3.0];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, #0a2418 0%, #060f1e 65%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, ease: 'circOut' }}
    >
      {rings.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-[#25D366]/12"
          style={{ width: `${s * 18}vw`, height: `${s * 18}vw` }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      <motion.div className="relative z-10 flex flex-col items-center" style={{ perspective: '1000px' }}>
        <motion.div
          className="w-[14vw] h-[14vw] rounded-[3vw] flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 60%, #00FF88 100%)',
            boxShadow: '0 0 80px rgba(37,211,102,0.45), 0 0 160px rgba(37,211,102,0.18)',
          }}
          initial={{ scale: 0, rotate: -60, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <svg viewBox="0 0 24 24" className="w-[7vw] h-[7vw] text-white" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          <motion.div
            className="absolute -top-2 -right-2 bg-[#00FF88] text-black text-[0.8vw] font-black px-2 py-1 rounded-full"
            initial={{ scale: 0 }}
            animate={phase >= 2 ? { scale: 1 } : { scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.2 }}
          >
            AI
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-[4vh] text-center"
          initial={{ opacity: 0, y: 28 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.7, ease: 'circOut' }}
        >
          <h2 className="text-[5vw] font-black text-white tracking-tight leading-none mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            WhatsBiz <span className="text-gradient">AI</span>
          </h2>
        </motion.div>

        <motion.p
          className="text-[1.8vw] text-[#94A3B8] mt-2 text-center max-w-[55vw] leading-snug"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6 }}
        >
          India's most powerful WhatsApp automation platform
        </motion.p>

        <motion.div
          className="flex items-center gap-6 mt-[4vh]"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {['Intelligent', 'Instant', 'Always On'].map((tag, i) => (
            <motion.div
              key={tag}
              className="flex items-center gap-2 bg-[#25D366]/12 border border-[#25D366]/30 rounded-full px-4 py-2"
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={phase >= 4 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.9 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="w-2 h-2 rounded-full bg-[#25D366]" />
              <span className="text-[#25D366] text-[1.2vw] font-semibold">{tag}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
