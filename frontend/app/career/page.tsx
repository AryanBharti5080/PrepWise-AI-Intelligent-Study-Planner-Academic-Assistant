"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, CheckCircle2, Sparkles, BookOpen, BookmarkCheck } from "lucide-react";

import {
  getCareerRecommendation,
  saveCareerRecommendation,
} from "@/services/career";

const CAREER_EXAMPLES = [
  {
    title: "Data Analytics",
    description: "Python, SQL, Power BI, Excel, data visualization",
    interest:
      "Python, SQL, Excel, Power BI, data visualization, and business analytics",
  },
  {
    title: "AI & Machine Learning",
    description: "Python, AI, machine learning, statistics",
    interest:
      "Python, artificial intelligence, machine learning, statistics, and model building",
  },
  {
    title: "Software Development",
    description: "Python, APIs, databases, web development",
    interest:
      "Python, web development, APIs, databases, and problem solving",
  },
];

export default function CareerPage() {
  const router = useRouter();

  const [interest, setInterest] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanedInterest = interest.trim();

    if (!cleanedInterest) {
      setError("Please enter your interests before continuing.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    setRecommendation("");
    setSaved(false);

    try {
      const data = await getCareerRecommendation({
        interest: cleanedInterest,
      });

      if (
        !data ||
        typeof data.recommendation !== "string" ||
        !data.recommendation.trim()
      ) {
        setError(
          "The AI returned an empty recommendation. Please try again."
        );
        return;
      }

      setRecommendation(data.recommendation.trim());

      if (data.already_saved === true) {
        setSaved(true);
        setNotice(
          "This recommendation is already saved in your account."
        );
      }
    } catch (err) {
      console.error("Career recommendation error:", err);

      setError(
        "Unable to generate career recommendations. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRecommendation() {
    if (!recommendation || saved || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await saveCareerRecommendation({
        interest: interest.trim(),
        recommendation,
      });

      setSaved(true);
      setNotice("Career recommendation saved successfully.");
    } catch (err) {
      console.error("Save recommendation error:", err);

      setError(
        "Failed to save this recommendation. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function selectExample(exampleInterest: string) {
    setInterest(exampleInterest);
    setError("");
    setNotice("");
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 text-slate-900 dark:text-white dark:text-slate-100 transition-colors sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* HERO SECTION */}
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-700 to-blue-600 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900 p-6 text-white shadow-lg sm:p-9 border border-transparent dark:border-slate-800">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-cyan-300/10" />

            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
                  Personal career guidance
                </p>

                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  AI Career Assistant
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-50 sm:text-base">
                  Discover suitable career paths, identify the skills
                  you need, explore certifications, and find beginner-friendly
                  projects based on your interests.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/career/saved")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                <BookmarkCheck size={18} />
                View Saved Recommendations
              </button>
            </div>
          </section>

          {/* VERTICAL WORKFLOW LAYOUT */}
          <div className="flex flex-col gap-8">

            {/* 1. BUILD ROADMAP SECTION (TOP CARD) */}
            <section className="rounded-3xl border border-slate-200 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                    <Sparkles size={14} />
                    <span>Step 1: Your Profile</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    Build Your Career Roadmap
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Tell the AI what topics, languages, tools, or problems you enjoy exploring.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                {/* Left: Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="career-interest"
                      className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Your interests and skills <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      id="career-interest"
                      value={interest}
                      onChange={(event) => {
                        setInterest(event.target.value);
                        setError("");
                        setNotice("");
                      }}
                      placeholder="Example: I enjoy Python, SQL, data analysis, and building dashboards..."
                      rows={5}
                      maxLength={2000}
                      required
                      className="w-full resize-y rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-sm leading-6 text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                    />

                    <div className="mt-1 flex justify-between gap-3 text-xs text-slate-400">
                      <span>Be specific for more relevant, actionable guidance.</span>
                      <span>{interest.length}/2000</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Generating Recommendations...
                      </>
                    ) : (
                      "✦ Get Career Recommendations"
                    )}
                  </button>
                </form>

                {/* Right: Quick Examples & Features */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Try a quick example
                    </p>

                    <div className="grid gap-2 sm:grid-cols-1">
                      {CAREER_EXAMPLES.map((example) => (
                        <button
                          key={example.title}
                          type="button"
                          onClick={() => selectExample(example.interest)}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/70 p-3 text-left transition hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/60 dark:hover:bg-slate-800"
                        >
                          <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                            {example.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {example.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/40 p-3.5 text-xs text-blue-900 dark:text-blue-300">
                    <p className="font-bold text-blue-950 mb-1">What you will receive:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-600 dark:text-slate-300">
                      <span>✓ Best-fit roles</span>
                      <span>✓ Key skills</span>
                      <span>✓ Certifications</span>
                      <span>✓ Starter projects</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. CAREER RECOMMENDATIONS RESULTS (VERTICAL BELOW FORM) */}
            <section className="min-w-0 rounded-3xl border border-slate-200 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                    <BookOpen size={14} />
                    <span>Step 2: AI Roadmap</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    Generated Career Recommendations
                  </h2>
                </div>

                {recommendation && (
                  <button
                    type="button"
                    onClick={handleSaveRecommendation}
                    disabled={saving || saved}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      "Saving..."
                    ) : saved ? (
                      <>
                        <CheckCircle2 size={15} />
                        Recommendation Saved
                      </>
                    ) : (
                      "Save Recommendation"
                    )}
                  </button>
                )}
              </div>

              <div className="p-6 sm:p-8">
                {/* ERROR NOTIFICATION */}
                {error && (
                  <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                    <p>{error}</p>
                  </div>
                )}

                {/* SUCCESS NOTIFICATION */}
                {notice && (
                  <div
                    role="status"
                    className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-300"
                  >
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                    <p>{notice}</p>
                  </div>
                )}

                {/* LOADING SKELETON */}
                {loading ? (
                  <div
                    className="space-y-4 py-4"
                    aria-label="Generating career recommendations"
                  >
                    <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
                      <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                    <p className="pt-2 text-sm text-slate-500 dark:text-slate-400">
                      Analyzing your interests and preparing structured career guidance...
                    </p>
                  </div>
                ) : recommendation ? (
                  /* VERTICALLY STACKED MARKDOWN CONTENT */
                  <>
                    <div
                      className="
                        max-w-none break-words text-sm leading-7 text-slate-700 dark:text-slate-300
                        [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:border-b [&_h1]:border-slate-100 dark:[&_h1]:border-slate-800 [&_h1]:pb-2
                        [&_h2]:mb-2.5 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white
                        [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-800 dark:[&_h3]:text-slate-200
                        [&_p]:my-3.5
                        [&_ul]:my-3.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6
                        [&_ol]:my-3.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6
                        [&_li]:pl-1
                        [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white
                        [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-2
                        [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-400 [&_blockquote]:bg-indigo-50/50 dark:[&_blockquote]:bg-indigo-950/40 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:rounded-r-lg
                        [&_code]:rounded [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-slate-800 dark:[&_code]:text-slate-200
                      "
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                              <table className="w-full min-w-[520px] border-collapse text-sm">
                                {children}
                              </table>
                            </div>
                          ),

                          th: ({ children }) => (
                            <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-left font-bold text-slate-900 dark:text-white dark:text-white">
                              {children}
                            </th>
                          ),

                          td: ({ children }) => (
                            <td className="border-b border-slate-100 dark:border-slate-800 p-3 align-top text-slate-700 dark:text-slate-300">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {recommendation}
                      </ReactMarkdown>
                    </div>

                    {/* BOTTOM ACTIONS */}
                    <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Review these recommendations against your current goals. You can save and revisit this guidance anytime.
                      </p>

                      <button
                        type="button"
                        onClick={handleSaveRecommendation}
                        disabled={saving || saved}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          "Saving Recommendation..."
                        ) : saved ? (
                          <>
                            <CheckCircle2 size={16} />
                            Recommendation Saved
                          </>
                        ) : (
                          "Save Recommendation"
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* CLEAN COMPACT EMPTY STATE */
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                      ✦
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                      Your Career Guidance Will Appear Here
                    </h3>

                    <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                      Fill out your interests or select one of the examples above, then click &ldquo;Get Career Recommendations&rdquo; to build your tailored roadmap.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            AI-generated career guidance is a starting point. Verify
            certification details and role requirements before making
            important career decisions.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
