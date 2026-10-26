"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Trash2, X, Plus, RotateCw, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteStudyPlan, getSavedPlans } from "@/services/planner";

interface StudyPlan {
  id: string;
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
  generated_plan: string;
  created_at?: string;
}

type SortOption = "newest" | "exam_soonest" | "subject";

function formatDate(value: string): string {
  if (!value) return "Date not available";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysRemaining(value: string): number | null {
  if (!value) return null;
  const exam = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(exam.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86_400_000);
}

function getExamLabel(days: number | null): string {
  if (days === null) return "Exam date unavailable";
  if (days < 0) return `Exam passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Exam is today";
  if (days === 1) return "Exam tomorrow";
  return `${days} days remaining`;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState<"all" | "upcoming" | "passed">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [pendingDeletePlan, setPendingDeletePlan] = useState<StudyPlan | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await getSavedPlans();
      setPlans(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load saved plans:", error);
      setLoadError("We couldn’t load your saved plans. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const visiblePlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = plans.filter((plan) => {
      const matchesSearch =
        !query ||
        (plan.subject || "").toLowerCase().includes(query) ||
        (plan.topics || "").toLowerCase().includes(query) ||
        (plan.generated_plan || "").toLowerCase().includes(query);

      const days = getDaysRemaining(plan.exam_date);
      const matchesExam =
        examFilter === "all" ||
        (examFilter === "upcoming" && days !== null && days >= 0) ||
        (examFilter === "passed" && days !== null && days < 0);

      return matchesSearch && matchesExam;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "subject") return (a.subject || "").localeCompare(b.subject || "");
      if (sortBy === "exam_soonest") {
        const aDate = a.exam_date || "9999-12-31";
        const bDate = b.exam_date || "9999-12-31";
        return aDate.localeCompare(bDate);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [plans, search, examFilter, sortBy]);

  const totalUpcoming = plans.filter((plan) => {
    const days = getDaysRemaining(plan.exam_date);
    return days !== null && days >= 0;
  }).length;

  async function handleConfirmDelete() {
    if (!pendingDeletePlan) return;
    const plan = pendingDeletePlan;

    setDeletingPlanId(plan.id);
    setDeleteError("");
    setNotice("");
    try {
      await deleteStudyPlan(plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      if (expandedPlanId === plan.id) setExpandedPlanId(null);
      setNotice(`“${plan.subject}” study plan was deleted.`);
      setPendingDeletePlan(null);
    } catch (error) {
      console.error("Failed to delete study plan:", error);
      setDeleteError("Couldn’t delete that plan. Please try again.");
    } finally {
      setDeletingPlanId(null);
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 text-slate-900 dark:text-slate-100 transition-colors sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 dark:from-indigo-900 dark:via-blue-900 dark:to-slate-900 p-6 text-white shadow-lg sm:p-9 border border-transparent dark:border-slate-800">
            <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-36 h-64 w-64 rounded-full bg-cyan-300/10" />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Saved schedules</p>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Saved Study Plans
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
                  Keep your preparation organized. Revisit AI-generated schedules, check upcoming exams,
                  and find the right plan whenever you need it.
                </p>
              </div>
              <Link
                href="/planner"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-5 py-3 text-sm font-bold text-indigo-700 dark:text-indigo-400 shadow-sm transition hover:bg-blue-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <Plus size={18} />
                Create study plan
              </Link>
            </div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Saved plans</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? "—" : plans.length}</p>
                <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-3 py-2 text-xl" aria-hidden="true">▤</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Your stored preparation schedules</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Upcoming exams</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? "—" : totalUpcoming}</p>
                <span className="rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-3 py-2 text-xl" aria-hidden="true">◷</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Plans with today’s or a future exam date</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Daily study commitment</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {loading ? "—" : plans.reduce((sum, plan) => sum + (Number(plan.study_hours) || 0), 0)}
                  <span className="ml-1 text-base font-semibold text-slate-500 dark:text-slate-400">hrs*</span>
                </p>
                <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-xl" aria-hidden="true">◴</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Sum of daily hours entered across saved plans</p>
            </div>
          </section>

          {notice && (
            <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <span>{notice}</span>
              </div>
              <button onClick={() => setNotice("")} className="font-semibold text-emerald-700 hover:text-emerald-900">
                <X size={16} />
              </button>
            </div>
          )}
          {deleteError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{deleteError}</span>
            </div>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label htmlFor="plan-search" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Search your plans
                </label>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={17} />
                  </span>
                  <input
                    id="plan-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search subject, topics, or plan content..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:w-[420px]">
                <div>
                  <label htmlFor="exam-filter" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Exam status</label>
                  <select
                    id="exam-filter"
                    value={examFilter}
                    onChange={(event) => setExamFilter(event.target.value as typeof examFilter)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                  >
                    <option value="all">All exam dates</option>
                    <option value="upcoming">Upcoming / today</option>
                    <option value="passed">Past exams</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-sort" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Sort by</label>
                  <select
                    id="plan-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                  >
                    <option value="newest">Recently saved</option>
                    <option value="exam_soonest">Exam date: soonest</option>
                    <option value="subject">Subject: A–Z</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-sm text-slate-500">
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{visiblePlans.length}</span> of{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{plans.length}</span> plans
              </p>
              {(search || examFilter !== "all" || sortBy !== "newest") && (
                <button
                  onClick={() => { setSearch(""); setExamFilter("all"); setSortBy("newest"); }}
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  Clear filters
                </button>
              )}
              <button
                onClick={() => void loadPlans()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCw size={14} />
                <span>Refresh plans</span>
              </button>
            </div>
          </section>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 h-5 w-2/5 rounded bg-slate-200" />
                  <div className="mb-3 h-4 w-3/5 rounded bg-slate-100" />
                  <div className="mb-2 h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-4/5 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">!</div>
              <h2 className="text-lg font-bold text-slate-900">Unable to load plans</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{loadError}</p>
              <button onClick={() => void loadPlans()} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                Try again
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-14 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-3xl text-indigo-700 dark:text-indigo-400">▤</div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your study space is ready</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You haven’t saved a plan yet. Generate a personalized study schedule and it will appear here.
              </p>
              <Link href="/planner" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                Generate your first plan
              </Link>
            </div>
          ) : visiblePlans.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="text-3xl" aria-hidden="true">⌕</div>
              <h2 className="mt-3 text-lg font-bold text-slate-900">No matching plans</h2>
              <p className="mt-2 text-sm text-slate-500">Try another search term or clear your filters.</p>
              <button onClick={() => { setSearch(""); setExamFilter("all"); }} className="mt-4 text-sm font-semibold text-indigo-700 hover:underline">
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="grid items-start gap-5 md:grid-cols-2">
              {visiblePlans.map((plan) => {
                const daysRemaining = getDaysRemaining(plan.exam_date);
                const expanded = expandedPlanId === plan.id;
                const urgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
                const passed = daysRemaining !== null && daysRemaining < 0;
                return (
                  <article key={plan.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">Study plan</span>
                          <h2 className="mt-3 break-words text-xl font-extrabold text-slate-900 dark:text-white">{plan.subject || "Untitled subject"}</h2>
                          <p className="mt-1 text-sm text-slate-500">Saved {formatDate((plan.created_at || "").slice(0, 10))}</p>
                        </div>
                        <button
                          onClick={() => setPendingDeletePlan(plan)}
                          disabled={deletingPlanId === plan.id}
                          aria-label={`Delete ${plan.subject} study plan`}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-red-100 dark:border-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exam date</p>
                          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200 dark:text-slate-200">{formatDate(plan.exam_date)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Daily study</p>
                          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200 dark:text-slate-200">{Number(plan.study_hours) || 0} hours/day</p>
                        </div>
                      </div>

                      <div className={`mt-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                        urgent ? "bg-amber-50 text-amber-800" : passed ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800"
                      }`}>
                        <span aria-hidden="true" className="mr-2">{urgent ? "⚠" : passed ? "✓" : "◷"}</span>
                        {getExamLabel(daysRemaining)}
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Topics covered</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {plan.topics || "No topics were provided."}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedPlanId(expanded ? null : plan.id)}
                        className="mt-5 flex w-full items-center justify-between rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/40 px-4 py-3 text-left text-sm font-bold text-indigo-800 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-950/70"
                      >
                        <span>{expanded ? "Hide generated study plan" : "View generated study plan"}</span>
                        <span aria-hidden="true" className="text-lg">{expanded ? "−" : "+"}</span>
                      </button>

                      {expanded && (
                        <div
                          className="
                            mt-4 break-words text-sm leading-7 text-slate-700 dark:text-slate-300
                            [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-white
                            [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:border-b [&_h2]:border-slate-200 dark:[&_h2]:border-slate-800
                            [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white
                            [&_p]:my-3
                            [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-white
                            [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6
                            [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6
                            [&_li]:my-1
                            [&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800
                            [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 dark:[&_blockquote]:border-blue-700 [&_blockquote]:pl-4
                            [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse
                            [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-950 [&_th]:p-2 [&_th]:text-left
                            [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 [&_td]:p-2
                          "
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {plan.generated_plan}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            * Daily study commitment is the sum of the daily-hour values entered in your saved plans. It is not a record of actual study time.
          </p>
        </div>
      </div>

      {/* Polish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeletePlan)}
        title="Delete Saved Study Plan?"
        message={`Delete the saved study plan for "${pendingDeletePlan?.subject}"?\n\nThis action cannot be undone.`}
        confirmLabel="Delete Plan"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={Boolean(deletingPlanId)}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDeletePlan(null)}
      />
    </AppLayout>
  );
}
