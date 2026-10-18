"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { getQuizHistory, deleteQuizHistory } from "@/services/quiz";

interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  total_questions: number;
  score: number | null;
  percentage: number | null;
  submitted: boolean;
  created_at: string;
}

export default function QuizHistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getQuizHistory();
      setAttempts(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load quiz history. Please try again.");
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

        await loadHistory();
      } catch {
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router, loadHistory]);

  async function handleDelete(quizId: string) {
    if (!window.confirm("Delete this quiz attempt?")) return;

    try {
      await deleteQuizHistory(quizId);
      setAttempts((previous) =>
        previous.filter((attempt) => attempt.id !== quizId)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete this quiz attempt.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              PrepWise AI
            </p>
            <h1 className="mt-2 text-3xl font-bold">Quiz History</h1>
            <p className="mt-2 text-slate-600">
              Review your previous assessments and track your performance.
            </p>
          </div>

          <button
            onClick={() => router.push("/quiz")}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Take a Quiz
          </button>
        </div>

        {loading && (
          <p className="py-12 text-center text-slate-600">
            Loading quiz history...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <p>{error}</p>
            <button
              onClick={loadHistory}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && attempts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">No quizzes yet</h2>
            <p className="mt-2 text-slate-600">
              Generate your first quiz to start tracking your progress.
            </p>
            <button
              onClick={() => router.push("/quiz")}
              className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Generate Your First Quiz
            </button>
          </div>
        )}

        {!loading && attempts.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {attempts.map((attempt) => (
              <article
                key={attempt.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{attempt.subject}</h2>
                    <p className="mt-1 text-slate-600">{attempt.topic}</p>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                    {attempt.difficulty}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Score</p>
                    <p className="mt-1 text-xl font-bold">
                      {attempt.submitted
                        ? `${attempt.score}/${attempt.total_questions}`
                        : `—/${attempt.total_questions}`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Percentage</p>
                    <p className="mt-1 text-xl font-bold">
                      {attempt.submitted
                        ? `${attempt.percentage}%`
                        : "Not submitted"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  {new Date(attempt.created_at).toLocaleString()}
                </p>

                <button
                  onClick={() => handleDelete(attempt.id)}
                  className="mt-5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete Attempt
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}