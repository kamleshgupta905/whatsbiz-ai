import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    color: '#64748B',
    features: ['1 WhatsApp Number', 'AI Auto-Reply', '500 AI Replies/day', 'Basic Analytics', 'Email Support'],
    cta: 'Get Started',
  },
  {
    name: 'Professional',
    price: '₹2,499',
    period: '/month',
    color: '#25D366',
    features: ['3 WhatsApp Numbers', 'AI Auto-Reply + Training', 'Unlimited AI Replies', 'Bulk Broadcast 10K/mo', 'Advanced Dashboard', 'Priority Support'],
    cta: 'Most Popular',
    highlight: true,
  },
  {
    name: 'Business',
    price: '₹5,999',
    period: '/month',
    color: '#FF6B35',
    features: ['Unlimited Numbers', 'Custom AI Training', 'Unlimited Everything', 'Bulk Broadcast 100K/mo', 'White-label Options', 'Dedicated Manager'],
    cta: 'Contact Sales',
  },
];

export function Scene10Pricing() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #060f1e 0%, #071828 50%, #060f1e 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="text-center mb-[3vh]"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
      >
        <div className="text-[#25D366] text-[1vw] font-bold tracking-[0.2em] uppercase mb-2">Pricing Plans</div>
        <h2 className="text-[3.5vw] font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Plans for <span className="text-gradient">Every Business</span>
        </h2>
        <p className="text-[#64748B] text-[1.2vw] mt-2">Free trial available — no credit card required</p>
      </motion.div>

      <div className="flex gap-[2vw] px-[6vw] w-full">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            className={`flex-1 rounded-[1.5vw] p-[2vw] flex flex-col border ${p.highlight ? 'border-[#25D366]/60' : 'border-[#1e3a5f]'}`}
            style={{
              background: p.highlight ? 'linear-gradient(160deg, #0a2418 0%, #0a1628 100%)' : '#0a1628',
              boxShadow: p.highlight ? '0 0 60px rgba(37,211,102,0.15)' : 'none',
            }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, scale: p.highlight ? 1.03 : 1 } : {}}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 180, damping: 20 }}
          >
            {p.highlight && (
              <div className="bg-[#25D366] text-black text-[0.85vw] font-black text-center py-1.5 rounded-lg mb-4">
                ⭐ MOST POPULAR
              </div>
            )}
            <div className="mb-4">
              <div className="text-[1.2vw] font-bold" style={{ color: p.color }}>{p.name}</div>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-[3vw] font-black text-white">{p.price}</span>
                <span className="text-[#64748B] text-[1vw] mb-1">{p.period}</span>
              </div>
            </div>

            <div className="flex flex-col gap-[1vh] flex-1">
              {p.features.map((f, j) => (
                <motion.div
                  key={f}
                  className="flex items-center gap-2 text-[1vw] text-[#94A3B8]"
                  initial={{ opacity: 0 }}
                  animate={phase >= 2 ? { opacity: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 + j * 0.05 }}
                >
                  <svg className="w-[1.1vw] h-[1.1vw] shrink-0" viewBox="0 0 20 20" fill="currentColor" style={{ color: p.color }}>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-4 py-2.5 rounded-xl text-center text-[1.1vw] font-bold border"
              style={p.highlight ? { background: '#25D366', color: '#000', borderColor: '#25D366' } : { background: 'transparent', color: p.color, borderColor: p.color + '50' }}
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {p.cta}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
