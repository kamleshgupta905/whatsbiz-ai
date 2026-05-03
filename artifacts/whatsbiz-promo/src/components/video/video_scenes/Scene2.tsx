import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 bg-[#0A1628] flex flex-col items-center justify-center overflow-hidden"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <video
        src={`${import.meta.env.BASE_URL}videos/tech-bg.mp4`}
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          className="w-[15vw] h-[15vw] rounded-[3vw] bg-gradient-to-tr from-[#25D366] to-[#00FF88] flex items-center justify-center shadow-[0_0_80px_rgba(37,211,102,0.4)]"
          initial={{ scale: 0, rotate: -90 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <svg viewBox="0 0 24 24" className="w-[8vw] h-[8vw] text-white" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        </motion.div>

        <motion.div
          className="mt-[4vh] text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[4vw] font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            WhatsBiz AI
          </h2>
          <p className="text-[2vw] text-[#00FF88] font-medium tracking-wide">
            India's Smart WhatsApp Assistant
          </p>
        </motion.div>
      </div>

    </motion.div>
  );
}