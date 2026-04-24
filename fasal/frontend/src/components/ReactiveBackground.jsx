import { useEffect, useRef } from 'react';

export default function ReactiveBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let width, height;
    const spacing = 50; // Wider spacing = fewer particles = better perf

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      const cols = Math.floor(width / spacing) + 1;
      const rows = Math.floor(height / spacing) + 1;
      const p = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          p.push({
            bx: i * spacing,
            by: j * spacing,
            x: i * spacing,
            y: j * spacing,
            len: 2,
            angle: 0,
            opacity: 0.08
          });
        }
      }
      particlesRef.current = p;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const mouse = mouseRef.current;
      const particles = particlesRef.current;
      const maxDist = 200;
      const maxDistSq = maxDist * maxDist;

      for (let i = 0, len = particles.length; i < len; i++) {
        const p = particles[i];
        const dx = mouse.x - p.bx;
        const dy = mouse.y - p.by;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const force = (maxDist - dist) / maxDist;
          const fSq = force * force; // quadratic falloff for smoother feel
          
          p.x += ((p.bx + (dx / dist) * fSq * 12) - p.x) * 0.08;
          p.y += ((p.by + (dy / dist) * fSq * 12) - p.y) * 0.08;
          p.len += ((2 + fSq * 18) - p.len) * 0.1;
          p.angle = Math.atan2(dy, dx);
          p.opacity += ((0.08 + fSq * 0.5) - p.opacity) * 0.1;
        } else {
          p.x += (p.bx - p.x) * 0.04;
          p.y += (p.by - p.y) * 0.04;
          p.len += (2 - p.len) * 0.04;
          p.angle *= 0.95;
          p.opacity += (0.08 - p.opacity) * 0.04;
        }

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = '#1D9E75';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.roundRect(-p.len / 2, -0.8, p.len, 1.6, 1);
        ctx.fill();
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    // Throttled mouse handler — only update ref, no state
    let lastMove = 0;
    const handleMouseMove = (e) => {
      const now = performance.now();
      if (now - lastMove < 16) return; // ~60fps cap on mouse events
      lastMove = now;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    resize();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1, opacity: 0.6, willChange: 'transform' }}
    />
  );
}
