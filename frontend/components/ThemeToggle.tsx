"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

interface ThemeToggleProps {
  variant?: "pill" | "icon" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "pill", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Variant 1: Quick Icon Toggle (Sun <-> Moon)
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        {resolvedTheme === "dark" ? (
          <Sun size={17} className="text-amber-400 transition-transform hover:rotate-45" />
        ) : (
          <Moon size={17} className="text-indigo-600 transition-transform hover:-rotate-12" />
        )}
      </button>
    );
  }

  // Variant 2: Segmented Pill (Light | System | Dark) - Ideal for Sidebar & Settings
  if (variant === "pill") {
    const options: { value: Theme; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
      { value: "light", label: "Light", icon: Sun },
      { value: "system", label: "Auto", icon: Monitor },
      { value: "dark", label: "Dark", icon: Moon },
    ];

    return (
      <div
        role="group"
        aria-label="Theme selector"
        className={`inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/90 p-1 dark:border-slate-800 dark:bg-slate-900/90 ${className}`}
      >
        {options.map((opt) => {
          const isSelected = theme === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              aria-pressed={isSelected}
              title={`${opt.label} mode`}
            >
              <Icon
                size={13}
                className={
                  isSelected
                    ? opt.value === "dark"
                      ? "text-blue-400"
                      : opt.value === "light"
                      ? "text-amber-500"
                      : "text-indigo-500"
                    : "text-slate-400"
                }
              />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 3: Compact Dropdown Menu
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        aria-label="Choose theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon size={14} className="text-blue-400" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
        <span className="capitalize">{theme}</span>
      </button>

      {dropdownOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {(
            [
              { value: "light", label: "Light Mode", icon: Sun },
              { value: "dark", label: "Dark Mode", icon: Moon },
              { value: "system", label: "System Default", icon: Monitor },
            ] as const
          ).map((item) => {
            const isSelected = theme === item.value;
            const Icon = item.icon;

            return (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(item.value);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;


