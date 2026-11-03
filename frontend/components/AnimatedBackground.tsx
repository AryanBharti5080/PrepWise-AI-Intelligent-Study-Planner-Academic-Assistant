"use client";

import React from "react";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1. Base Clean Background with Gentle Radial Tints */}
      <div className="absolute inset-0 bg-radial-mesh-light dark:bg-radial-mesh-dark" />

      {/* 2. Soft, Discreet Ambient Orbs (Far in background, extremely low opacity) */}
      <div className="absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full bg-blue-500/6 dark:bg-blue-600/8 blur-[140px] animate-orb-float-1" />
      <div className="absolute top-[25%] -right-20 h-[460px] w-[460px] rounded-full bg-indigo-500/5 dark:bg-indigo-600/6 blur-[140px] animate-orb-float-2" />

      {/* 3. Subtle Texture Grid */}
      <div className="absolute inset-0 bg-cyber-grid-light dark:bg-cyber-grid-dark" />
    </div>
  );
}


