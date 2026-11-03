"use client";

import React, { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let timeoutId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse updates gently
      if (timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          setMousePos({ x: e.clientX, y: e.clientY });
          timeoutId = null;
        }, 16);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1. Base Mesh Gradient Layer */}
      <div className="absolute inset-0 bg-radial-mesh-light dark:bg-radial-mesh-dark opacity-90 transition-opacity duration-700" />

      {/* 2. Futuristic Tech Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid-light dark:bg-cyber-grid-dark" />

      {/* 3. Floating Ambient Glowing Orbs */}
      <div className="absolute -top-32 -left-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-blue-400/35 via-indigo-400/25 to-transparent blur-[110px] animate-orb-float-1 dark:from-blue-600/30 dark:via-indigo-600/20" />
      
      <div className="absolute top-[20%] -right-24 h-[580px] w-[580px] rounded-full bg-gradient-to-bl from-cyan-400/30 via-sky-400/20 to-transparent blur-[120px] animate-orb-float-2 dark:from-cyan-500/25 dark:via-blue-600/15" />
      
      <div className="absolute top-[55%] left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-400/25 via-pink-400/15 to-transparent blur-[110px] animate-orb-float-3 dark:from-purple-600/20 dark:via-indigo-800/15" />

      <div className="absolute -bottom-32 right-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-indigo-400/30 via-blue-300/20 to-transparent blur-[130px] animate-orb-float-1 dark:from-blue-500/20 dark:via-indigo-900/20" />

      {/* 4. Interactive Cursor-Following Ambient Glow (Client-only to avoid hydration mismatch) */}
      {mounted && (
        <div
          className="transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translate3d(${mousePos.x - 220}px, ${mousePos.y - 220}px, 0)`,
          }}
        >
          <div className="h-[440px] w-[440px] rounded-full bg-blue-500/15 dark:bg-cyan-400/12 blur-[80px]" />
        </div>
      )}

      {/* 5. Subtle Vignette Depth Framing */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,23,42,0.06)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.5)_100%)]" />
    </div>
  );
}
