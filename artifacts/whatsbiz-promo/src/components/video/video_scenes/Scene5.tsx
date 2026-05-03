import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 7500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const convos = [
    { name: 'Raj Electronics', msg: 'Price for iPhone 15?', unread: 3, active: true },
    { name: 'Priya Boutique', msg: 'Order ready to ship', unread: 1 },
    { name: 'Amit Hardware', msg: 'Bulk order inquiry', unread: 0 },
    { name: 'Sunita Caterers', msg: 'AI replied ✓', unread: 0 },
    { name: 'Vikram Travels', msg: 'Bus available?', unread: 2 },
  ];

  const stats = [
    { label: 'Active Chats', val: '247', color: '#25D366' },
    { label: 'AI Replies Today', val: '1.4K', color: '#00FF88' },
    { label: 'Response Rate', val: '99%', color: '#FF6B35' },
  ];

  const bars = [38, 62, 45, 78, 52, 91, 100];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #060f1e 0%, #081420 50%, #060f1e 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, ease: 'circOut' }}
    >
      <motion.div
        className="absolute top-0 left-[25%] w-[50vw] h-[25vh] bg-[#25D366] blur-[80px] rounded-full pointer-events-none"
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ opacity: 0.05 }}
      />

      <motion.div
        className="w-full px-[5vw] pt-[3vh] pb-[1vh]"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-[#25D366] text-[1vw] font-bold tracking-[0.2em] uppercase mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Smart Dashboard
        </div>
        <h2 className="text-[3.2vw] font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
          All Conversations, <span className="text-gradient">One Place</span>
        </h2>
      </motion.div>

      <div className="flex flex-1 w-full px-[5vw] pb-[3vh] gap-[2vw] overflow-hidden">
        <motion.div
          className="w-[32%] bg-[#0a1628] border border-[#1e3a5f] rounded-[1.2vw] overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e3a5f]">
            <div className="w-2 h-2 rounded-full bg-[#25D366]" />
            <span className="text-white text-[1.1vw] font-semibold">Conversations</span>
            <span className="ml-auto bg-[#25D366] text-black text-[0.8vw] font-bold px-2 py-0.5 rounded-full">Live</span>
          </div>
          {convos.map((c, i) => (
            <motion.div
              key={c.name}
              className={`flex items-center gap-2 px-3 py-2 border-b border-[#1e3a5f]/40 ${c.active ? 'bg-[#25D366]/10' : ''}`}
              initial={{ opacity: 0, x: -16 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: 'circOut' }}
            >
              <div className="w-[2.2vw] h-[2.2vw] rounded-full bg-gradient-to-br from-[#25D366]/40 to-[#1e3a5f] flex items-center justify-center text-white text-[0.85vw] font-bold shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-white text-[1vw] font-semibold truncate">{c.name}</span>
                  {c.unread > 0 && (
                    <span className="bg-[#25D366] text-black text-[0.75vw] font-bold w-[1.4vw] h-[1.4vw] rounded-full flex items-center justify-center shrink-0 ml-1">{c.unread}</span>
                  )}
                </div>
                <span className="text-[#64748B] text-[0.9vw] truncate block">{c.msg}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex-1 flex flex-col gap-[1.5vh]">
          <div className="grid grid-cols-3 gap-[1.5vw]">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="bg-[#0a1628] border border-[#1e3a5f] rounded-[1vw] px-3 py-3 text-center"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 18 }}
              >
                <div className="text-[2.4vw] font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[0.9vw] text-[#64748B] mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex-1 bg-[#0a1628] border border-[#1e3a5f] rounded-[1.2vw] px-4 py-3"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[#64748B] text-[0.9vw] mb-3">Message Volume — Last 7 Days</div>
            <div className="flex items-end gap-[1vw] h-[14vh]">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[0.4vw] overflow-hidden"
                  style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
                >
                  <motion.div
                    className="w-full rounded-t-[0.4vw]"
                    style={{ background: 'linear-gradient(to top, rgba(37,211,102,0.5), rgba(0,255,136,0.85))' }}
                    initial={{ height: '0%' }}
                    animate={phase >= 4 ? { height: `${h}%` } : { height: '0%' }}
                    transition={{ delay: i * 0.06, duration: 0.55, ease: 'circOut' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="flex-1 text-center text-[#64748B] text-[0.8vw]">{d}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
