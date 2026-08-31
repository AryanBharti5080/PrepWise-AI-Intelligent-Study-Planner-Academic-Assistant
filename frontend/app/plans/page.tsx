"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  deleteStudyPlan,
  getSavedPlans,
} from "@/services/planner";

interface StudyPlan {
  id: string;
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
  generated_plan: string;
  created_at: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPlans() {
    try {
      const data = await getSavedPlans();
      setPlans(data.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load saved plans.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(planId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this study plan?"
    );

    if (!confirmed) return;

    try {
      await deleteStudyPlan(planId);

      setPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== planId)
      );
    } catch (error) {
      console.error(error);
      alert("Failed to delete study plan.");
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-6xl p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Saved Study Plans
          </h1>

          <p className="mt-2 text-gray-600">
            View and manage your generated study plans.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p>Loading saved plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold">
              No saved plans yet
            </h2>

            <p className="mt-2 text-gray-500">
              Generate a study plan and save it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-blue-600">
                      {plan.subject}
                    </h2>

                    <p className="mb-4 text-sm text-gray-600">
                      Exam: {plan.exam_date}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>

                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    <strong>Study Hours:</strong>{" "}
                    {plan.study_hours} hours/day
                  </p>

                  <p className="mt-1">
                    <strong>Topics:</strong>{" "}
                    {plan.topics}
                  </p>
                </div>

                <details>
                  <summary className="cursor-pointer font-medium text-blue-600">
                    View Study Plan
                  </summary>

                  <div className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm leading-7 text-gray-700">
                    {plan.generated_plan}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}