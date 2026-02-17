'use client';

import { useEffect, useRef, useState } from 'react';

export default function LiquidGlassDemo() {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);

    // Animated gradient blob background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw flowing gradient blobs
      const blobs = [
        { x: 0.3, y: 0.3, r: 0.4, color: 'rgba(139, 92, 246, 0.3)' },
        { x: 0.7, y: 0.6, r: 0.35, color: 'rgba(236, 72, 153, 0.25)' },
        { x: 0.5, y: 0.8, r: 0.3, color: 'rgba(59, 130, 246, 0.2)' },
        { x: 0.2, y: 0.7, r: 0.25, color: 'rgba(16, 185, 129, 0.15)' },
      ];

      blobs.forEach((blob, i) => {
        const offsetX = Math.sin(time + i) * 0.1;
        const offsetY = Math.cos(time * 0.8 + i) * 0.1;
        const x = (blob.x + offsetX) * canvas.width;
        const y = (blob.y + offsetY) * canvas.height;
        const r = blob.r * canvas.width * (1 + Math.sin(time * 1.5 + i) * 0.1);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">

        {/* Logo */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-light tracking-[0.2em] text-white/90">
            VID<span className="font-semibold">LUXE</span>
          </h1>
          <p className="mt-4 text-white/40 tracking-[0.3em] text-sm uppercase">
            Premium Video Engine
          </p>
        </div>

        {/* Liquid Glass Card - Main */}
        <div
          className="w-full max-w-4xl rounded-3xl p-1 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.08) 100%)',
          }}
        >
          {/* Chromatic aberration border effect */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              boxShadow: `
                inset 0 0 0 1px rgba(255,255,255,0.1),
                0 0 40px rgba(139, 92, 246, 0.1),
                0 0 80px rgba(236, 72, 153, 0.05)
              `,
            }}
          />

          <div
            className="rounded-3xl p-8 md:p-12"
            style={{
              background: 'rgba(20, 20, 30, 0.6)',
              backdropFilter: 'blur(40px) saturate(150%)',
              WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            }}
          >
            {/* Inner glass layers */}
            <div
              className="absolute inset-4 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
              }}
            />

            {/* Upload zone */}
            <div className="mb-10">
              <div
                className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center transition-all duration-500 hover:border-white/20 hover:bg-white/[0.02] cursor-pointer group"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white/60 text-lg mb-2">拖拽视频到这里</p>
                <p className="text-white/30 text-sm">或点击选择文件</p>
              </div>
            </div>

            {/* Score preview */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {/* Overall score */}
              <div className="text-center md:text-left">
                <p className="text-white/40 text-sm tracking-wider mb-4">高级感评分预览</p>
                <div className="flex items-end gap-4">
                  <div className="relative">
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center"
                      style={{
                        background: 'conic-gradient(from 180deg, rgba(202, 138, 4, 0.8) 0deg, rgba(202, 138, 4, 0.2) 260deg, transparent 260deg)',
                        boxShadow: '0 0 60px rgba(202, 138, 4, 0.2)',
                      }}
                    >
                      <div
                        className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
                        style={{
                          background: 'rgba(20, 20, 30, 0.8)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <span className="text-4xl font-light text-white">72</span>
                        <span className="text-xs text-amber-400/80 tracking-wider">GRADE B</span>
                      </div>
                    </div>
                  </div>
                  <div className="pb-2">
                    <p className="text-white/80 text-lg">良好</p>
                    <p className="text-white/40 text-sm">距离顶级还需 18 分</p>
                  </div>
                </div>
              </div>

              {/* Dimension bars */}
              <div className="space-y-3">
                {[
                  { label: '色彩协调度', score: 78, color: 'from-violet-500 to-pink-500' },
                  { label: '排版舒适度', score: 65, color: 'from-blue-500 to-cyan-500' },
                  { label: '构图美感度', score: 72, color: 'from-emerald-500 to-teal-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-white/50 text-sm">{item.label}</span>
                      <span className="text-white/70 text-sm font-medium">{item.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button with liquid effect */}
            <button
              className="w-full relative group overflow-hidden rounded-2xl py-5 text-lg font-medium tracking-wider transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.8) 0%, rgba(202, 138, 4, 0.4) 100%)',
              }}
            >
              {/* Liquid hover effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(202, 138, 4, 1) 0%, rgba(234, 179, 8, 0.8) 50%, rgba(202, 138, 4, 1) 100%)',
                  filter: 'blur(0px)',
                }}
              />
              <span className="relative z-10 text-white/90 group-hover:text-white transition-colors">
                一键升级高级感
              </span>

              {/* Shimmer effect */}
              <div
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {['色彩优化', '排版调整', '动效升级', '质感提升'].map((feature) => (
            <div
              key={feature}
              className="px-5 py-2.5 rounded-full text-sm text-white/60 border border-white/10"
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-16 text-white/20 text-sm tracking-wider">
          LIQUID GLASS · PREMIUM UI DEMO
        </p>
      </div>

      {/* Floating glass orbs */}
      <div className="fixed top-20 right-20 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div className="fixed bottom-20 left-20 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Selection color */
        ::selection {
          background: rgba(202, 138, 4, 0.3);
          color: white;
        }
      `}</style>
    </div>
  );
}
