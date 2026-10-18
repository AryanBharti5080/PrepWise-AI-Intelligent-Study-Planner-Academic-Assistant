"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
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
    <>
      <Navbar />
      <main
        className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
        aria-label="Loading dashboard"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-9 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-96 max-w-full rounded bg-gray-200" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      </main>
    </>
  );
}

function EmptyChart({
  icon,
  title,
  description,
  onCreatePlan,
}: {
  icon: string;
  title: string;
  description: string;
  onCreatePlan: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
        {description}
      </p>
      <button
        type="button"
        onClick={onCreatePlan}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Create Study Plan
      </button>
    </div>
  );
}

function InsightIcon({ type }: { type: StudyInsight["type"] }) {
  const icon =
    type === "subject" ? "🎯" : type === "exam" ? "📅" : "💡";

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
      {icon}
    </span>
  );
}

function ExamCountdown({ exam }: { exam: UpcomingExam }) {
  const days = exam.days_remaining;

  const badgeClass =
    days === 0
      ? "bg-red-50 text-red-700"
      : days <= 3
        ? "bg-orange-50 text-orange-700"
        : "bg-blue-50 text-blue-700";

  const countdown =
    days === 0
      ? "Today"
      : days === 1
        ? "Tomorrow"
        : `${days} days left`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
      <div className="min-w-0">
        <p className="break-words font-semibold text-gray-900">
          {exam.subject || "Untitled subject"}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {formatExamDate(exam.exam_date)}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {exam.study_hours} planned hours/day
        </p>
      </div>
      <span
        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${badgeClass}`}
      >
        {countdown}
      </span>
    </div>
  );
}

function RecentPlanCard({
  plan,
  onViewPlans,
}: {
  plan: RecentPlan;
  onViewPlans: () => void;
}) {
  const daysRemaining = getDaysUntilExam(plan.exam_date);

  return (
    <div className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-gray-900">
            {plan.subject || "Untitled subject"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Exam: {plan.exam_date ? formatExamDate(plan.exam_date) : "Not set"}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {plan.study_hours}h/day
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <div className="text-xs">
          {daysRemaining === null ? (
            <span className="text-gray-500">Exam date unavailable</span>
          ) : daysRemaining < 0 ? (
            <span className="font-medium text-gray-500">Exam date has passed</span>
          ) : daysRemaining === 0 ? (
            <span className="font-semibold text-red-600">Exam is today</span>
          ) : daysRemaining <= 7 ? (
            <span className="font-semibold text-orange-600">
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
            </span>
          ) : (
            <span className="text-gray-500">{daysRemaining} days remaining</span>
          )}
        </div>
        <button
          type="button"
          onClick={onViewPlans}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          View saved plans →
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

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
          "We couldn't load your dashboard. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <LoadingDashboard />;

  if (!stats) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
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
        </main>
      </>
    );
  }

  const recentPlans = stats.recent_plans ?? [];
  const subjectCounts = stats.subject_counts ?? [];
  const subjectDistribution = stats.subject_distribution ?? [];
  const studyActivity = stats.study_activity ?? [];
  const upcomingExamPlans = stats.upcoming_exam_plans ?? [];
  const insights = stats.insights ?? [];

  const chartData = subjectCounts
    .map((item) => ({
      subject: item.name,
      plans: Number(item.count) || 0,
      hours: Number(item.planned_study_hours) || 0,
    }))
    .sort((a, b) => b.plans - a.plans);

  const totalSubjects = stats.subjects_studied ?? 0;
  const totalPlans = stats.total_plans ?? 0;
  const upcomingExams = stats.upcoming_exams ?? 0;
  const totalPlannedHours = Number(stats.total_planned_study_hours) || 0;

  const cards = [
    {
      label: "Total Study Plans",
      value: totalPlans,
      description: "Your saved preparation plans",
      icon: "📚",
      iconBackground: "bg-blue-50",
      iconColor: "text-blue-700",
      accent: "border-l-blue-500",
    },
    {
      label: "Subjects Studied",
      value: totalSubjects,
      description: "Subjects across your plans",
      icon: "🎯",
      iconBackground: "bg-purple-50",
      iconColor: "text-purple-700",
      accent: "border-l-purple-500",
    },
    {
      label: "Upcoming Exams",
      value: upcomingExams,
      description: "Distinct upcoming exam dates",
      icon: "📅",
      iconBackground: "bg-orange-50",
      iconColor: "text-orange-700",
      accent: "border-l-orange-500",
    },
    {
      label: "Planned Study Hours",
      value: Number.isInteger(totalPlannedHours)
        ? totalPlannedHours
        : totalPlannedHours.toFixed(1),
      description: "Sum of daily hours across saved plans",
      icon: "⏱️",
      iconBackground: "bg-emerald-50",
      iconColor: "text-emerald-700",
      accent: "border-l-emerald-500",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <span aria-hidden="true">✦</span>
                PREPWISE AI WORKSPACE
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Your Learning Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Track study planning activity, monitor upcoming exams, and
                organize your academic preparation in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className={refreshing ? "animate-spin" : ""}
              >
                ↻
              </span>
              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          </section>

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm leading-6 text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Retry
              </button>
            </div>
          )}

          {/* Quick actions */}
          <section className="mb-8 grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/planner")}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition group-hover:scale-110" />
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  ✨
                </div>
                <h2 className="text-xl font-bold text-white">Create a Study Plan</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100">
                  Generate a personalized AI study schedule for your next
                  examination.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Open Study Planner <span aria-hidden="true">→</span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/career")}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-200"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition group-hover:scale-110" />
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  🚀
                </div>
                <h2 className="text-xl font-bold text-white">Explore Career Options</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-purple-100">
                  Discover suitable career paths, required skills,
                  certifications, and beginner projects.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Open Career Assistant <span aria-hidden="true">→</span>
                </span>
              </div>
            </button>
          </section>

          {/* Summary cards */}
          <section className="mb-8">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">Academic Overview</h2>
              <p className="mt-1 text-sm text-gray-500">
                A snapshot of your saved study plans and exam schedule.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl border border-gray-200 border-l-4 ${card.accent} bg-white p-6 shadow-sm transition hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.label}
                      </p>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
                        {card.value}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {card.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBackground} text-2xl ${card.iconColor}`}
                    >
                      {card.icon}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Charts row 1 */}
          <section className="mb-6 grid items-start gap-6 lg:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Study Planning Activity
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Number of study plans created per day over the last 7 days.
                </p>
              </div>

              {studyActivity.length === 0 ? (
                <EmptyChart
                  icon="📈"
                  title="No activity data yet"
                  description="Your recent planning activity will appear here."
                  onCreatePlan={() => router.push("/planner")}
                />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={studyActivity}
                      margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatActivityDate}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={(label) =>
                          formatExamDate(String(label))
                        }
                        formatter={(value) => [
                          `${value} ${Number(value) === 1 ? "plan" : "plans"}`,
                          "Created",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="plans_created"
                        name="Plans created"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#2563eb" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Subject Distribution</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Share of your saved study plans by subject.
                </p>
              </div>

              {subjectDistribution.length === 0 ? (
                <EmptyChart
                  icon="🥧"
                  title="No subject distribution yet"
                  description="Save a study plan to see how your plans are distributed."
                  onCreatePlan={() => router.push("/planner")}
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
                          innerRadius={58}
                          outerRadius={94}
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
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {subjectDistribution.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="truncate text-gray-700">{item.name}</span>
                        </div>
                        <span className="shrink-0 font-semibold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </section>

          {/* Charts row 2 */}
          <section className="mb-6 grid items-start gap-6 lg:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Study Plans by Subject
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Compare saved plans and planned daily hours for each subject.
                </p>
              </div>

              {chartData.length === 0 ? (
                <EmptyChart
                  icon="📊"
                  title="No subject data yet"
                  description="Save your first study plan to see subject statistics here."
                  onCreatePlan={() => router.push("/planner")}
                />
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: -18, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#eff6ff" }}
                        formatter={(value) => [value, "Saved plans"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        }}
                      />
                      <Bar
                        dataKey="plans"
                        name="Study plans"
                        radius={[7, 7, 0, 0]}
                        maxBarSize={54}
                      >
                        {chartData.map((item, index) => (
                          <Cell
                            key={`${item.subject}-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="mt-3 text-xs leading-5 text-gray-500">
                Planned hours are daily-hour inputs from saved plans, not measured study time.
              </p>
            </article>

            <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Upcoming Exams</h2>
                <p className="mt-1 text-sm text-gray-500">
                  The next exam dates linked to your saved study plans.
                </p>
              </div>

              {upcomingExamPlans.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center">
                  <span className="text-4xl" aria-hidden="true">🗓️</span>
                  <h3 className="mt-4 font-semibold text-gray-800">
                    No upcoming exams
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Upcoming exam dates from your saved study plans will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/planner")}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Plan for an Exam
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingExamPlans.slice(0, 5).map((exam, index) => (
                    <ExamCountdown
                      key={`${exam.id}-${exam.exam_date}-${index}`}
                      exam={exam}
                    />
                  ))}
                  {upcomingExamPlans.length > 5 && (
                    <p className="pt-1 text-xs text-gray-500">
                      Showing the next 5 of {upcomingExamPlans.length} upcoming exam plans.
                    </p>
                  )}
                </div>
              )}
            </article>
          </section>

          {/* Insights */}
          <section className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">Smart Study Insights</h2>
              <p className="mt-1 text-sm text-gray-600">
                Observations based on the study plans saved in your account.
              </p>
            </div>

            {insights.length === 0 ? (
              <p className="text-sm text-gray-600">
                Create study plans to receive personalized insights here.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {insights.map((insight, index) => (
                  <article
                    key={`${insight.title}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-white bg-white/80 p-4 shadow-sm"
                  >
                    <InsightIcon type={insight.type} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {insight.message}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Recent plans */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Study Plans</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review your latest saved study schedules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/plans")}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                View All →
              </button>
            </div>

            {recentPlans.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center">
                <span className="text-4xl" aria-hidden="true">📖</span>
                <h3 className="mt-4 font-semibold text-gray-800">
                  Your study journey starts here
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                  Your recent saved plans will appear here when you create them.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/planner")}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Your First Plan
                </button>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {recentPlans.slice(0, 5).map((plan) => (
                  <RecentPlanCard
                    key={plan.id}
                    plan={plan}
                    onViewPlans={() => router.push("/plans")}
                  />
                ))}
              </div>
            )}

            {recentPlans.length > 5 && (
              <button
                type="button"
                onClick={() => router.push("/plans")}
                className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                View all saved plans
              </button>
            )}
          </section>

          {/* Study tip */}
          <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                💡
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  Study smarter, not just longer
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Break difficult topics into smaller sessions, revise regularly,
                  and reserve time for practice before your exams. Dashboard
                  metrics reflect saved plans, not actual time spent studying.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
