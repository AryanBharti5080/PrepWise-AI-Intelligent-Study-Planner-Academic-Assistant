"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateStudyPlan, saveStudyPlan } from "@/services/planner";

type PlannerInputs = {
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
};

type CachedPlan = {
  plan: string;
  inputs: PlannerInputs;
};

export default function PlannerPage() {
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyHours, setStudyHours] = useState("");

  const [plan, setPlan] = useState("");
  const [generatedInputs, setGeneratedInputs] =
    useState<PlannerInputs | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const generatingLock = useRef(false);
  const savingLock = useRef(false);

  const generatedPlans = useRef(new Map<string, CachedPlan>());
  const savedPlanKeys = useRef(new Set<string>());

  function normalizeText(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function createInputKey(inputs: PlannerInputs) {
    return JSON.stringify({
      subject: normalizeText(inputs.subject),
      topics: normalizeText(inputs.topics),
      exam_date: inputs.exam_date,
      study_hours: inputs.study_hours,
    });
  }

  function getCurrentInputs(): PlannerInputs {
    return {
      subject: subject.trim(),
      topics: topics.trim(),
      exam_date: examDate,
      study_hours: Number(studyHours),
    };
  }

  function clearMessages() {
    setNotice("");
    setErrorMessage("");
  }

  function validateInputs(): PlannerInputs | null {
    const inputs = getCurrentInputs();

    if (!inputs.subject) {
      setErrorMessage("Please enter the subject name.");
      return null;
    }

    if (inputs.subject.length > 100) {
      setErrorMessage("Subject must not exceed 100 characters.");
      return null;
    }

    if (!inputs.topics) {
      setErrorMessage("Please enter the topics you want to study.");
      return null;
    }

    if (inputs.topics.length > 5000) {
      setErrorMessage("Topics must not exceed 5000 characters.");
      return null;
    }

    if (!inputs.exam_date) {
      setErrorMessage("Please select your exam date.");
      return null;
    }

    const [year, month, day] = inputs.exam_date.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day
    ) {
      setErrorMessage("Please select a valid exam date.");
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrorMessage("Exam date cannot be in the past.");
      return null;
    }

    if (
      !Number.isInteger(inputs.study_hours) ||
      inputs.study_hours < 1 ||
      inputs.study_hours > 12
    ) {
      setErrorMessage("Daily study hours must be between 1 and 12.");
      return null;
    }

    return inputs;
  }

  function scrollToGeneratedPlan() {
    requestAnimationFrame(() => {
      document.getElementById("generated-plan")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    clearMessages();

    if (generatingLock.current || savingLock.current) {
      return;
    }

    const inputs = validateInputs();

    if (!inputs) {
      return;
    }

    const inputKey = createInputKey(inputs);
    const existingPlan = generatedPlans.current.get(inputKey);

    if (existingPlan) {
      generatingLock.current = true;

      try {
        setPlan(existingPlan.plan);
        setGeneratedInputs(existingPlan.inputs);
        setSaved(savedPlanKeys.current.has(inputKey));

        setNotice(
          "You've already generated a plan for these inputs. Your existing plan is displayed.",
        );

        scrollToGeneratedPlan();
      } finally {
        generatingLock.current = false;
      }

      return;
    }

    generatingLock.current = true;
    setLoading(true);

    try {
      const response = await generateStudyPlan({
        subject: inputs.subject,
        topics: inputs.topics,
        exam_date: inputs.exam_date,
        study_hours: inputs.study_hours,
      });

      if (
        typeof response?.plan !== "string" ||
        !response.plan.trim()
      ) {
        throw new Error("The API returned an empty study plan.");
      }

      const newPlan = response.plan;

      generatedPlans.current.set(inputKey, {
        plan: newPlan,
        inputs,
      });

      setPlan(newPlan);
      setGeneratedInputs(inputs);
      setSaved(savedPlanKeys.current.has(inputKey));

      setNotice("Your personalized study plan is ready.");

      scrollToGeneratedPlan();
    } catch (error) {
      console.error("Study plan generation failed:", error);

      setErrorMessage(
        "Unable to generate your study plan. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      generatingLock.current = false;
    }
  }

  async function handleSavePlan() {
    clearMessages();

    if (
      generatingLock.current ||
      savingLock.current ||
      loading ||
      saving ||
      !plan ||
      !generatedInputs
    ) {
      return;
    }

    const inputKey = createInputKey(generatedInputs);

    if (savedPlanKeys.current.has(inputKey)) {
      setSaved(true);
      setNotice("This study plan has already been saved in this session.");
      return;
    }

    savingLock.current = true;
    setSaving(true);

    try {
      const response = await saveStudyPlan({
        subject: generatedInputs.subject,
        topics: generatedInputs.topics,
        exam_date: generatedInputs.exam_date,
        study_hours: generatedInputs.study_hours,
        generated_plan: plan,
      });

      // Support the duplicate-response format from the backend.
      if (response?.duplicate) {
        savedPlanKeys.current.add(inputKey);
        setSaved(true);

        setNotice(
          response.message ||
            "An identical study plan already exists. Your existing plan was retained.",
        );

        return;
      }

      savedPlanKeys.current.add(inputKey);
      setSaved(true);

      setNotice(
        response?.message || "Your study plan was saved successfully.",
      );
    } catch (error) {
      console.error("Study plan saving failed:", error);

      setErrorMessage(
        "Failed to save the study plan. Please try again.",
      );
    } finally {
      setSaving(false);
      savingLock.current = false;
    }
  }

  const today = new Date();

  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const topicCount = generatedInputs
    ? generatedInputs.topics
        .split(",")
        .filter((topic) => topic.trim().length > 0).length
    : 0;

  const formattedExamDate = generatedInputs
    ? (() => {
        const [year, month, day] = generatedInputs.exam_date
          .split("-")
          .map(Number);

        return new Date(year, month - 1, day).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
        );
      })()
    : "";

  const currentGeneratedKey = generatedInputs
    ? createInputKey(generatedInputs)
    : "";

  const isCurrentPlanSaved =
    Boolean(currentGeneratedKey) &&
    savedPlanKeys.current.has(currentGeneratedKey);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white shadow-lg sm:p-9">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            <div className="relative max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium">
                <span aria-hidden="true">✦</span>
                AI-powered learning
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Your smarter way to prepare
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                Turn your syllabus, exam date, and available study time
                into a personalized preparation schedule with PrepWise AI.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                  ✓ Personalized schedule
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                  ✓ Revision planning
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                  ✓ Save your plan
                </span>
              </div>
            </div>
          </section>

          {/* Feedback */}
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
            >
              <span aria-hidden="true" className="font-bold">
                ✓
              </span>
              <p>{notice}</p>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              <span aria-hidden="true" className="font-bold">
                !
              </span>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="mb-7 border-b border-slate-100 pb-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Start preparing
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Tell us about your exam
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Complete these four fields to create your study plan.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Subject name <span className="text-red-500">*</span>
                </label>

                <input
                  id="subject"
                  type="text"
                  placeholder="e.g. Data Science – Statistics"
                  value={subject}
                  onChange={(event) => {
                    setSubject(event.target.value);
                    clearMessages();
                  }}
                  maxLength={100}
                  required
                  disabled={loading || saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Enter the subject you are preparing for.
                </p>
              </div>

              {/* Exam date */}
              <div>
                <label
                  htmlFor="examDate"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Examination date{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="examDate"
                  type="date"
                  min={minimumDate}
                  value={examDate}
                  onChange={(event) => {
                    setExamDate(event.target.value);
                    clearMessages();
                  }}
                  required
                  disabled={loading || saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Choose your upcoming exam date.
                </p>
              </div>

              {/* Topics */}
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="topics"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Topics to cover{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <span className="text-xs text-slate-500">
                    {topics.length}/5000
                  </span>
                </div>

                <textarea
                  id="topics"
                  rows={5}
                  placeholder={
                    "Enter your syllabus topics...\n\nExample: Descriptive Statistics, Probability, Probability Distributions, Hypothesis Testing"
                  }
                  value={topics}
                  onChange={(event) => {
                    setTopics(event.target.value);
                    clearMessages();
                  }}
                  maxLength={5000}
                  required
                  disabled={loading || saving}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Separate topics with commas or list them on separate lines.
                </p>
              </div>

              {/* Daily hours */}
              <div>
                <label
                  htmlFor="studyHours"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Available study hours{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    id="studyHours"
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    placeholder="e.g. 4"
                    value={studyHours}
                    onChange={(event) => {
                      setStudyHours(event.target.value);
                      clearMessages();
                    }}
                    required
                    disabled={loading || saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    hrs/day
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Choose between 1 and 12 hours per day.
                </p>
              </div>

              {/* Dynamic preparation hint */}
              <div className="flex items-center rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                  📅
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Your preparation, organized
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Your plan will be based on your topics, available time,
                    and examination date.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Review your details before generating your plan.
              </p>

              <button
                type="submit"
                disabled={loading || saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Generating your plan...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✦</span>
                    Generate Study Plan
                  </>
                )}
              </button>
            </div>

            {loading && (
              <div
                role="status"
                aria-live="polite"
                className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Creating your personalized study plan
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Please wait while PrepWise AI organizes your preparation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Generated plan */}
          {plan && generatedInputs && (
            <section
              id="generated-plan"
              className="mt-8 scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                      Your personalized schedule
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                      Study Plan
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Review your schedule, complete daily tasks, and revise
                      before your examination.
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800">
                    <span aria-hidden="true">✓</span>
                    Generated
                  </span>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
                <SummaryCard
                  label="Subject"
                  value={generatedInputs.subject}
                  icon="📘"
                />

                <SummaryCard
                  label="Exam date"
                  value={formattedExamDate}
                  icon="📅"
                />

                <SummaryCard
                  label="Daily study time"
                  value={`${generatedInputs.study_hours} hours`}
                  icon="⏱️"
                />

                <SummaryCard
                  label="Topics provided"
                  value={String(topicCount)}
                  icon="📚"
                />
              </div>

              {/* Markdown content */}
              <div className="p-5 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    Your Study Schedule
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Follow the daily schedule and use the revision guidance
                    to reinforce what you learn.
                  </p>
                </div>

                <div
                  className="
                    max-w-none break-words text-base leading-7 text-slate-700
                    [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900
                    [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900
                    [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900
                    [&_p]:my-3
                    [&_strong]:font-bold [&_strong]:text-slate-900
                    [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6
                    [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6
                    [&_li]:my-1
                    [&_hr]:my-6 [&_hr]:border-slate-200
                    [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4
                    [&_a]:text-blue-700 [&_a]:underline
                    [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-100 [&_pre]:p-4
                    [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1
                    [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse
                    [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-3 [&_th]:text-left
                    [&_td]:border [&_td]:border-slate-200 [&_td]:p-3
                  "
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {plan}
                  </ReactMarkdown>
                </div>

                {/* Save plan */}
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Save your progress
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Save this study plan so you can access it later.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePlan}
                      disabled={saving || saved || isCurrentPlanSaved || loading}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Saving plan..."
                        : saved || isCurrentPlanSaved
                          ? "✓ Plan Saved"
                          : "↗ Save Study Plan"}
                    </button>
                  </div>

                  {(saved || isCurrentPlanSaved) && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
                    >
                      ✓ This plan has been saved during this session.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-lg"
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 break-words text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}