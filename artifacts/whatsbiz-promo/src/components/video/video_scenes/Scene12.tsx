import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene12() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5500),
      setTimeout(() => setPhase(5), 7800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const title = 'WhatsBiz AI'.split('');
  const pills = ['Smart', 'Fast', 'Unlimited'];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 120% 100% at 50% 55%, #071a0f 0%, #060f1e 55%)' }}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,211,102,0.1) 0%, transparent 65%)',
            'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(37,211,102,0.16) 0%, transparent 65%)',
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,211,102,0.1) 0%, transparent 65%)',
          ]
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${0.35 + (i % 4) * 0.2}vw`,
            height: `${0.35 + (i % 4) * 0.2}vw`,
            left: `${4 + (i * 4.1) % 92}%`,
            top: `${8 + (i * 5.7) % 84}%`,
            background: i % 3 === 0 ? '#25D366' : i % 3 === 1 ? '#00FF88' : '#128C7E',
            opacity: 0.35,
          }}
          animate={{ y: [0, -12, 0], opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 2.5 + (i % 4) * 0.5, repeat: Infinity, delay: (i * 0.12) % 2, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="w-[10vw] h-[10vw] rounded-[2.2vw] flex items-center justify-center mb-[4vh]"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 55%, #00FF88 100%)',
            boxShadow: '0 0 80px rgba(37,211,102,0.5), 0 0 200px rgba(37,211,102,0.2)',
          }}
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -45, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <svg viewBox="0 0 24 24" className="w-[5.5vw] h-[5.5vw] text-white" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        </motion.div>

        <div style={{ perspective: '1200px' }}>
          <h1 className="text-[6.5vw] font-black tracking-tight text-white leading-none mb-[2vh]" style={{ fontFamily: 'var(--font-display)' }}>
            {title.map((ch, i) => (
              <motion.span
                key={i}
                style={{ display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}
                initial={{ opacity: 0, y: 70, rotateX: -50 }}
                animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 70, rotateX: -50 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26, delay: phase >= 1 ? 0.15 + i * 0.045 : 0 }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.p
          className="text-[2.2vw] font-semibold mb-[4vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-gradient">Your Business,</span>
          <span className="text-white"> Supercharged</span>
        </motion.p>

        <div className="flex items-center gap-[2.5vw] mb-[4vh]">
          {pills.map((p, i) => (
            <motion.div
              key={p}
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 320, damping: 22 }}
            >
              <motion.div
                className="w-[0.9vw] h-[0.9vw] rounded-full bg-[#25D366]"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35 }}
              />
              <span className="text-[1.8vw] text-white font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{p}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mb-[2.5vh]"
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        >
          <p className="text-[1.6vw] text-[#94A3B8]">Join thousands of Indian businesses growing with AI</p>
        </motion.div>

        <motion.div
          className="px-[3.5vw] py-[1.4vh] rounded-full border border-[#25D366]/50 bg-[#25D366]/12 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="text-[1.4vw] text-[#25D366] font-semibold">Start Free Today — whatsbiz.ai</span>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#25D366] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={phase >= 2 ? { scaleX: 1, opacity: 0.7 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
    </motion.div>
  );
}
