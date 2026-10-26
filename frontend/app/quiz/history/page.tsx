"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Trash2, X, Plus } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { getCurrentUser } from "@/lib/auth";
import { getQuizHistory, deleteQuizHistory, type QuizHistoryItem } from "@/services/quiz";

type QuizAttempt = QuizHistoryItem;

export default function QuizHistoryPage() {
  const router = useRouter();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteAttempt, setPendingDeleteAttempt] = useState<QuizAttempt | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getQuizHistory();
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
        ? (response as any).data
        : [];
      setAttempts(list);
    } catch (err) {
      console.error(err);
      setError("Unable to load quiz history.");
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

  async function handleConfirmDelete() {
    if (!pendingDeleteAttempt) return;

    const target = pendingDeleteAttempt;
    setDeletingId(target.id);
    setError("");
    setNotice("");

    try {
      await deleteQuizHistory(target.id);
      setAttempts((previous) =>
        previous.filter((attempt) => attempt.id !== target.id)
      );
      setNotice(`Quiz attempt for "${target.subject} - ${target.topic}" was deleted.`);
      setPendingDeleteAttempt(null);
    } catch (err) {
      console.error(err);
      setError("Unable to delete this quiz attempt.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                PrepWise AI
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Quiz History
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Review your previous assessments and track your performance.
              </p>
            </div>

            <button
              onClick={() => router.push("/quiz")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Take a Quiz
            </button>
          </div>

          {notice && (
            <div
              role="status"
              className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <p>{notice}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotice("")}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p>{error}</p>
                <button
                  onClick={loadHistory}
                  className="mt-2 text-xs font-bold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center text-slate-500">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
              <p className="text-sm">Loading quiz history...</p>
            </div>
          )}

          {!loading && !error && attempts.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-3xl border border-indigo-100 dark:border-indigo-900/50">
                🎯
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">No quizzes yet</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Generate your first quiz to test your mastery and start tracking your performance.
              </p>
              <button
                onClick={() => router.push("/quiz")}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
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
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white break-words">{attempt.subject}</h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 break-words">{attempt.topic}</p>
                    </div>

                    <span className="shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                      {attempt.difficulty}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500">Score</p>
                      <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                        {attempt.submitted
                          ? `${attempt.score ?? 0}/${attempt.total_questions}`
                          : `—/${attempt.total_questions}`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500">Percentage</p>
                      <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                        {attempt.submitted
                          ? `${attempt.percentage ?? 0}%`
                          : "Not submitted"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    {new Date(attempt.created_at).toLocaleString()}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => setPendingDeleteAttempt(attempt)}
                      disabled={deletingId === attempt.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Polish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteAttempt)}
        title="Delete Quiz Attempt?"
        message={`Delete this quiz attempt for "${pendingDeleteAttempt?.subject} - ${pendingDeleteAttempt?.topic}"?\n\nThis action cannot be undone.`}
        confirmLabel="Delete Attempt"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={Boolean(deletingId)}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDeleteAttempt(null)}
      />
    </AppLayout>
  );
}
