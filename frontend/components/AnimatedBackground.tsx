"use client";

import React, { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Schedule state update after mount to avoid synchronous cascading render warning
    const rafId = requestAnimationFrame(() => {
      setMounted(true);
    });

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return () => cancelAnimationFrame(rafId);
    }

    let timeoutId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse updates gently
      if (timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          setMousePos({ x: e.clientX, y: e.clientY });
          timeoutId = null;
        }, 32);
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
      {/* 1. Base Subtle Mesh Gradient Layer */}
      <div className="absolute inset-0 bg-radial-mesh-light dark:bg-radial-mesh-dark opacity-100 transition-opacity duration-500" />

      {/* 2. Delicate Educational Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid-light dark:bg-cyber-grid-dark" />

      {/* 3. Soft Ambient Accent Orbs (Restrained opacity and smooth blur) */}
      <div className="absolute -top-24 -left-20 h-[480px] w-[480px] rounded-full bg-blue-500/12 dark:bg-blue-600/12 blur-[120px] animate-orb-float-1" />
      
      <div className="absolute top-[25%] -right-20 h-[450px] w-[450px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/12 blur-[130px] animate-orb-float-2" />
      
      <div className="absolute -bottom-24 left-[20%] h-[500px] w-[500px] rounded-full bg-sky-500/10 dark:bg-sky-600/10 blur-[130px] animate-orb-float-3" />

      {/* 4. Interactive Cursor-Following Ambient Glow (Subtle and non-intrusive) */}
      {mounted && (
        <div
          className="transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: `translate3d(${mousePos.x - 200}px, ${mousePos.y - 200}px, 0)`,
          }}
        >
          <div className="h-[400px] w-[400px] rounded-full bg-blue-500/6 dark:bg-blue-400/8 blur-[90px]" />
        </div>
      )}
    </div>
  );
}

