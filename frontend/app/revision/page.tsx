"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  RotateCcw,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Filter,
  X,
  Target,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import {
  getRevisionRecommendations,
  toggleRevisionTask,
  getAiRevisionAdvice,
  RevisionResponse,
  RevisionTaskItem,
} from "@/services/revision";

type PriorityFilter = "All" | "High" | "Medium" | "Low";
type StatusFilter = "All" | "Pending" | "Completed";

export default function RevisionPage() {
  const router = useRouter();

  const [data, setData] = useState<RevisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Advice Modal State
  const [selectedTaskForAdvice, setSelectedTaskForAdvice] =
    useState<RevisionTaskItem | null>(null);
  const [adviceContent, setAdviceContent] = useState<string>("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceSource, setAdviceSource] = useState<"groq" | "fallback">("groq");
  const [adviceError, setAdviceError] = useState("");

  const loadRecommendations = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        const res = await getRevisionRecommendations();
        if (res && Array.isArray(res.tasks)) {
          setData(res);
        } else {
          setData(res || null);
        }
      } catch (err: any) {
        console.error("Revision loading failed:", err);
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load revision recommendations. Please try again.";
        setError(typeof detail === "string" ? detail : "Unable to load revision recommendations. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  // Handle task completion toggle
  async function handleToggle(task: RevisionTaskItem) {
    if (!data) return;
    const newStatus = !task.is_completed;

    // Optimistic local state update
    setData((prev) => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map((t) =>
        t.id === task.id ? { ...t, is_completed: newStatus } : t
      );
      const newCompletedCount = updatedTasks.filter((t) => t.is_completed).length;
      const newPct =
        prev.total_tasks > 0
          ? Math.round((newCompletedCount / prev.total_tasks) * 1000) / 10
          : 0;
      return {
        ...prev,
        completed_count: newCompletedCount,
        completion_percentage: newPct,
        tasks: updatedTasks,
      };
    });

    try {
      await toggleRevisionTask(task.subject, task.topic, newStatus);
    } catch (err) {
      console.error("Failed to persist toggle:", err);
      // Revert if API fails
      setData((prev) => {
        if (!prev) return prev;
        const revertedTasks = prev.tasks.map((t) =>
          t.id === task.id ? { ...t, is_completed: !newStatus } : t
        );
        const revertedCount = revertedTasks.filter((t) => t.is_completed).length;
        return {
          ...prev,
          completed_count: revertedCount,
          completion_percentage:
            prev.total_tasks > 0
              ? Math.round((revertedCount / prev.total_tasks) * 1000) / 10
              : 0,
          tasks: revertedTasks,
        };
      });
    }
  }

  // Open AI Advice modal
  async function handleOpenAdvice(task: RevisionTaskItem) {
    setSelectedTaskForAdvice(task);
    setAdviceContent("");
    setAdviceError("");
    setAdviceLoading(true);

    try {
      const res = await getAiRevisionAdvice({
        subject: task.subject,
        topic: task.topic,
        priority: task.priority,
        exam_date: task.exam_date,
      });
      setAdviceContent(res.advice);
      setAdviceSource(res.source);
    } catch (err) {
      console.error("Failed to load AI advice:", err);
      setAdviceError("Unable to generate AI study breakdown right now.");
    } finally {
      setAdviceLoading(false);
    }
  }

  // Filtered task list
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];
    return data.tasks.filter((t) => {
      if (priorityFilter !== "All" && t.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter === "Pending" && t.is_completed) {
        return false;
      }
      if (statusFilter === "Completed" && !t.is_completed) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSubj = t.subject.toLowerCase().includes(query);
        const matchesTopic = t.topic.toLowerCase().includes(query);
        if (!matchesSubj && !matchesTopic) return false;
      }
      return true;
    });
  }, [data, priorityFilter, statusFilter, searchQuery]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

          {/* Header Section */}
          <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles size={14} />
                PERSONALIZED REVISION ASSISTANT
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Smart Revision Plan
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Target weak areas, prepare for upcoming exams, and check off completed revision sessions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRecommendations(true)}
              disabled={refreshing || loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-xs transition hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <span className={refreshing ? "animate-spin" : ""}>
                <RotateCcw size={14} />
              </span>
              {refreshing ? "Re-analyzing..." : "Refresh Recommendations"}
            </button>
          </section>

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 sm:flex-row sm:items-center sm:justify-between text-sm text-red-800 dark:text-red-300"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadRecommendations(true)}
                className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-6">
              <div className="h-28 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800" />
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800" />
                ))}
              </div>
            </div>
          ) : !data || data.total_tasks === 0 ? (
            /* Empty State: No Study Plans and No Quizzes */
            <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-900/50">
                <Target size={28} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                No Revision Tasks Available Yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                The Revision Assistant automatically creates targeted revision tasks based on your saved study plans, upcoming exam dates, and quiz scores.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/planner"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <BookOpen size={16} />
                  <span>Create Study Plan</span>
                </Link>
                <Link
                  href="/quiz"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                >
                  <BrainCircuit size={16} />
                  <span>Take a Diagnostic Quiz</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Revision Progress & Priority Breakdown Banner */}
              <section className="mb-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Checklist Completion
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        {data.completed_count} of {data.total_tasks}
                      </span>
                      <span className="text-sm font-semibold text-indigo-600">
                        ({data.completion_percentage}% completed)
                      </span>
                    </div>
                  </div>

                  {/* Priority Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 text-rose-700 dark:text-rose-400">
                      <span className="h-2 w-2 rounded-full bg-rose-600" />
                      {data.high_priority_count} High Priority
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 text-amber-700 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                      {data.medium_priority_count} Medium Priority
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-blue-700 dark:text-blue-400">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      {data.low_priority_count} Low Priority
                    </span>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${data.completion_percentage}%` }}
                    role="progressbar"
                    aria-valuenow={data.completion_percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </section>

              {/* Filtering Controls */}
              <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Priority Filter */}
                <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-semibold text-gray-400 px-2.5">
                    <Filter size={13} className="inline mr-1" />
                    Priority:
                  </span>
                  {(["All", "High", "Medium", "Low"] as PriorityFilter[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityFilter(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        priorityFilter === p
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-semibold text-gray-400 px-2.5">
                    Status:
                  </span>
                  {(["All", "Pending", "Completed"] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        statusFilter === s
                          ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xs"
                          : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              {/* Tasks Grid */}
              {filteredTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                  No revision tasks match the selected filters.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredTasks.map((task) => {
                    const isHigh = task.priority === "High";
                    const isMed = task.priority === "Medium";

                    return (
                      <article
                        key={task.id}
                        className={`relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:shadow-md ${
                          task.is_completed
                            ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 opacity-80"
                            : isHigh
                              ? "border-rose-200 dark:border-rose-900/50 border-l-4 border-l-rose-500 dark:bg-slate-900"
                              : isMed
                                ? "border-amber-200 dark:border-amber-900/50 border-l-4 border-l-amber-500 dark:bg-slate-900"
                                : "border-gray-200 dark:border-slate-800 border-l-4 border-l-blue-400 dark:bg-slate-900"
                        }`}
                      >
                        <div>
                          {/* Card Top Row: Checkbox, Subject, Priority Pill */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => void handleToggle(task)}
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                                  task.is_completed
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-gray-300 hover:border-indigo-600 text-transparent"
                                }`}
                                aria-label={
                                  task.is_completed
                                    ? "Mark task as pending"
                                    : "Mark task as completed"
                                }
                              >
                                {task.is_completed ? (
                                  <CheckCircle2 size={16} />
                                ) : (
                                  <Circle size={14} className="text-gray-300" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  {task.subject}
                                </span>
                                <h3
                                  className={`text-base font-bold text-gray-900 dark:text-white truncate ${
                                    task.is_completed
                                      ? "line-through text-gray-400"
                                      : ""
                                  }`}
                                >
                                  {task.topic}
                                </h3>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                isHigh
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : isMed
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                          </div>

                          {/* Reason Box */}
                          <div className="mt-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                              <Target size={13} className="text-indigo-600" />
                              <span>Why revise this?</span>
                            </div>
                            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                              {task.reason}
                            </p>
                          </div>

                          {/* Suggested Activity */}
                          <div className="mt-3 text-xs leading-5 text-gray-600 dark:text-slate-400">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">
                              Suggested Activity:{" "}
                            </span>
                            {task.suggested_activity}
                          </div>
                        </div>

                        {/* Card Bottom Meta & Actions */}
                        <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
                          {/* Duration & Exam Meta */}
                          <div className="flex flex-wrap items-center gap-3 text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} />
                              {task.suggested_duration}
                            </span>

                            {task.days_until_exam !== null &&
                              task.days_until_exam !== undefined && (
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    task.days_until_exam <= 5
                                      ? "text-rose-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  <Calendar size={13} />
                                  {task.days_until_exam === 0
                                    ? "Exam today"
                                    : task.days_until_exam === 1
                                      ? "Exam tomorrow"
                                      : `Exam in ${task.days_until_exam} days`}
                                </span>
                              )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => void handleOpenAdvice(task)}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1.5 font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                            >
                              <Sparkles size={12} />
                              <span>AI Guide</span>
                            </button>

                            <Link
                              href={task.action_link}
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-900 dark:bg-slate-800 px-3 py-1.5 font-semibold text-white hover:bg-gray-800 dark:hover:bg-slate-700 transition"
                            >
                              <span>Start Practice</span>
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* AI Study Advice Modal */}
          {selectedTaskForAdvice && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
              role="dialog"
              aria-modal="true"
            >
              <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      <Sparkles size={14} />
                      AI REVISION BLUEPRINT
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {selectedTaskForAdvice.subject} — {selectedTaskForAdvice.topic}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTaskForAdvice(null)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-5 pr-1">
                  {adviceLoading ? (
                    <div className="space-y-4 py-8">
                      <div className="flex items-center justify-center gap-3 text-sm text-indigo-600 font-semibold">
                        <span className="animate-spin">
                          <RotateCcw size={16} />
                        </span>
                        <span>Synthesizing high-impact revision breakdown...</span>
                      </div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 mx-auto" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 mx-auto" />
                    </div>
                  ) : adviceError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                      {adviceError}
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-slate max-w-none text-xs leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-base font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-bold text-indigo-900 mt-3 mb-1.5">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 mt-2.5 mb-1">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="my-1.5 text-xs leading-relaxed text-slate-700">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-2 ml-4 list-disc space-y-1 text-xs text-slate-700">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-2 ml-4 list-decimal space-y-1 text-xs text-slate-700">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="my-2 border-l-3 border-indigo-500 bg-indigo-50/60 pl-3 py-1.5 text-xs italic text-slate-700 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
                              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-slate-100 font-semibold text-slate-800">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {children}
                            </tbody>
                          ),
                          th: ({ children }) => (
                            <th className="px-3 py-2 font-semibold text-slate-800">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 text-slate-600">
                              {children}
                            </td>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
                          ),
                          code: ({ inline, children }: any) => {
                            return inline ? (
                              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-indigo-700">
                                {children}
                              </code>
                            ) : (
                              <pre className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-100">
                                <code>{children}</code>
                              </pre>
                            );
                          },
                        }}
                      >
                        {adviceContent}
                      </ReactMarkdown>

                      {adviceSource === "fallback" && (
                        <p className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
                          * Note: Fallback academic template loaded.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
                  <span className="text-gray-400">
                    Priority: {selectedTaskForAdvice.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={selectedTaskForAdvice.action_link}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition"
                    >
                      <span>Start Practice</span>
                      <ArrowRight size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForAdvice(null)}
                      className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      Close Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}

