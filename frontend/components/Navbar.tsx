"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "▦" },
  { name: "Planner", href: "/planner", icon: "✦" },
  { name: "Saved Plans", href: "/plans", icon: "▤" },
  { name: "Career", href: "/career", icon: "↗" },
  { name: "AI Quiz", href: "/quiz", icon: "✓" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <nav className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-bold text-white shadow-md shadow-blue-200 transition-transform group-hover:scale-105">
            P
          </div>

          <div className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight text-slate-900">
              PrepWise
              <span className="text-blue-600"> AI</span>
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Your intelligent study partner
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 sm:px-4 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                }`}
              >
                <span className="text-base" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 sm:px-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 8.25V5.625A2.625 2.625 0 0013.125 3h-7.5A2.625 2.625 0 003 5.625v12.75A2.625 2.625 0 005.625 21h7.5a2.625 2.625 0 002.625-2.625V15.75M9 12h12m0 0l-3.75-3.75M21 12l-3.75 3.75"
            />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
    </header>
  );
}