import React, { useRef, useEffect, useCallback } from 'react';

const DEFAULT_COLORS = ['#ff2d78', '#ffd700', '#ffffff', '#00e5ff', '#ff69b4'];
const GRAVITY = 0.3;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Confetti({
  active = false,
  x = window.innerWidth / 2,
  y = window.innerHeight / 2,
  count = 30,
  colors = DEFAULT_COLORS,
  duration = 1500,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startRef = useRef(null);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* create particles */
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(4, 12);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(2, 6),
        size: randomBetween(4, 8),
        color: colors[i % colors.length],
        rotation: Math.random() * 360,
        rotSpeed: randomBetween(-8, 8),
        isCircle: Math.random() > 0.5,
      });
    }

    startRef.current = performance.now();

    function frame(now) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;

        const alpha = 1 - progress;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        ctx.restore();
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animRef.current = requestAnimationFrame(frame);
  }, [x, y, count, colors, duration]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998 }}
    />
  );
}
