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
      {/* ======================================================== */}
      {/* 1. BASE MESH LAYER                                       */}
      {/* Light: Smooth multi-stop sapphire/lavender mesh          */}
      {/* Dark: Deep cosmic navy (#080d1a) with rich indigo mesh   */}
      {/* ======================================================== */}
      <div className="absolute inset-0 bg-radial-mesh-light dark:bg-radial-mesh-dark transition-colors duration-200" />

      {/* ======================================================== */}
      {/* 2. SUBTLE TEXTURE GRID                                   */}
      {/* Light: Micro-dot matrix for modern SaaS depth            */}
      {/* Dark: Electric cyan/slate tech grid                      */}
      {/* ======================================================== */}
      <div className="absolute inset-0 bg-cyber-grid-light dark:bg-cyber-grid-dark opacity-80" />

      {/* ======================================================== */}
      {/* 3. LIGHT MODE AMBIENT LIGHTING ORBS (Hidden in Dark)     */}
      {/* Soft, beautiful sapphire, indigo, and sky accents        */}
      {/* ======================================================== */}
      <div className="dark:hidden absolute -top-32 -left-20 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-300/35 via-indigo-200/25 to-transparent blur-[120px] animate-orb-float-1" />
      <div className="dark:hidden absolute top-[25%] -right-20 h-[480px] w-[480px] rounded-full bg-gradient-to-bl from-sky-300/30 via-cyan-200/20 to-transparent blur-[120px] animate-orb-float-2" />
      <div className="dark:hidden absolute -bottom-28 left-[22%] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-indigo-200/30 via-purple-200/20 to-transparent blur-[120px] animate-orb-float-1" />

      {/* ======================================================== */}
      {/* 4. DARK MODE AMBIENT LIGHTING ORBS (Hidden in Light)     */}
      {/* Disabled in dark mode to keep pure card background       */}
      {/* ======================================================== */}

      {/* ======================================================== */}
      {/* 5. INTERACTIVE CURSOR-FOLLOWING GLOW                     */}
      {/* Light: Soft azure halo                                   */}
      {/* ======================================================== */}
      {mounted && (
        <div
          className="transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translate3d(${mousePos.x - 220}px, ${mousePos.y - 220}px, 0)`,
          }}
        >
          {/* Light cursor glow */}
          <div className="dark:hidden h-[440px] w-[440px] rounded-full bg-radial from-blue-400/18 via-indigo-300/10 to-transparent blur-[80px]" />
        </div>
      )}
    </div>
  );
}
