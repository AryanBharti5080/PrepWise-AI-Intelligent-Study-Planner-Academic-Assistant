
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { AlertCircle, Lock, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();

      if (user) {
        router.replace("/dashboard");
      }
    }

    checkUser();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(
        error.message || "Invalid email or password. Please try again."
      );
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      {/* Dynamic Animated Educational Background */}
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 px-6 py-4.5 backdrop-blur-md md:px-12">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400"
        >
          PrepWise AI
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="icon" />
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 dark:bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Login Section */}
      <section className="relative flex min-h-[calc(100vh-81px)] items-center justify-center overflow-hidden px-6 py-12">
        <div className="relative w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs backdrop-blur-xs dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
              Welcome Back
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Login to{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">
                PrepWise AI
              </span>
            </h1>

            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400">
              Continue your personalized study journey.
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleLogin}
            className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md transition duration-300 hover:shadow-2xl hover:shadow-slate-200/70 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-none dark:hover:border-slate-700 sm:p-8"
          >
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-800 dark:text-red-200"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                />
                <p className="leading-5">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Mail size={17} />
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Lock size={17} />
                  </span>

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-md shadow-blue-500/25 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/35 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none dark:focus:ring-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing In...
                </span>
              ) : (
                "Login"
              )}
            </button>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-blue-600 dark:text-blue-400 transition hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
            PrepWise AI · Intelligent Study Planning and Academic Assistant
          </p>
        </div>
      </section>
    </main>
  );
}

