"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import { generateStudyPlan,saveStudyPlan, } from "@/services/planner";
import { supabase } from "@/lib/supabase";


export default function PlannerPage() {
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);


  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  setPlan("");
  setLoading(true);

try {
  const data = await generateStudyPlan({
    subject,
    topics,
    exam_date: examDate,
    study_hours: Number(studyHours),
  });

  setPlan(data.plan);
} catch (error) {
  console.error(error);
  alert("Unable to generate study plan.");
} finally {
  setLoading(false);
}
 
}

async function handleSavePlan() {
  if (!plan) return;

  setSaving(true);

  try {
    await saveStudyPlan({
      subject,
      topics,
      exam_date: examDate,
      study_hours: Number(studyHours),
      generated_plan: plan,
    });

    alert("Study plan saved successfully!");
  } catch (error) {
    console.error(error);
    alert("Failed to save study plan.");
  } finally {
    setSaving(false);
  }
}

return (
    <>
      <Navbar />

      <main className="mx-auto p-8">
        <h1 className="mb-8 text-4xl font-bold text-white">
          AI Study Planner
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl bg-white p-8 shadow-lg"
        >
          <div>
            <label className="mb-2 block font-medium text-black">
              Subject
            </label>

            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ex. Operating System"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-black">
              Topics
            </label>

            <textarea
              rows={5}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ex. Process Management, Deadlocks, Scheduling..."
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-black">
                Exam Date
              </label>

              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-black">
                Study Hours / Day
              </label>

              <input
                type="number"
                min={1}
                max={12}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Enter Your Daily Study Hours"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                required
              />
            </div>
          </div>

         <button
         type="submit"
         disabled={loading}
         className="rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Study Plan"}
         </button>
        </form>
        {plan && (
  <div className="mt-8 rounded-xl bg-white text-black p-8 shadow">
    <h2 className="mb-4 text-2xl font-bold">
      Generated Study Plan
    </h2>

    <div className="whitespace-pre-wrap leading-8 text-gray-700">
      <ReactMarkdown>{plan}</ReactMarkdown>
    </div>
    <div className="mt-8 border-t pt-6">
      <button
        onClick={handleSavePlan}
        disabled={saving}
        className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Study Plan"}
      </button>
</div>
  </div>
)}
      </main>
    </>
    
  );
}