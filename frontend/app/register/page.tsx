"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { AlertCircle, CheckCircle2, Lock, Mail, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();

      if (user) {
        router.replace("/dashboard");
      }
    }

    checkUser();
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message || "Failed to create account. Please try again.");
      return;
    }

    setSuccessMessage("Account created successfully! Redirecting to login...");
    setTimeout(() => {
      router.push("/login");
    }, 1200);
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
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Register Section */}
      <section className="relative flex min-h-[calc(100vh-81px)] items-center justify-center overflow-hidden px-6 py-12">
        <div className="relative w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs backdrop-blur-xs dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
              Get Started
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Create your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">
                PrepWise
              </span>{" "}
              account
            </h1>

            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400">
              Start building smarter study plans with AI.
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleRegister}
            className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md transition duration-300 hover:shadow-2xl hover:shadow-slate-200/70 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-none dark:hover:border-slate-700 sm:p-8"
          >
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-800 dark:text-red-200"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <p className="leading-5">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 p-4 text-sm text-emerald-800 dark:text-emerald-200"
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <p className="leading-5">{successMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Full Name
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <User size={17} />
                  </span>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>
              </div>

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
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                    minLength={6}
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
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 dark:text-blue-400 transition hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
              >
                Log in
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
