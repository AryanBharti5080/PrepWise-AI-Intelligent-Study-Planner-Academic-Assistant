"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  CartesianGrid,
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
} from "@/services/dashboard";

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
    try {
      const user = await getCurrentUser();

      if (!user) {
       router.replace("/login");
       return;
      }
 
      const data = await getDashboardStats();

      console.log("Dashboard API data:", data);

      setStats(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load dashboard data.");
    } finally {
     setLoading(false);
    }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[80vh] items-center justify-center">
          <p>Loading dashboard...</p>
        </main>
      </>
    );
  }

if (!stats) {
  return (
    <>
      <Navbar />

      <main className="flex min-h-[80vh] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">
            {error || "Unable to load dashboard."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    </>
  );
}

  const chartData = stats.subject_counts.map((item) => ({
  subject: item.name,
  plans: item.count,
}));

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl p-8">
        <section className="mb-8">
  <h1 className="text-4xl font-bold">
    Welcome back 👋
  </h1>

  <p className="mt-2 text-gray-600">
    Plan your studies, track your exams, and prepare smarter with PrepWise AI.
  </p>
</section>
 
   <section className="mb-8 grid gap-4 sm:grid-cols-2">
  <button
    onClick={() => router.push("/planner")}
    className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md"
  >
    <h2 className="font-semibold text-blue-600">
      Create Study Plan
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Generate a personalized AI study schedule.
    </p>
  </button>

  <button
    onClick={() => router.push("/career")}
    className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md"
  >
    <h2 className="font-semibold text-blue-600">
      Explore Career Options
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Get AI-powered career recommendations.
    </p>
  </button>
</section>


        {/* Statistics */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-bold text-blue-600">
              Total Plans
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {stats.total_plans}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-bold text-blue-600">
              Subjects Studied
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {stats.subjects_studied}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-bold text-blue-600">
              Upcoming Exams
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {stats.upcoming_exams}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* Chart */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-bold text-blue-600">
              Study Plans by Subject
            </h2>

            {chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-gray-500">
                No study plans yet.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="subject"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis allowDecimals={false} />

                    <Tooltip />

                    <Bar dataKey="plans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Plans */}
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-600">
                Recent Study Plans
              </h2>

              <button
                onClick={() => router.push("/plans")}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            {stats.recent_plans.length === 0 ? (
              <p className="text-gray-500">
                No study plans yet.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recent_plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {plan.subject}
                      </h3>

                      <span className="text-sm text-gray-500">
                        {plan.study_hours}h/day
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Exam: {plan.exam_date}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      </main>
    </>
  );
}