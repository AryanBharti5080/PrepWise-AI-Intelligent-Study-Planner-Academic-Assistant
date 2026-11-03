"use client";

import React, { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid SSR hydration issues
    const rafId = requestAnimationFrame(() => setMounted(true));

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return () => cancelAnimationFrame(rafId);
    }

    let timeoutId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse movement updates to keep 60fps and low CPU
      if (timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          setMousePos({ x: e.clientX, y: e.clientY });
          timeoutId = null;
        }, 24);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1. Base Mesh Background (Light enhanced, Dark completely untouched) */}
      <div className="absolute inset-0 bg-radial-mesh-light dark:bg-radial-mesh-dark transition-colors duration-200" />

      {/* 2. Ambient Lighting Orbs */}
      {/* Light mode: Elegant soft sapphire and indigo gradients. Dark mode: Exactly as original */}
      <div className="absolute -top-32 -left-20 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-300/35 via-indigo-200/25 to-transparent blur-[120px] animate-orb-float-1 dark:from-transparent dark:to-transparent dark:bg-blue-600/8 dark:blur-[140px]" />
      <div className="absolute top-[25%] -right-20 h-[480px] w-[480px] rounded-full bg-gradient-to-bl from-sky-300/30 via-cyan-200/20 to-transparent blur-[120px] animate-orb-float-2 dark:from-transparent dark:to-transparent dark:bg-indigo-600/6 dark:blur-[140px]" />
      <div className="absolute -bottom-28 left-[22%] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-indigo-200/30 via-purple-200/20 to-transparent blur-[120px] animate-orb-float-1 dark:hidden" />

      {/* 3. Subtle Texture Grid (Crisp micro-dot pattern in Light, exact original cyber-grid in Dark) */}
      <div className="absolute inset-0 bg-cyber-grid-light dark:bg-cyber-grid-dark opacity-80" />

      {/* 4. Desktop-only Interactive Light-Mode Ambient Cursor Glow (Hidden in dark mode to strictly preserve dark mode) */}
      {mounted && (
        <div
          className="dark:hidden transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translate3d(${mousePos.x - 220}px, ${mousePos.y - 220}px, 0)`,
          }}
        >
          <div className="h-[440px] w-[440px] rounded-full bg-radial from-blue-400/18 via-indigo-300/10 to-transparent blur-[80px]" />
        </div>
      )}
    </div>
  );
}
