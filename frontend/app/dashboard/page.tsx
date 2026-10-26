"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  Calendar,
  BrainCircuit,
  Award,
  Target,
  TrendingUp,
  Sparkles,
  Briefcase,
  Clock,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import {
  DashboardStats,
  getDashboardStats,
  RecentPlan,
  StudyInsight,
  UpcomingExam,
} from "@/services/dashboard";

const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#ea580c",
  "#db2777",
  "#4f46e5",
  "#0d9488",
];

function formatExamDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatActivityDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getDaysUntilExam(value: string) {
  const examDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(examDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((examDate.getTime() - today.getTime()) / 86400000);
}

function LoadingDashboard() {
  return (
    <AppLayout>
      <div
        className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
        aria-label="Loading dashboard"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-9 w-64 rounded-lg bg-gray-200 dark:bg-slate-800" />
          <div className="h-4 w-96 max-w-full rounded bg-gray-200 dark:bg-slate-800" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function EmptyChart({
  icon,
  title,
  description,
  actionText,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/50 px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-xs text-blue-600 dark:text-blue-400 mb-3 border border-slate-100 dark:border-slate-700">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

function InsightIcon({ type }: { type: StudyInsight["type"] }) {
  if (type === "exam") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
        <Calendar size={16} />
      </span>
    );
  }
  if (type === "subject") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
        <BookOpen size={16} />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
      <Sparkles size={16} />
    </span>
  );
}

function ExamCountdown({ exam }: { exam: UpcomingExam }) {
  const days = getDaysUntilExam(exam.exam_date);
  const isUrgent = days !== null && days <= 7;
  const isTomorrow = days === 1;
  const isToday = days === 0;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 transition ${
        isToday || isTomorrow
          ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30"
          : isUrgent
            ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/30"
            : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}
    >
      <div className="min-w-0 pr-3">
        <h4 className="truncate font-semibold text-gray-900 dark:text-slate-100">{exam.subject}</h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Target Exam: {formatExamDate(exam.exam_date)} · {exam.study_hours} hrs/day
        </p>
      </div>

      <div className="shrink-0 text-right">
        {isToday ? (
          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950/60 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-400">
            Today!
          </span>
        ) : isTomorrow ? (
          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950/60 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-400">
            Tomorrow
          </span>
        ) : days !== null && days > 0 ? (
          <div className="text-right">
            <span
              className={`text-lg font-extrabold ${
                isUrgent ? "text-amber-700 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {days}
            </span>
            <span className="block text-[10px] uppercase font-semibold text-gray-400 dark:text-slate-500">
              {days === 1 ? "day left" : "days left"}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-slate-500">Exam passed</span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
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

        const data = await getDashboardStats();

        if (!data) throw new Error("No dashboard data received.");

        setStats(data);
      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError(
          "We couldn't load your dashboard. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <LoadingDashboard />;

  if (!stats) {
    return (
      <AppLayout>
        <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
              !
            </div>
            <h1 className="mt-5 text-xl font-bold text-gray-900">
              Dashboard unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {error || "Unable to load your dashboard."}
            </p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const recentPlans = stats.recent_plans ?? [];
  const subjectCounts = stats.subject_counts ?? [];
  const subjectDistribution = stats.subject_distribution ?? [];
  const studyActivity = stats.study_activity ?? [];
  const upcomingExamPlans = stats.upcoming_exam_plans ?? [];
  const insights = stats.insights ?? [];

  // Enhanced Phase 2 data
  const totalQuizAttempts = stats.total_quiz_attempts ?? 0;
  const submittedQuizAttempts = stats.submitted_quiz_attempts ?? 0;
  const avgQuizScore = stats.average_quiz_score;
  const weakTopicsCount = stats.weak_topics_count ?? 0;
  const weakTopicsSummary = stats.weak_topics_summary ?? [];
  const quizScoreTrend = stats.quiz_score_trend ?? [];
  const subjectQuizPerformance = stats.subject_quiz_performance ?? [];
  const recentActivity = stats.recent_activity ?? [];

  const chartData = subjectCounts
    .map((item) => ({
      subject: item.name,
      plans: item.count,
      hours: item.planned_study_hours,
    }))
    .sort((a, b) => b.plans - a.plans);

  const totalPlans = stats.total_plans ?? 0;
interface SummaryCardItem {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  accent: string;
  badge?: string;
  link?: string;
}

  const upcomingExams = stats.upcoming_exams ?? 0;

  // 6 Top Summary Cards according to Phase 2 & 4 specifications
  const summaryCards: SummaryCardItem[] = [
    {
      label: "Saved Study Plans",
      value: totalPlans,
      description: "Total active study plans",
      icon: <BookOpen size={20} />,
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
      accent: "border-l-blue-500",
    },
    {
      label: "Upcoming Exams",
      value: upcomingExams,
      description: "Distinct upcoming exam dates",
      icon: <Calendar size={20} />,
      iconBg: "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400",
      accent: "border-l-orange-500",
    },
    {
      label: "Quiz Attempts",
      value: totalQuizAttempts,
      description: `${submittedQuizAttempts} completed assessment${submittedQuizAttempts === 1 ? "" : "s"}`,
      icon: <BrainCircuit size={20} />,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
      accent: "border-l-indigo-500",
    },
    {
      label: "Avg. Quiz Score",
      value: avgQuizScore !== null && avgQuizScore !== undefined ? `${avgQuizScore}%` : "No scores",
      description: submittedQuizAttempts > 0 ? "Across submitted quizzes" : "Take a quiz to score",
      icon: <Award size={20} />,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
      accent: "border-l-emerald-500",
    },
    {
      label: "Weak Topics",
      value: weakTopicsCount,
      description: "Topics requiring revision (<60%)",
      icon: <Target size={20} />,
      iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
      accent: "border-l-rose-500",
    },
    {
      label: "Study Progress",
      value: (stats.study_progress_summary?.total_topics ?? 0) > 0
        ? `${stats.study_progress_summary?.progress_percentage ?? 0}%`
        : "0%",
      description: (stats.study_progress_summary?.total_topics ?? 0) > 0
        ? `${stats.study_progress_summary?.completed_topics ?? 0} of ${stats.study_progress_summary?.total_topics ?? 0} topics completed`
        : "Track syllabus milestones",
      icon: <TrendingUp size={20} />,
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
      accent: "border-l-blue-500",
      link: "/progress",
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          
          {/* Header & Controls */}
          <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Sparkles size={14} />
                STUDENT ANALYTICS OVERVIEW
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Academic Performance Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Monitor your study schedules, test performance, and revision targets.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-xs transition hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <span className={refreshing ? "animate-spin" : ""}>
                <RotateCcw size={14} />
              </span>
              {refreshing ? "Refreshing..." : "Refresh Analytics"}
            </button>
          </section>

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2.5 text-red-800 dark:text-red-300 text-sm">
                <AlertTriangle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="shrink-0 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
          )}

          {/* Quick Actions Bar (4 Primary Academic Destinations) */}
          <section className="mb-8">
            <h2 className="sr-only">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/planner"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-base font-bold">AI Study Planner</h3>
                <p className="mt-1 text-xs text-blue-100">
                  Generate structured preparation timelines.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-100 group-hover:text-white">
                  <span>Create Plan</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/quiz"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="text-base font-bold">Start AI Quiz</h3>
                <p className="mt-1 text-xs text-indigo-100">
                  Test your knowledge with multiple-choice questions.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-100 group-hover:text-white">
                  <span>Take Quiz</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/quiz/weak-topics"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-amber-700 p-5 text-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Target size={20} />
                </div>
                <h3 className="text-base font-bold">Weak Topic Analysis</h3>
                <p className="mt-1 text-xs text-rose-100">
                  Pinpoint topics needing immediate revision.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-rose-100 group-hover:text-white">
                  <span>Review Topics</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/career"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 p-5 text-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-base font-bold">Career Assistant</h3>
                <p className="mt-1 text-xs text-purple-100">
                  Explore career paths, skills & starter projects.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-100 group-hover:text-white">
                  <span>Explore Roles</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </section>

          {/* Top Summary Cards (6 KPIs) */}
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Summary Statistics</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Aggregated metrics from your saved plans and submitted assessments.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {summaryCards.map((card) => {
                const content = (
                  <article
                    className={`h-full rounded-2xl border border-gray-200 dark:border-slate-800 border-l-4 ${card.accent} bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:shadow-sm`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 truncate">
                        {card.label}
                      </p>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
                      >
                        {card.icon}
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                      {card.badge && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {card.badge}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400 truncate" title={card.description}>
                      {card.description}
                    </p>
                  </article>
                );

                return card.link ? (
                  <Link key={card.label} href={card.link} className="block transition hover:-translate-y-0.5">
                    {content}
                  </Link>
                ) : (
                  <div key={card.label}>{content}</div>
                );
              })}
            </div>
          </section>

          {/* Section: Performance Charts (Row 1: Quiz Scores Over Time & Subject Mastery) */}
          <section className="mb-8 grid items-start gap-6 lg:grid-cols-2">
            
            {/* Chart 1: Quiz Performance Over Time */}
            <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Quiz Performance Over Time
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    Scores achieved across completed quizzes chronologically.
                  </p>
                </div>
                <Link
                  href="/quiz/history"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <span>History</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {quizScoreTrend.length === 0 ? (
                <EmptyChart
                  icon={<BrainCircuit size={24} />}
                  title="No quiz attempts recorded"
                  description="Complete an AI quiz to track your score progression over time."
                  actionText="Start a Quiz"
                  onAction={() => router.push("/quiz")}
                />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={quizScoreTrend}
                      margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke={isDark ? "#334155" : "#f1f5f9"}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-md text-xs space-y-1">
                                <p className="font-bold text-gray-900 dark:text-white">{data.subject}</p>
                                <p className="text-gray-500 dark:text-slate-400">Topic: {data.topic || "General"}</p>
                                <p className="text-gray-500 dark:text-slate-400">Difficulty: {data.difficulty}</p>
                                <div className="pt-1 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 font-semibold text-blue-600 dark:text-blue-400">
                                  <span>Score: {data.score}/{data.total_questions}</span>
                                  <span>{data.percentage}%</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        name="Score"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#4f46e5" }}
                        activeDot={{ r: 6, fill: "#312e81" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            {/* Chart 2: Subject-wise Quiz Performance */}
            <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Subject Quiz Accuracy
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    Average percentage score per subject across all assessments.
                  </p>
                </div>
                <Link
                  href="/quiz/weak-topics"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <span>Weak Topics</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {subjectQuizPerformance.length === 0 ? (
                <EmptyChart
                  icon={<Award size={24} />}
                  title="No subject data yet"
                  description="Quiz results categorized by subject will appear here."
                  actionText="Take a Quiz"
                  onAction={() => router.push("/quiz")}
                />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjectQuizPerformance}
                      margin={{ top: 12, right: 12, left: -16, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke={isDark ? "#334155" : "#f1f5f9"}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? "#1e293b" : "#f8fafc" }}
                        formatter={(val: unknown) => [`${Number(val)}%`, "Average Score"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                          backgroundColor: isDark ? "#0f172a" : "#ffffff",
                          color: isDark ? "#f8fafc" : "#0f172a",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="average_percentage"
                        name="Average Score"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      >
                        {subjectQuizPerformance.map((item, index) => (
                          <Cell
                            key={`${item.subject}-${index}`}
                            fill={
                              item.average_percentage >= 70
                                ? "#10b981"
                                : item.average_percentage >= 60
                                  ? "#3b82f6"
                                  : "#f43f5e"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

          </section>

          {/* Section: Planning Activity & Subject Distribution (Preserved) */}
          <section className="mb-8 grid items-start gap-6 lg:grid-cols-2">
            
            {/* Planning Activity */}
            <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Study Planning Activity
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Number of study plans generated per day over the last 7 days.
                </p>
              </div>

              {studyActivity.length === 0 ? (
                <EmptyChart
                  icon={<Calendar size={24} />}
                  title="No planning activity recorded"
                  description="Your recent study schedules will populate this timeline."
                  actionText="Create Study Plan"
                  onAction={() => router.push("/planner")}
                />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={studyActivity}
                      margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke={isDark ? "#334155" : "#f1f5f9"}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatActivityDate}
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={(label) => formatExamDate(String(label))}
                        formatter={(val) => [
                          `${val} ${Number(val) === 1 ? "plan" : "plans"}`,
                          "Created",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                          backgroundColor: isDark ? "#0f172a" : "#ffffff",
                          color: isDark ? "#f8fafc" : "#0f172a",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="plans_created"
                        name="Plans created"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#2563eb" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            {/* Subject Distribution */}
            <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Saved Plans by Subject
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Distribution of study strategies across academic subjects.
                </p>
              </div>

              {subjectDistribution.length === 0 ? (
                <EmptyChart
                  icon={<BookOpen size={24} />}
                  title="No subject distribution yet"
                  description="Save a study plan to see your subject breakdown."
                  actionText="Create Study Plan"
                  onAction={() => router.push("/planner")}
                />
              ) : (
                <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                  <div className="h-64 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjectDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={88}
                          paddingAngle={3}
                        >
                          {subjectDistribution.map((item, index) => (
                            <Cell
                              key={`${item.name}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} ${Number(value) === 1 ? "plan" : "plans"}`,
                            name,
                          ]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                            backgroundColor: isDark ? "#0f172a" : "#ffffff",
                            color: isDark ? "#f8fafc" : "#0f172a",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {subjectDistribution.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="truncate text-gray-700 dark:text-slate-300 font-medium">{item.name}</span>
                        </div>
                        <span className="shrink-0 font-bold text-gray-900 dark:text-white">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

          </section>

          {/* Section: Weak Topics & Recent Activity Grid */}
          <section className="mb-8 grid items-start gap-6 lg:grid-cols-2">
            
            {/* Weak Topic Highlights */}
            <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Weak Topics Requiring Practice
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    Topics scored below 60% accuracy in your quiz attempts.
                  </p>
                </div>
                <Link
                  href="/quiz/weak-topics"
                  className="shrink-0 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300"
                >
                  View All →
                </Link>
              </div>

              {weakTopicsSummary.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/50 p-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2.5">
                    <CheckCircle2 size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                    No weak topics identified
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 max-w-xs">
                    {submittedQuizAttempts === 0
                      ? "Complete a quiz to identify areas that need more revision."
                      : "All analyzed topics are performing at or above 60% accuracy! Keep up the momentum."}
                  </p>
                  {submittedQuizAttempts === 0 && (
                    <button
                      type="button"
                      onClick={() => router.push("/quiz")}
                      className="mt-3.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {weakTopicsSummary.map((topicItem, index) => (
                    <div
                      key={`${topicItem.subject}-${topicItem.topic}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <div className="min-w-0 pr-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          {topicItem.subject}
                        </span>
                        <h4 className="truncate font-semibold text-sm text-gray-900 dark:text-white">
                          {topicItem.topic}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          {topicItem.attempts} attempt{topicItem.attempts === 1 ? "" : "s"} evaluated
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center rounded-lg bg-rose-100 dark:bg-rose-950/60 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400">
                          {topicItem.average_percentage}%
                        </span>
                        <span className="block mt-1 text-[10px] font-semibold text-rose-500 dark:text-rose-400 uppercase">
                          Needs Review
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <Link
                      href="/quiz/weak-topics"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <span>Open full Weak Topic Analysis</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </article>

            {/* Combined Recent Activity */}
            <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Recent Activity Timeline
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    Your latest study schedules and quiz attempts combined.
                  </p>
                </div>
              </div>

              {recentActivity.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/50 p-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2.5">
                    <Clock size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">
                    No recent activity
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 max-w-xs">
                    Create your first study plan or take a quiz to see your preparation feed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <Link
                      key={`${activity.id}-${index}`}
                      href={activity.link}
                      className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-3 transition hover:border-gray-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
                            activity.type === "quiz"
                              ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {activity.type === "quiz" ? (
                            <BrainCircuit size={17} />
                          ) : (
                            <BookOpen size={17} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-900 dark:text-slate-100">
                            {activity.title}
                          </p>
                          <p className="truncate text-[11px] text-gray-500 dark:text-slate-400">
                            {activity.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            activity.type === "quiz"
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60"
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60"
                          }`}
                        >
                          {activity.badge}
                        </span>
                        {activity.timestamp && (
                          <span className="block mt-1 text-[10px] text-gray-400 dark:text-slate-500">
                            {formatActivityDate(activity.timestamp)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>

          </section>

          {/* Section: Upcoming Exams Milestones */}
          <section className="mb-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Upcoming Exam Deadlines
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Target exam milestones extracted from your active study plans.
                </p>
              </div>
              <Link
                href="/plans"
                className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                View Plans →
              </Link>
            </div>

            {upcomingExamPlans.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/50 p-5 text-center">
                <Calendar size={28} className="text-gray-400 dark:text-slate-500 mb-2" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                  No upcoming exam deadlines
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 max-w-xs">
                  Add target exam dates to your study plans to track remaining days.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/planner")}
                  className="mt-3 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Plan for an Exam
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingExamPlans.slice(0, 6).map((exam, index) => (
                  <ExamCountdown
                    key={`${exam.id}-${exam.exam_date}-${index}`}
                    exam={exam}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section: Smart Study Insights */}
          <section className="mb-8 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Personalized Academic Insights
              </h3>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                Automated observations based on your study schedules and quiz attempts.
              </p>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Create study plans and complete quizzes to receive smart academic tips.
              </p>
            ) : (
              <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {insights.map((insight, index) => (
                  <article
                    key={`${insight.title}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-white dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-2xs"
                  >
                    <InsightIcon type={insight.type} />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-gray-900 dark:text-white">
                        {insight.title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-slate-400">
                        {insight.message}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Section: Recent Study Plans */}
          <section className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Recent Saved Plans
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Quick access to your most recently generated study schedules.
                </p>
              </div>
              <Link
                href="/plans"
                className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                View All Plans →
              </Link>
            </div>

            {recentPlans.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/50 p-5 text-center">
                <BookOpen size={28} className="text-gray-400 dark:text-slate-500 mb-2" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                  No saved plans yet
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 max-w-xs">
                  Generate your first study schedule with the AI Study Planner.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/planner")}
                  className="mt-3 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Create First Plan
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentPlans.slice(0, 6).map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 transition hover:bg-white dark:hover:bg-slate-900 hover:shadow-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Study Schedule
                      </span>
                      <h4 className="mt-1 font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {plan.subject}
                      </h4>
                      {plan.topics && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                          {plan.topics}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>{plan.study_hours} hrs/day</span>
                      <Link
                        href="/plans"
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Open Plan →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
