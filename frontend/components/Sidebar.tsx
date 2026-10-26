"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  Sparkles,
  History,
  Target,
  Briefcase,
  BookmarkCheck,
  TrendingUp,
  RotateCcw,
  LogOut,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import ThemeToggle from "./ThemeToggle";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  exactMatch?: boolean;
  badge?: string;
  disabled?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        name: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        exactMatch: true,
      },
    ],
  },
  {
    title: "Learning",
    items: [
      {
        name: "AI Study Planner",
        href: "/planner",
        icon: BookOpen,
        exactMatch: true,
      },
      {
        name: "Saved Study Plans",
        href: "/plans",
        icon: Bookmark,
        exactMatch: true,
      },
      {
        name: "AI Quiz",
        href: "/quiz",
        icon: Sparkles,
        exactMatch: true,
      },
      {
        name: "Quiz History",
        href: "/quiz/history",
        icon: History,
        exactMatch: true,
      },
      {
        name: "Weak Topic Analysis",
        href: "/quiz/weak-topics",
        icon: Target,
        exactMatch: true,
      },
    ],
  },
  {
    title: "Career",
    items: [
      {
        name: "AI Career Assistant",
        href: "/career",
        icon: Briefcase,
        exactMatch: true,
      },
      {
        name: "Saved Career",
        href: "/career/saved",
        icon: BookmarkCheck,
        exactMatch: true,
      },
    ],
  },
  {
    title: "Progress",
    items: [
      {
        name: "Study Progress",
        href: "/progress",
        icon: TrendingUp,
        exactMatch: true,
      },
      {
        name: "Revision Assistant",
        href: "/revision",
        icon: RotateCcw,
        exactMatch: true,
      },
    ],
  },
];

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export default function Sidebar({ onCloseMobile, isMobileDrawer = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        if (isMounted && user?.email) {
          setUserEmail(user.email);
        }
      } catch (err) {
        console.error("Sidebar user fetch error:", err);
      }
    }
    void fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      if (onCloseMobile) onCloseMobile();
      router.replace("/login");
      router.refresh();
    }
  }

  function handleLinkClick(item: NavItem, e: React.MouseEvent) {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  }

  return (
    <aside
      className={`flex h-full w-64 flex-col justify-between border-r border-slate-200/90 bg-white text-slate-800 transition-colors duration-150 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${
        isMobileDrawer ? "shadow-2xl" : ""
      }`}
      aria-label="Application Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <Link
          href="/dashboard"
          onClick={() => onCloseMobile?.()}
          className="group flex items-center gap-3 transition"
          aria-label="PrepWise AI Dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-lg font-bold text-white shadow-md shadow-blue-200 transition-transform group-hover:scale-105 dark:shadow-none">
            P
          </div>
          <div className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              PrepWise <span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
            <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase dark:text-slate-500">
              Academic Partner
            </span>
          </div>
        </Link>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close navigation sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </h3>

            <div className="space-y-1 pt-1">
              {section.items.map((item) => {
                const isActive = item.exactMatch
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-400 opacity-70 cursor-not-allowed dark:text-slate-500"
                      title={`${item.name} (${item.badge || "Coming Soon"})`}
                      aria-disabled="true"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={17} className="shrink-0 text-slate-400 dark:text-slate-600" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleLinkClick(item, e)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-300 dark:bg-blue-600 dark:shadow-none"
                        : "text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-blue-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ${
                          isActive
                            ? "bg-blue-700/60 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Account / User & Theme Selector Footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-2.5 flex justify-center">
          <ThemeToggle variant="pill" className="w-full justify-center" />
        </div>

        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs dark:bg-blue-950 dark:text-blue-400">
            {userEmail ? userEmail.charAt(0).toUpperCase() : <User size={15} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
              {userEmail || "Student Account"}
            </p>
            <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">Logged In</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/70 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
          aria-label="Logout of application"
        >
          <LogOut size={14} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

