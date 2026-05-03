import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const chars = 'WhatsBiz AI'.split('');

  return (
    <motion.div
      className="absolute inset-0 bg-[#060F1E] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,211,102,0.12) 0%, rgba(6,15,30,1) 70%)',
            'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(37,211,102,0.18) 0%, rgba(6,15,30,1) 70%)',
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,211,102,0.12) 0%, rgba(6,15,30,1) 70%)',
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${0.4 + (i % 3) * 0.3}vw`,
            height: `${0.4 + (i % 3) * 0.3}vw`,
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${10 + (i * 6.3) % 80}%`,
            background: i % 2 === 0 ? '#25D366' : '#00FF88',
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: (i * 0.15) % 2,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="flex items-center gap-[1.5vw] mb-[4vh]"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <div className="w-[7vw] h-[7vw] rounded-[1.5vw] bg-gradient-to-tr from-[#25D366] to-[#00FF88] flex items-center justify-center shadow-[0_0_60px_rgba(37,211,102,0.5)]">
            <svg viewBox="0 0 24 24" className="w-[4vw] h-[4vw] text-white" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </div>
        </motion.div>

        <div className="overflow-hidden" style={{ perspective: '1000px' }}>
          <h1 className="text-[6vw] font-black tracking-tight text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
            {chars.map((char, i) => (
              <motion.span
                key={i}
                style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                initial={{ opacity: 0, y: 60, rotateX: -40 }}
                animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 60, rotateX: -40 }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 25,
                  delay: phase >= 1 ? i * 0.04 : 0,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.p
          className="text-[2.2vw] mt-[2vh] font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-gradient">Aapka Business,</span>
          <span className="text-white"> Supercharged</span>
        </motion.p>

        <motion.div
          className="flex items-center gap-[3vw] mt-[5vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {['Smart', 'Fast', 'Unlimited'].map((word, i) => (
            <motion.div
              key={word}
              className="flex items-center gap-[0.8vw]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.1 + 0.1, type: 'spring' }}
            >
              <motion.div
                className="w-[0.8vw] h-[0.8vw] rounded-full bg-[#25D366]"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
              <span className="text-[1.6vw] text-white font-semibold tracking-wide">{word}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-[5vh] px-[3vw] py-[1.5vh] rounded-full border border-[#25D366]/40 bg-[#25D366]/10"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[1.3vw] text-[#25D366] font-medium">whatsbiz.ai — Start Free Today</span>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#25D366] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={phase >= 2 ? { scaleX: 1, opacity: 0.6 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}
