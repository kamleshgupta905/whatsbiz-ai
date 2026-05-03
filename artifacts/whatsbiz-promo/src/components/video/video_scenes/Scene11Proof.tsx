import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const testimonials = [
  { name: 'Rajesh Kumar', biz: 'Electronics Store, Mumbai', text: 'WhatsBiz AI handles 300+ customer queries daily. My sales went up 40% in the first month!', rating: 5 },
  { name: 'Priya Sharma', biz: 'Fashion Boutique, Delhi', text: 'I used to miss so many orders at night. Now AI replies 24/7 and my customers love the instant response.', rating: 5 },
  { name: 'Amit Patel', biz: 'Travel Agency, Ahmedabad', text: 'Bulk broadcast saved us during festive season. Sent Diwali offers to 5,000 customers in one click!', rating: 5 },
];

const stats = [
  { val: '10,000+', label: 'Businesses', icon: '🏢' },
  { val: '5 Crore+', label: 'Messages Sent', icon: '💬' },
  { val: '98%', label: 'Customer Satisfaction', icon: '⭐' },
  { val: '3x', label: 'Average Sales Growth', icon: '📈' },
];

function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(p * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return <>{val.toLocaleString()}</>;
}

export function Scene11Proof() {
  const [phase, setPhase] = useState(0);
  const [activeT, setActiveT] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    const id = setInterval(() => setActiveT(t => (t + 1) % testimonials.length), 3000);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #060f1e 0%, #081a0e 50%, #060f1e 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full px-[6vw] pt-[3vh] pb-[1.5vh] text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
      >
        <div className="text-[#25D366] text-[1vw] font-bold tracking-[0.2em] uppercase mb-1">Proven Results</div>
        <h2 className="text-[3.2vw] font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Thousands of Businesses <span className="text-gradient">Trust Us</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-4 gap-[2vw] px-[6vw] mb-[2vh]">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="bg-[#0a1628] border border-[#1e3a5f] rounded-[1.2vw] px-[2vw] py-[2vh] text-center"
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          >
            <div className="text-[2vw] mb-1">{s.icon}</div>
            <div className="text-[2.2vw] font-black text-[#25D366]">{s.val}</div>
            <div className="text-[0.9vw] text-[#64748B]">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 w-full px-[6vw] pb-[3vh] flex gap-[2vw]">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            className="flex-1 bg-[#0a1628] border rounded-[1.2vw] p-[2vw] flex flex-col"
            style={{ borderColor: activeT === i && phase >= 3 ? '#25D366' : '#1e3a5f' }}
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.12, type: 'spring' }}
          >
            <div className="flex mb-3">
              {Array.from({ length: t.rating }).map((_, j) => (
                <span key={j} className="text-[1.2vw]">⭐</span>
              ))}
            </div>
            <p className="text-white text-[1.1vw] leading-relaxed flex-1 italic">"{t.text}"</p>
            <div className="mt-4 pt-3 border-t border-[#1e3a5f]">
              <div className="text-white font-bold text-[1.1vw]">{t.name}</div>
              <div className="text-[#64748B] text-[0.9vw]">{t.biz}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
