"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  CircleDashed,
  Calendar,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
  Check,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import {
  getOverallProgress,
  getPlanProgress,
  updateTopicStatus,
  OverallProgressResponse,
  PlanProgressDetail,
  TopicProgressItem,
  TopicStatus,
} from "@/services/progress";

type StatusFilter = "All" | TopicStatus;

interface GlobalTopicItem extends TopicProgressItem {
  plan_id: string;
  subject: string;
}

export default function ProgressPage() {
  const router = useRouter();

  const [overallData, setOverallData] = useState<OverallProgressResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<PlanProgressDetail | null>(null);

  const [loadingOverall, setLoadingOverall] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [planFilter, setPlanFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Load all plans progress
  const loadOverallProgress = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingOverall(true);
    }
    setError("");

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const res = await getOverallProgress();
      setOverallData(res);

      // Auto-select first plan if none selected or current is invalid
      if (res?.plans && res.plans.length > 0) {
        setSelectedPlanId((prev) => {
          if (prev && res.plans.some((p) => p.plan_id === prev)) {
            return prev;
          }
          return res.plans[0].plan_id;
        });
      } else {
        setSelectedPlanId(null);
        setSelectedPlanDetail(null);
      }
    } catch (err: any) {
      console.error("Progress loading failed:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to load study progress. Please try again.";
      setError(typeof detail === "string" ? detail : "Unable to load study progress. Please try again.");
    } finally {
      setLoadingOverall(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void loadOverallProgress();
  }, [loadOverallProgress]);

  // Load details for selected plan
  const fetchDetail = useCallback(async (planId: string) => {
    setLoadingDetail(true);
    setActionError("");
    try {
      const detail = await getPlanProgress(planId);
      setSelectedPlanDetail(detail);

      // Keep overallData.plans cards in sync with detail
      setOverallData((prev) => {
        if (!prev) return prev;
        const updatedPlans = prev.plans.map((p) => {
          if (p.plan_id === planId) {
            return {
              ...p,
              completed_topics: detail.completed_topics,
              in_progress_topics: detail.in_progress_topics,
              not_started_topics: detail.not_started_topics,
              progress_percentage: detail.progress_percentage,
              topics: detail.topics,
            };
          }
          return p;
        });
        const totalComp = updatedPlans.reduce((sum, p) => sum + p.completed_topics, 0);
        const totalInProg = updatedPlans.reduce((sum, p) => sum + p.in_progress_topics, 0);
        const totalNotStart = updatedPlans.reduce((sum, p) => sum + p.not_started_topics, 0);
        const totalAll = updatedPlans.reduce((sum, p) => sum + p.total_topics, 0);
        const avgPct = totalAll > 0 ? Math.round((totalComp / totalAll) * 1000) / 10 : 0.0;
        return {
          ...prev,
          completed_topics: totalComp,
          in_progress_topics: totalInProg,
          not_started_topics: totalNotStart,
          average_progress_percentage: avgPct,
          plans: updatedPlans,
        };
      });
    } catch (err) {
      console.error("Plan progress detail failed:", err);
      setActionError("Unable to load topic details for the selected plan.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      void fetchDetail(selectedPlanId);
    }
  }, [selectedPlanId, fetchDetail]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError("");
    setActionError("");
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const res = await getOverallProgress();
      setOverallData(res);

      const targetPlanId =
        selectedPlanId && res?.plans.some((p) => p.plan_id === selectedPlanId)
          ? selectedPlanId
          : res?.plans && res.plans.length > 0
          ? res.plans[0].plan_id
          : null;

      if (targetPlanId) {
        setSelectedPlanId(targetPlanId);
        await fetchDetail(targetPlanId);
      } else {
        setSelectedPlanId(null);
        setSelectedPlanDetail(null);
      }
    } catch (err: any) {
      console.error("Refresh failed:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to refresh study progress. Please try again.";
      setError(typeof detail === "string" ? detail : "Unable to refresh study progress.");
    } finally {
      setRefreshing(false);
    }
  }, [selectedPlanId, fetchDetail, router]);

  // Handle topic status transition for any plan
  async function handleStatusChange(planId: string, topicName: string, newStatus: TopicStatus) {
    if (!overallData) return;

    const previousOverall = { ...overallData };
    const previousDetail = selectedPlanDetail ? { ...selectedPlanDetail } : null;

    const cleanTarget = topicName.trim().toLowerCase();

    // 1. Optimistically update overallData
    setOverallData((prev) => {
      if (!prev) return prev;

      let oldStatus: TopicStatus = "Not Started";
      const targetPlan = prev.plans.find((p) => p.plan_id === planId);
      if (targetPlan && targetPlan.topics) {
        const found = targetPlan.topics.find((t) => t.topic.trim().toLowerCase() === cleanTarget);
        if (found) {
          oldStatus = found.status;
        }
      }

      if (oldStatus === newStatus) return prev;

      const compDelta = (newStatus === "Completed" ? 1 : 0) - (oldStatus === "Completed" ? 1 : 0);
      const inProgDelta = (newStatus === "In Progress" ? 1 : 0) - (oldStatus === "In Progress" ? 1 : 0);
      const notStartDelta = (newStatus === "Not Started" ? 1 : 0) - (oldStatus === "Not Started" ? 1 : 0);

      const updatedPlans = prev.plans.map((p) => {
        if (p.plan_id === planId) {
          const updatedTopics = (p.topics || []).map((t) => {
            if (t.topic.trim().toLowerCase() === cleanTarget) {
              return {
                ...t,
                status: newStatus,
                completed_at: newStatus === "Completed" ? new Date().toISOString() : null,
              };
            }
            return t;
          });
          const comp = Math.max(p.completed_topics + compDelta, 0);
          const inProg = Math.max(p.in_progress_topics + inProgDelta, 0);
          const notStart = Math.max(p.not_started_topics + notStartDelta, 0);
          const pct = p.total_topics > 0 ? Math.round((comp / p.total_topics) * 1000) / 10 : 0.0;
          return {
            ...p,
            completed_topics: comp,
            in_progress_topics: inProg,
            not_started_topics: notStart,
            progress_percentage: pct,
            topics: updatedTopics,
          };
        }
        return p;
      });

      const totalComp = updatedPlans.reduce((sum, p) => sum + p.completed_topics, 0);
      const totalInProg = updatedPlans.reduce((sum, p) => sum + p.in_progress_topics, 0);
      const totalNotStart = updatedPlans.reduce((sum, p) => sum + p.not_started_topics, 0);
      const totalAll = updatedPlans.reduce((sum, p) => sum + p.total_topics, 0);
      const avgPct = totalAll > 0 ? Math.round((totalComp / totalAll) * 1000) / 10 : 0.0;

      return {
        ...prev,
        completed_topics: totalComp,
        in_progress_topics: totalInProg,
        not_started_topics: totalNotStart,
        average_progress_percentage: avgPct,
        plans: updatedPlans,
      };
    });

    // 2. Also update selectedPlanDetail if this plan is selected
    if (selectedPlanDetail && selectedPlanDetail.plan_id === planId) {
      setSelectedPlanDetail((prev) => {
        if (!prev) return prev;
        const updatedTopics = prev.topics.map((t) => {
          if (t.topic.trim().toLowerCase() === cleanTarget) {
            return {
              ...t,
              status: newStatus,
              completed_at: newStatus === "Completed" ? new Date().toISOString() : null,
            };
          }
          return t;
        });
        const comp = updatedTopics.filter((t) => (t.status || "").trim().toLowerCase() === "completed").length;
        const inProg = updatedTopics.filter((t) => (t.status || "").trim().toLowerCase() === "in progress").length;
        const notStart = updatedTopics.filter((t) => (t.status || "").trim().toLowerCase() === "not started").length;
        const pct = prev.total_topics > 0 ? Math.round((comp / prev.total_topics) * 1000) / 10 : 0.0;
        return {
          ...prev,
          completed_topics: comp,
          in_progress_topics: inProg,
          not_started_topics: notStart,
          progress_percentage: pct,
          topics: updatedTopics,
        };
      });
    }

    try {
      await updateTopicStatus(planId, topicName, newStatus);
    } catch (err) {
      console.error("Failed to update topic status:", err);
      setActionError(`Failed to update "${topicName}". Reverting changes.`);
      // Rollback
      setOverallData(previousOverall);
      if (previousDetail) {
        setSelectedPlanDetail(previousDetail);
      }
    }
  }

  // Aggregate all topics across all saved study plans
  const allGlobalTopics: GlobalTopicItem[] = useMemo(() => {
    if (!overallData?.plans) return [];
    const items: GlobalTopicItem[] = [];
    for (const p of overallData.plans) {
      if (p.topics && p.topics.length > 0) {
        for (const t of p.topics) {
          items.push({
            ...t,
            plan_id: p.plan_id,
            subject: p.subject,
          });
        }
      }
    }
    return items;
  }, [overallData]);

  // Global filtered topics across all plans
  const filteredTopics = useMemo(() => {
    return allGlobalTopics.filter((t) => {
      if (planFilter !== "All" && t.plan_id !== planFilter) {
        return false;
      }
      if (statusFilter !== "All" && (t.status || "").trim().toLowerCase() !== statusFilter.trim().toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTopic = t.topic.toLowerCase().includes(q);
        const matchSubject = t.subject.toLowerCase().includes(q);
        if (!matchTopic && !matchSubject) {
          return false;
        }
      }
      return true;
    });
  }, [allGlobalTopics, statusFilter, planFilter, searchQuery]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

          {/* Header Section */}
          <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <TrendingUp size={14} />
                STUDY PROGRESS TRACKER
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Syllabus & Topic Progress
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Monitor your syllabus completion, mark topic milestones, and stay exam-ready.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing || loadingOverall}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-xs transition hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <span className={refreshing ? "animate-spin" : ""}>
                <RotateCcw size={14} />
              </span>
              {refreshing ? "Refreshing..." : "Refresh Progress"}
            </button>
          </section>

          {/* Error Notice */}
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
                onClick={() => void loadOverallProgress(true)}
                className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-800 dark:text-amber-300"
            >
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError("")}
                className="font-bold underline hover:no-underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingOverall ? (
            <div className="space-y-6">
              <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800" />
                ))}
              </div>
              <div className="h-96 animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800" />
            </div>
          ) : !overallData || overallData.plans.length === 0 ? (
            /* Empty State: No Saved Study Plans */
            <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-900/50">
                <BookOpen size={28} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                No Saved Study Plans Found
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                To start tracking topic-by-topic progress, create and save a study plan using the AI Study Planner.
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
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                >
                  <span>Go to Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* 1. Global Progress Summary Cards (Aggregated across ALL saved study plans) */}
              <section>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Overall Progress Card */}
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-slate-900 dark:to-blue-950/40 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Overall Progress
                      </span>
                      <TrendingUp size={16} className="text-blue-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-blue-900 dark:text-blue-300">
                        {overallData.average_progress_percentage}%
                      </span>
                      <span className="text-xs text-blue-700">completed</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-200/60 dark:bg-blue-950">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${overallData.average_progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Completed Topics Card */}
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Completed
                      </span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-300">
                        {overallData.completed_topics}
                      </span>
                      <span className="text-xs text-emerald-700">
                        of {overallData.total_topics} topics
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-600">
                      Mastered across {overallData.total_plans} plan{overallData.total_plans !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* In Progress Topics Card */}
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        In Progress
                      </span>
                      <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-amber-900 dark:text-amber-300">
                        {overallData.in_progress_topics}
                      </span>
                      <span className="text-xs text-amber-700">topics</span>
                    </div>
                    <p className="mt-2 text-[11px] text-amber-600">
                      Currently learning
                    </p>
                  </div>

                  {/* Remaining / Not Started Topics Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Not Started
                      </span>
                      <CircleDashed size={16} className="text-slate-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                        {overallData.not_started_topics}
                      </span>
                      <span className="text-xs text-slate-500">remaining</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Upcoming on syllabus
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Global Topic Milestones Checklist (Positioned ABOVE Select Study Plan) */}
              <section className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 dark:border-slate-800 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Syllabus Topic Milestones
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Global checklist across all saved study plans. Click any status badge to update.
                    </p>
                  </div>

                  {/* Filter & Search controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Status filter pills */}
                    <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950 p-1 text-xs">
                      {(["All", "Not Started", "In Progress", "Completed"] as StatusFilter[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            statusFilter === st
                              ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs"
                              : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Plan Filter dropdown */}
                    {overallData.plans.length > 1 && (
                      <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="All">All Plans ({overallData.plans.length})</option>
                        {overallData.plans.map((p) => (
                          <option key={p.plan_id} value={p.plan_id}>
                            {p.subject}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Search input */}
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search topic or subject..."
                        className="w-full sm:w-48 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Topics List */}
                {filteredTopics.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">
                    <p>
                      {allGlobalTopics.length === 0
                        ? "No syllabus topics found in your saved study plans."
                        : "No topics match the selected filter."}
                    </p>
                    {(statusFilter !== "All" || planFilter !== "All" || searchQuery.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("All");
                          setPlanFilter("All");
                          setSearchQuery("");
                        }}
                        className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear filters to show all topics
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800 pt-2">
                    {filteredTopics.map((topicItem, index) => {
                      const isCompleted = (topicItem.status || "").trim().toLowerCase() === "completed";
                      const isInProgress = (topicItem.status || "").trim().toLowerCase() === "in progress";
                      const isNotStarted = !isCompleted && !isInProgress;

                      return (
                        <div
                          key={`${topicItem.plan_id}-${topicItem.topic}`}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2"
                        >
                          {/* Topic Details with Subject Tag */}
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-500 dark:text-slate-400">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                  className={`text-sm font-semibold truncate ${
                                    isCompleted ? "line-through text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-slate-100"
                                  }`}
                                >
                                  {topicItem.topic}
                                </h3>
                                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                  {topicItem.subject}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                <span>Status: {topicItem.status}</span>
                                {topicItem.completed_at && (
                                  <>
                                    <span>·</span>
                                    <span>
                                      Completed {new Date(topicItem.completed_at).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 3-State Status Selector Pills */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => void handleStatusChange(topicItem.plan_id, topicItem.topic, "Not Started")}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                isNotStarted
                                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs border border-gray-200 dark:border-slate-700"
                                  : "text-gray-400 hover:text-gray-700"
                              }`}
                            >
                              <CircleDashed size={12} />
                              <span>Not Started</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleStatusChange(topicItem.plan_id, topicItem.topic, "In Progress")}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                isInProgress
                                  ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold shadow-xs border border-amber-200 dark:border-amber-900/60"
                                  : "text-gray-400 hover:text-amber-700"
                              }`}
                            >
                              <Clock size={12} />
                              <span>In Progress</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleStatusChange(topicItem.plan_id, topicItem.topic, "Completed")}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                isCompleted
                                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs border border-emerald-200 dark:border-emerald-900/60"
                                  : "text-gray-400 hover:text-emerald-700"
                              }`}
                            >
                              <Check size={12} />
                              <span>Completed</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 3. Study Plan Selector Carousel / Pills (Positioned BELOW Global KPIs & Topics) */}
              <section className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Select Study Plan
                    </h2>
                    <p className="text-xs text-gray-500">
                      Choose a study plan to view its specific breakdown and details below.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    {overallData.plans.length} plan{overallData.plans.length !== 1 ? "s" : ""} saved
                  </span>
                </div>

                {/* Plan Selector Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {overallData.plans.map((p) => {
                    const isSelected = p.plan_id === selectedPlanId;
                    return (
                      <button
                        key={p.plan_id}
                        type="button"
                        onClick={() => setSelectedPlanId(p.plan_id)}
                        className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs ring-2 ring-blue-600/20"
                            : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                              {p.subject}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={12} />
                                {p.days_until_exam !== null && p.days_until_exam !== undefined
                                  ? p.days_until_exam === 0
                                    ? "Exam today"
                                    : p.days_until_exam > 0
                                    ? `Exam in ${p.days_until_exam}d`
                                    : "Exam passed"
                                  : "No exam date"}
                              </span>
                              <span>·</span>
                              <span>{p.total_topics} topics</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-blue-600">
                              {p.progress_percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Mini progress bar */}
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${p.progress_percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 4. Selected Plan Details & Actions */}
              {selectedPlanDetail && (
                <section className="rounded-2xl border border-blue-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          Selected Plan
                        </span>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {selectedPlanDetail.subject}
                        </h2>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedPlanDetail.completed_topics} of {selectedPlanDetail.total_topics} topics completed ({selectedPlanDetail.progress_percentage}%)
                      </p>
                    </div>

                    <Link
                      href="/plans"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <span>Open in Saved Plans</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  {/* Selected Plan Topics Breakdown */}
                  {loadingDetail ? (
                    <div className="space-y-3 py-6">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-14 animate-pulse rounded-xl bg-gray-100" />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800 pt-2">
                      {selectedPlanDetail.topics.map((t, idx) => {
                        const isCompleted = (t.status || "").trim().toLowerCase() === "completed";
                        const isInProgress = (t.status || "").trim().toLowerCase() === "in progress";
                        const isNotStarted = !isCompleted && !isInProgress;

                        return (
                          <div
                            key={t.topic}
                            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between rounded-xl px-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h3
                                  className={`text-sm font-medium truncate ${
                                    isCompleted ? "line-through text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-slate-100"
                                  }`}
                                >
                                  {t.topic}
                                </h3>
                                {t.completed_at && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Completed {new Date(t.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => void handleStatusChange(selectedPlanDetail.plan_id, t.topic, "Not Started")}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  isNotStarted
                                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs border border-gray-200 dark:border-slate-700"
                                    : "text-gray-400 hover:text-gray-700"
                                }`}
                              >
                                <CircleDashed size={12} />
                                <span>Not Started</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleStatusChange(selectedPlanDetail.plan_id, t.topic, "In Progress")}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  isInProgress
                                    ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold shadow-xs border border-amber-200 dark:border-amber-900/60"
                                    : "text-gray-400 hover:text-amber-700"
                                }`}
                              >
                                <Clock size={12} />
                                <span>In Progress</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleStatusChange(selectedPlanDetail.plan_id, t.topic, "Completed")}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  isCompleted
                                    ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs border border-emerald-200 dark:border-emerald-900/60"
                                    : "text-gray-400 hover:text-emerald-700"
                                }`}
                              >
                                <Check size={12} />
                                <span>Completed</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Plan Footer Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-gray-400" />
                      <span>View full schedule, milestones, and revision advice in Saved Plans.</span>
                    </div>
                    <Link
                      href="/plans"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <span>Go to Saved Plans</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </section>
              )}

            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}

