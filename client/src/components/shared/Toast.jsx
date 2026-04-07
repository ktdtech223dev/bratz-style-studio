import React, { useEffect, useState } from 'react';

const TYPE_CONFIG = {
  success: { icon: '\u2705', bg: 'rgba(76,175,80,0.15)', border: 'rgba(76,175,80,0.4)', color: '#66bb6a' },
  error:   { icon: '\u274C', bg: 'rgba(244,67,54,0.15)', border: 'rgba(244,67,54,0.4)', color: '#ef5350' },
  info:    { icon: '\u2139\uFE0F', bg: 'rgba(33,150,243,0.15)', border: 'rgba(33,150,243,0.4)', color: '#42a5f5' },
  reward:  { icon: '\uD83E\uDE99', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.4)', color: '#ffd700' },
};

export default function Toast({ message, type = 'info' }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  useEffect(() => {
    /* slide in */
    const enterTimer = requestAnimationFrame(() => setVisible(true));

    /* start exit after 2.5s */
    const exitTimer = setTimeout(() => setExiting(true), 2500);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      className="fixed left-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl pointer-events-none"
      style={{
        top: 64,
        transform: `translateX(-50%) translateY(${visible && !exiting ? '0' : '-120%'})`,
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        background: config.bg,
        border: `1px solid ${config.border}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ fontSize: 18 }}>{config.icon}</span>
      <span
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: config.color,
        }}
      >
        {message}
      </span>
    </div>
  );
}
