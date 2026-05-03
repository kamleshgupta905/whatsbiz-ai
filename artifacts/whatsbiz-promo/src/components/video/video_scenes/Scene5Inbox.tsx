import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const messages = [
  { from: 'Raj Electronics', text: 'Do you have iPhone 15 Pro Max?', time: '10:42', unread: 3, status: 'ai' },
  { from: 'Priya Fashion', text: 'What are your delivery charges?', time: '10:39', unread: 1, status: 'ai' },
  { from: 'Amit Hardware', text: 'I want to place a bulk order', time: '10:35', unread: 0, status: 'resolved' },
  { from: 'Sunita Caterers', text: 'Can you deliver by tomorrow?', time: '10:28', unread: 0, status: 'resolved' },
  { from: 'Vikram Travels', text: 'What is the price for Goa trip?', time: '10:15', unread: 2, status: 'pending' },
  { from: 'Kavya Jewellers', text: 'Gold rate today?', time: '09:58', unread: 0, status: 'ai' },
];

const statusColors: Record<string, string> = {
  ai: '#25D366',
  resolved: '#64748B',
  pending: '#FF6B35',
};
const statusLabels: Record<string, string> = {
  ai: 'AI Replied',
  resolved: 'Resolved',
  pending: 'Pending',
};

export function Scene5Inbox() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060f1e 0%, #091a30 50%, #060f1e 100%)' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full px-[7vw] flex gap-[4vw] items-center">
        <div className="w-[38%] shrink-0">
          <motion.div
            className="text-[#25D366] text-[1vw] font-bold tracking-[0.2em] uppercase mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Smart Inbox
          </motion.div>
          <motion.h2
            className="text-[3.6vw] font-black leading-tight text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Every Chat,
            <br />
            <span className="text-gradient">Organized</span>
          </motion.h2>
          <motion.p
            className="text-[1.6vw] text-[#94A3B8] leading-relaxed mb-6"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Filter, prioritize, and manage hundreds of WhatsApp conversations — with AI assistance on every message.
          </motion.p>

          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={phase >= 4 ? { opacity: 1 } : {}}
          >
            {[
              { label: 'AI Replied', count: '847', color: '#25D366' },
              { label: 'Pending', count: '12', color: '#FF6B35' },
              { label: 'Resolved Today', count: '203', color: '#64748B' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="flex items-center justify-between bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-4 py-2"
                initial={{ opacity: 0, x: -16 }}
                animate={phase >= 4 ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[#94A3B8] text-[1vw]">{s.label}</span>
                </div>
                <span className="font-black text-[1.4vw]" style={{ color: s.color }}>{s.count}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="flex-1 bg-[#0a1628] border border-[#1e3a5f] rounded-[1.5vw] overflow-hidden"
          style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 }}
        >
          <div className="flex items-center justify-between px-[2vw] py-[1.5vh] border-b border-[#1e3a5f]">
            <span className="text-white font-bold text-[1.2vw]">WhatsBiz Inbox</span>
            <div className="flex gap-2">
              {['All', 'AI', 'Pending'].map((f, i) => (
                <button
                  key={f}
                  className={`text-[0.9vw] px-3 py-1 rounded-full ${i === 0 ? 'bg-[#25D366] text-black font-bold' : 'text-[#64748B] hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            {messages.map((m, i) => (
              <motion.div
                key={m.from}
                className={`flex items-center gap-[1.2vw] px-[2vw] py-[1.4vh] border-b border-[#1e3a5f]/30 ${i === 0 ? 'bg-[#25D366]/8' : ''}`}
                initial={{ opacity: 0, x: 30 }}
                animate={phase >= 2 ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.4, ease: 'circOut' }}
              >
                <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#0a1628] border border-[#25D366]/20 flex items-center justify-center text-white text-[1vw] font-bold shrink-0">
                  {m.from[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-[1.05vw] font-semibold truncate">{m.from}</span>
                    <span className="text-[#64748B] text-[0.85vw] shrink-0 ml-2">{m.time}</span>
                  </div>
                  <span className="text-[#64748B] text-[0.95vw] truncate block">{m.text}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.unread > 0 && (
                    <span className="bg-[#25D366] text-black text-[0.75vw] font-bold w-[1.5vw] h-[1.5vw] rounded-full flex items-center justify-center">
                      {m.unread}
                    </span>
                  )}
                  <motion.span
                    className="text-[0.8vw] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${statusColors[m.status]}22`, color: statusColors[m.status] }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={phase >= 3 ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.06, type: 'spring' }}
                  >
                    {statusLabels[m.status]}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
