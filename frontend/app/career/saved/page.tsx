"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Navbar from "@/components/Navbar";
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

  async function handleDelete(item: CareerRecommendation) {
    const confirmed = window.confirm(
      `Delete the saved recommendation for "${item.interest}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    setNotice("");

    try {
      await deleteCareerRecommendation(item.id);

      setRecommendations((current) =>
        current.filter((recommendation) => recommendation.id !== item.id)
      );

      setNotice("Career recommendation deleted successfully.");
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
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white shadow-lg sm:p-9">
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
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <span aria-hidden="true">＋</span>
                Explore Careers
              </button>
            </div>
          </section>

          {/* Summary cards */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Total saved
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  📚
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "—" : recommendations.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Career recommendations
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Matching results
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl">
                  🔎
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "—" : filteredRecommendations.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Based on your current search
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Career planning
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  🎯
                </span>
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900">
                Keep progressing
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Review skills and project ideas regularly.
              </p>
            </div>
          </section>

          {/* Search and sort */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label
                  htmlFor="career-search"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Search recommendations
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    ⌕
                  </span>

                  <input
                    id="career-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by interest, role, skill, or project..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="w-full md:w-56">
                <label
                  htmlFor="career-sort"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Sort by
                </label>

                <select
                  id="career-sort"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset filters
              </button>
            </div>
          </section>

          {/* Feedback messages */}
          {notice && (
            <div
              role="status"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              <p>✓ {notice}</p>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss success message"
                className="font-bold"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <p>{error}</p>
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
              className="grid gap-5 md:grid-cols-2"
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
                  <div className="mt-6 h-3 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-5/6 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-4/6 rounded bg-slate-100" />
                  <div className="mt-6 h-10 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && recommendations.length === 0 && (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                🧭
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
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
                <h2 className="mt-3 text-lg font-bold text-slate-900">
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

          {/* Recommendation cards */}
          {!loading && filteredRecommendations.length > 0 && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Your recommendations
                </h2>
                <p className="text-sm text-slate-500">
                  Showing {filteredRecommendations.length} of{" "}
                  {recommendations.length}
                </p>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-2">
                {filteredRecommendations.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="border-b border-slate-100 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            Career interest
                          </div>

                          <h3 className="break-words text-xl font-bold text-slate-900">
                            {item.interest || "Career recommendation"}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Saved on {formatDate(item.created_at)}
                          </p>
                        </div>

                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 text-xl">
                          🎓
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 font-semibold text-blue-800 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100">
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true">📄</span>
                            View Full Recommendation
                          </span>

                          <span className="transition-transform group-open:rotate-180">
                            ▼
                          </span>
                        </summary>

                        <div className="mt-5 max-w-none break-words text-sm leading-7 text-slate-700 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-100 [&_pre]:p-4 [&_strong]:font-bold [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6">
                          {item.recommendation?.trim() ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.recommendation}
                            </ReactMarkdown>
                          ) : (
                            <p className="italic text-slate-500">
                              No recommendation content is available for this
                              saved item.
                            </p>
                          )}
                        </div>
                      </details>

                      <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === item.id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <span aria-hidden="true">🗑</span>
                              Delete
                            </>
                          )}
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
              <p className="text-sm text-slate-500">
                Your saved recommendations are available whenever you need
                them.
              </p>

              <button
                type="button"
                onClick={() => void loadRecommendations()}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
              >
                ↻ Refresh recommendations
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}