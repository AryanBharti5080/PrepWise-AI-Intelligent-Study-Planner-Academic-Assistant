"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, CheckCircle2, Search, Trash2, X, Plus, RotateCw, ChevronDown } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { getCurrentUser } from "@/lib/auth";
import {
  getSavedCareerRecommendations,
  deleteCareerRecommendation,
} from "@/services/career";

interface CareerRecommendation {
  id: string;
  interest: string;
  recommendation: string;
  created_at?: string | null;
}

type SortOption = "newest" | "oldest" | "interest";

export default function SavedCareerPage() {
  const router = useRouter();

  const [recommendations, setRecommendations] = useState<
    CareerRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<CareerRecommendation | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getSavedCareerRecommendations();

      setRecommendations(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (err) {
      console.error("Failed to load career recommendations:", err);
      setError("Unable to load saved recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const user = await getCurrentUser();

        if (!active) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        await loadRecommendations();
      } catch (err) {
        console.error("Authentication check failed:", err);

        if (active) {
          router.replace("/login");
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [router, loadRecommendations]);

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = recommendations.filter((item) => {
      const interest = item.interest ?? "";
      const recommendation = item.recommendation ?? "";

      return (
        !query ||
        interest.toLowerCase().includes(query) ||
        recommendation.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "interest") {
        return (a.interest ?? "").localeCompare(b.interest ?? "");
      }

      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;
      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [recommendations, search, sortBy]);

  async function handleConfirmDelete() {
    if (!pendingDeleteItem) return;

    const item = pendingDeleteItem;
    setDeletingId(item.id);
    setError("");
    setNotice("");

    try {
      await deleteCareerRecommendation(item.id);

      setRecommendations((current) =>
        current.filter((recommendation) => recommendation.id !== item.id)
      );

      setNotice(`Saved career recommendation for "${item.interest}" was deleted.`);
      setPendingDeleteItem(null);
    } catch (err) {
      console.error("Failed to delete career recommendation:", err);
      setError("Unable to delete this recommendation. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(date?: string | null) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 text-slate-900 dark:text-white dark:text-slate-100 transition-colors sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900 p-6 text-white shadow-lg sm:p-9 border border-transparent dark:border-slate-800">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium">
                  <span>✦</span>
                  <span>Your career workspace</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Saved Career Recommendations
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Keep your career guidance organized, revisit recommended
                  skills and projects, and plan your next learning steps.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/career")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-5 py-3 font-semibold text-blue-700 dark:text-blue-400 shadow-sm transition hover:bg-blue-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <Plus size={18} />
                Explore Careers
              </button>
            </div>
          </section>

          {/* Summary cards */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total saved
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-xl border border-blue-100 dark:border-blue-900/50">
                  📚
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? "—" : recommendations.length}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Career recommendations
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Matching results
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-xl border border-violet-100 dark:border-violet-900/50">
                  🔎
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? "—" : filteredRecommendations.length}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Based on your current search
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Career planning
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-xl border border-emerald-100 dark:border-emerald-900/50">
                  🎯
                </span>
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                Keep progressing
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review skills and project ideas regularly.
              </p>
            </div>
          </section>

          {/* Search and sort */}
          <section className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label
                  htmlFor="career-search"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Search recommendations
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                  </span>

                  <input
                    id="career-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by interest, role, skill, or project..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>
              </div>

              <div className="w-full md:w-56">
                <label
                  htmlFor="career-sort"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Sort by
                </label>

                <select
                  id="career-sort"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="interest">Interest A–Z</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSortBy("newest");
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Reset filters
              </button>
            </div>
          </section>

          {/* Feedback messages */}
          {notice && (
            <div
              role="status"
              className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <p>{notice}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                <p className="flex-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadRecommendations()}
                disabled={loading}
                className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div
              aria-label="Loading recommendations"
              className="flex flex-col gap-5"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-2/5 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-1/4 rounded bg-slate-100" />
                  <div className="mt-6 h-3 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-5/6 rounded bg-slate-100" />
                  <div className="mt-6 h-10 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && recommendations.length === 0 && (
            <section className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-3xl border border-blue-100 dark:border-blue-900/50">
                🧭
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                Your career library is empty
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Generate a recommendation based on your interests and save it
                here. You can return whenever you need guidance on skills,
                certifications, or projects.
              </p>

              <button
                type="button"
                onClick={() => router.push("/career")}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Generate My First Recommendation
              </button>
            </section>
          )}

          {/* No search matches */}
          {!loading &&
            !error &&
            recommendations.length > 0 &&
            filteredRecommendations.length === 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                <div className="text-3xl">🔍</div>
                <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  No matching recommendations
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Try a different keyword or reset your filters.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 font-semibold text-blue-700 hover:underline"
                >
                  Clear search
                </button>
              </section>
            )}

          {/* Recommendation cards: VERTICALLY ARRANGED ONE BELOW ANOTHER */}
          {!loading && filteredRecommendations.length > 0 && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your recommendations
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {filteredRecommendations.length} of{" "}
                  {recommendations.length}
                </p>
              </div>

              {/* VERTICAL STACK */}
              <div className="flex flex-col gap-6">
                {filteredRecommendations.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md"
                  >
                    <div className="border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2.5 inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            Career interest
                          </div>

                          <h3 className="break-words text-xl font-bold text-slate-900 dark:text-white">
                            {item.interest || "Career recommendation"}
                          </h3>

                          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                            Saved on {formatDate(item.created_at)}
                          </p>
                        </div>

                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-slate-800 dark:to-indigo-950 text-xl border border-blue-100 dark:border-slate-700">
                          🎓
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 px-4 py-3 font-semibold text-blue-800 dark:text-blue-300 transition hover:bg-blue-50 dark:hover:bg-blue-950/70 focus:outline-none focus:ring-4 focus:ring-blue-100">
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true">📄</span>
                            View Full Recommendation
                          </span>

                          <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="mt-5 max-w-none break-words text-sm leading-7 text-slate-700 dark:text-slate-300 [&_a]:text-blue-700 dark:[&_a]:text-blue-400 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 dark:[&_blockquote]:border-blue-700 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-800 dark:[&_h3]:text-slate-200 [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-100 dark:[&_pre]:bg-slate-950 [&_pre]:p-4 [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-950 [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 text-slate-700 dark:text-slate-300">
                          {item.recommendation?.trim() ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.recommendation}
                            </ReactMarkdown>
                          ) : (
                            <p className="italic text-slate-500 dark:text-slate-400">
                              No recommendation content is available for this
                              saved item.
                            </p>
                          )}
                        </div>
                      </details>

                      <div className="mt-5 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteItem(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          {!loading && recommendations.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your saved recommendations are available whenever you need
                them.
              </p>

              <button
                type="button"
                onClick={() => void loadRecommendations()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
              >
                <RotateCw size={14} />
                <span>Refresh recommendations</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Polish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteItem)}
        title="Delete Saved Recommendation?"
        message={`Are you sure you want to delete the saved recommendation for "${pendingDeleteItem?.interest}"?\n\nThis action cannot be undone.`}
        confirmLabel="Delete Recommendation"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={Boolean(deletingId)}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </AppLayout>
  );
}
