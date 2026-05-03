import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5000),
      setTimeout(() => setPhase(5), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const badges = [
    { text: 'New Order', x: '8%', y: '18%', delay: 0.3 },
    { text: 'Payment Query', x: '72%', y: '12%', delay: 0.5 },
    { text: 'When delivery?', x: '15%', y: '72%', delay: 0.7 },
    { text: 'Is this available?', x: '68%', y: '68%', delay: 0.4 },
    { text: 'Price please', x: '5%', y: '45%', delay: 0.6 },
    { text: 'Discount?', x: '78%', y: '40%', delay: 0.55 },
    { text: 'Hello?', x: '35%', y: '82%', delay: 0.8 },
    { text: 'Still open?', x: '55%', y: '20%', delay: 0.35 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 60%, #0d2137 0%, #060f1e 70%)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
    >
      {badges.map((b, i) => (
        <motion.div
          key={i}
          className="absolute flex items-center gap-2 bg-[#0d2137]/90 border border-[#25D366]/25 backdrop-blur-sm rounded-full px-3 py-2"
          style={{ left: b.x, top: b.y }}
          initial={{ opacity: 0, scale: 0, y: 30 }}
          animate={phase >= 2 ? {
            opacity: [0, 0.85, 0.85],
            scale: [0, 1, 1],
            y: [30, 0, 0],
          } : { opacity: 0, scale: 0, y: 30 }}
          transition={{ delay: b.delay, duration: 0.5, type: 'spring', stiffness: 280, damping: 22 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-[#25D366] shrink-0"
            animate={phase >= 2 ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
          <span className="text-white/80 text-xs font-medium whitespace-nowrap">{b.text}</span>
        </motion.div>
      ))}

      <div className="relative z-10 text-center px-16" style={{ perspective: '1000px' }}>
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 50, rotateX: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: -20 }}
          transition={{ duration: 1, type: 'spring', stiffness: 120, damping: 20 }}
        >
          <motion.span
            className="block text-[6vw] font-black leading-none tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {'200+'.split('').map((ch, i) => (
              <motion.span
                key={i}
                style={{ display: 'inline-block' }}
                animate={phase >= 1 ? { y: [0, -6, 0] } : {}}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.span>
          <span
            className="block text-[5vw] font-black leading-tight text-gradient tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Unanswered Messages
          </span>
        </motion.div>

        <motion.div
          className="w-24 h-1 bg-gradient-to-r from-transparent via-[#25D366] to-transparent mx-auto mb-6 rounded-full"
          initial={{ scaleX: 0 }}
          animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.p
          className="text-[2.2vw] text-[#94A3B8] font-medium leading-relaxed"
          style={{ fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, ease: 'circOut' }}
        >
          Your customers are waiting.
          <br />
          <motion.span
            className="text-white font-semibold"
            initial={{ opacity: 0 }}
            animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            You can't do this alone anymore.
          </motion.span>
        </motion.p>
      </div>
    </motion.div>
  );
}
