"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { getWeakTopics } from "@/services/quiz";

interface TopicPerformance {
  subject: string;
  topic: string;
  attempts: number;
  average_percentage: number;
  needs_practice: boolean;
}

interface WeakTopicResponse {
  topics_analyzed: number;
  weak_topics: TopicPerformance[];
  topic_performance: TopicPerformance[];
}

export default function WeakTopicsPage() {
  const router = useRouter();
  const [data, setData] = useState<WeakTopicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getWeakTopics();
      setData(response);
    } catch (err) {
      console.error(err);
      setError("Unable to load topic analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        await loadAnalysis();
      } catch {
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router, loadAnalysis]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              PrepWise AI
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Weak Topic Analysis
            </h1>
            <p className="mt-2 text-slate-600">
              Identify topics that need more practice using your submitted quiz results.
            </p>
          </div>

          <button
            onClick={() => router.push("/quiz")}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Practice Quiz
          </button>

        <button
           onClick={() => router.push("/quiz/history")}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
       >
           Quiz History
        </button>


        </div>

        {loading && (
          <p className="py-12 text-center text-slate-600">
            Analyzing your performance...
          </p>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            <p>{error}</p>
            <button onClick={loadAnalysis} className="mt-2 font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Topics Assessed</p>
                <p className="mt-2 text-3xl font-bold">
                  {data.topics_analyzed}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Topics Needing Practice</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {data.weak_topics.length}
                </p>
              </div>
            </div>

            {data.topic_performance.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="text-xl font-bold">No results to analyze yet</h2>
                <p className="mt-2 text-slate-600">
                  Submit a quiz to see your topic performance.
                </p>
                <button
                  onClick={() => router.push("/quiz")}
                  className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                >
                  Take Your First Quiz
                </button>
              </div>
            ) : (
              <section className="mt-8">
                <h2 className="mb-4 text-2xl font-bold">Topic Performance</h2>

                <div className="space-y-4">
                  {data.topic_performance.map((item) => (
                    <article
                      key={`${item.subject}-${item.topic}`}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-bold">{item.topic}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.subject} · {item.attempts} submitted attempt(s)
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                            item.needs_practice
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.needs_practice
                            ? "Needs Practice"
                            : "Good Progress"}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between text-sm">
                        <span className="text-slate-600">Average score</span>
                        <span className="font-bold">
                          {item.average_percentage}%
                        </span>
                      </div>

                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            item.needs_practice
                              ? "bg-red-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, item.average_percentage))}%`,
                          }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}