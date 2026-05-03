import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8 }}
    >
      <video
        src={`${import.meta.env.BASE_URL}videos/chaos.mp4`}
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628]/80 to-black/90" />

      <div className="relative z-10 text-center max-w-[80vw]" style={{ perspective: '1000px' }}>
        <motion.div
          initial={{ y: 50, opacity: 0, rotateX: -20 }}
          animate={phase >= 1 ? { y: 0, opacity: 1, rotateX: 0 } : { y: 50, opacity: 0, rotateX: -20 }}
          transition={{ duration: 1, type: "spring", stiffness: 100 }}
        >
          <h1 className="text-[5vw] leading-[1.1] font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            200+ Pending <br/>
            <span className="text-gradient">WhatsApp Messages?</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-[3vh] text-[2.5vw] text-[#94A3B8] font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          Handling everything alone?
        </motion.p>
      </div>

      {/* Floating UI Badges */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-[#112240] border border-[#25D366]/30 px-[1.5vw] py-[0.8vw] rounded-full flex items-center gap-[0.5vw]"
          style={{
            top: `${10 + Math.random() * 80}%`,
            left: `${10 + Math.random() * 80}%`,
            zIndex: 5
          }}
          initial={{ scale: 0, opacity: 0, y: 50 }}
          animate={phase >= 1 ? { 
            scale: 1, 
            opacity: 0.8,
            y: [0, -20, 0],
          } : { scale: 0, opacity: 0, y: 50 }}
          transition={{ 
            scale: { delay: 0.5 + Math.random() * 1.5, type: "spring" },
            opacity: { delay: 0.5 + Math.random() * 1.5 },
            y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <div className="w-[1vw] h-[1vw] rounded-full bg-[#25D366]" />
          <span className="text-white text-[1vw] font-bold">New Message</span>
        </motion.div>
      ))}

    </motion.div>
  );
}