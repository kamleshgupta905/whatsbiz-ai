import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const conversations = [
    { name: 'Raj Electronics', msg: 'Price for iPhone 15?', time: '10:32', unread: 3, active: true },
    { name: 'Priya Boutique', msg: 'Order ready for pickup', time: '10:28', unread: 1, active: false },
    { name: 'Amit Hardware', msg: 'Bulk order inquiry', time: '10:15', unread: 0, active: false },
    { name: 'Sunita Sweets', msg: 'Thank you! AI replied', time: '10:05', unread: 0, active: false },
    { name: 'Vikram Travels', msg: 'Is AC bus available?', time: '09:58', unread: 2, active: false },
  ];

  const stats = [
    { label: 'Active Chats', value: '247', color: '#25D366' },
    { label: 'AI Replies', value: '1.2K', color: '#00FF88' },
    { label: 'Response Rate', value: '99%', color: '#FF6B35' },
  ];

  return (
    <motion.div
      className="absolute inset-0 bg-[#060F1E] flex items-center justify-between px-[6vw] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.7, ease: 'circOut' }}
    >
      <motion.div
        className="absolute top-0 left-[30%] w-[40vw] h-[30vh] bg-[#25D366] opacity-5 blur-[80px] rounded-full"
        animate={{ x: [0, 30, 0], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="w-[100%] relative z-10">
        <motion.div
          className="text-center mb-[3vh]"
          initial={{ opacity: 0, y: -30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-[#25D366] text-[1.1vw] font-bold tracking-widest uppercase mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Smart Dashboard
          </div>
          <h2 className="text-[3.5vw] font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Saare Conversations <span className="text-gradient">Ek Jagah</span>
          </h2>
        </motion.div>

        <div className="flex gap-[2vw]">
          <motion.div
            className="w-[35%] bg-[#0A1628] border border-[#1E3A5F] rounded-[1.5vw] overflow-hidden"
            initial={{ opacity: 0, x: -40 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.7, ease: 'circOut' }}
          >
            <div className="flex items-center gap-[1vw] px-[1.5vw] py-[1.2vh] border-b border-[#1E3A5F]">
              <div className="w-[2vw] h-[2vw] rounded-full bg-gradient-to-tr from-[#25D366] to-[#00FF88]" />
              <span className="text-white text-[1.2vw] font-semibold">Conversations</span>
              <span className="ml-auto bg-[#25D366] text-black text-[0.9vw] font-bold px-[0.8vw] py-[0.2vh] rounded-full">Live</span>
            </div>
            <div className="flex flex-col">
              {conversations.map((c, i) => (
                <motion.div
                  key={c.name}
                  className={`flex items-start gap-[1vw] px-[1.5vw] py-[1.2vh] border-b border-[#1E3A5F]/40 cursor-pointer ${c.active ? 'bg-[#25D366]/10' : 'hover:bg-[#112240]/40'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: 'circOut' }}
                >
                  <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#25D366]/30 flex items-center justify-center text-white text-[0.9vw] font-bold shrink-0 mt-[0.3vh]">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-[1.1vw] font-semibold truncate">{c.name}</span>
                      <span className="text-[#64748B] text-[0.9vw] shrink-0 ml-1">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-[0.3vh]">
                      <span className="text-[#64748B] text-[0.95vw] truncate">{c.msg}</span>
                      {c.unread > 0 && (
                        <span className="bg-[#25D366] text-black text-[0.8vw] font-bold w-[1.4vw] h-[1.4vw] rounded-full flex items-center justify-center shrink-0 ml-1">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="flex-1 flex flex-col gap-[2vh]"
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.7, ease: 'circOut', delay: 0.1 }}
          >
            <div className="grid grid-cols-3 gap-[1.5vw]">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="bg-[#0A1628] border border-[#1E3A5F] rounded-[1.2vw] px-[1.5vw] py-[2vh] text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                >
                  <div className="text-[2.8vw] font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[#94A3B8] text-[1vw] mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="flex-1 bg-[#0A1628] border border-[#1E3A5F] rounded-[1.5vw] p-[2vw]"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-[#94A3B8] text-[1vw] mb-[2vh]">Message Volume — Last 7 Days</div>
              <div className="flex items-end gap-[1vw] h-[12vh]">
                {[40, 65, 45, 80, 55, 90, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-[0.5vw] bg-gradient-to-t from-[#25D366]/60 to-[#00FF88]/80"
                    initial={{ scaleY: 0 }}
                    animate={phase >= 3 ? { scaleY: 1 } : { scaleY: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: 'circOut' }}
                    style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-[1vh]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="flex-1 text-center text-[#64748B] text-[0.9vw]">{d}</div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
