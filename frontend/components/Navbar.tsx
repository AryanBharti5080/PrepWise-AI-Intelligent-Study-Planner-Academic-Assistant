"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b bg-white px-8 py-4 shadow-sm">
      <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
        PrepWise AI
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/planner">Planner</Link>
        <Link href="/plans">Saved Plans</Link>
        <Link href="/career">Career</Link>

        <button
          onClick={handleLogout}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}