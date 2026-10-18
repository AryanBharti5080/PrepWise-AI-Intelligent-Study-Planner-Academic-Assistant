"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* HERO SECTION */}

          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-700 to-blue-600 p-6 text-white shadow-lg sm:p-9">
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
                <span aria-hidden="true">▤</span>
                View Saved Recommendations
              </button>
            </div>
          </section>

          {/* MAIN CONTENT */}

          <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">

            {/* LEFT PANEL */}

            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
                    ✦
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Build Your Career Roadmap
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Tell the AI what you enjoy, what you already know,
                    or what you want to learn.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="career-interest"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Your interests and skills
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
                      rows={6}
                      maxLength={2000}
                      required
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />

                    <div className="mt-1 flex justify-between gap-3 text-xs text-slate-400">
                      <span>
                        Be specific for more relevant guidance.
                      </span>

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

                {/* EXAMPLE INTERESTS */}

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Try an example
                  </p>

                  <div className="space-y-2">
                    {CAREER_EXAMPLES.map((example) => (
                      <button
                        key={example.title}
                        type="button"
                        onClick={() =>
                          selectExample(example.interest)
                        }
                        className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/60"
                      >
                        <span className="block text-sm font-bold text-slate-800">
                          {example.title}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {example.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* FEATURES */}

              <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <h3 className="font-bold text-blue-950">
                  What You&apos;ll Receive
                </h3>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-900">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Career paths related to your interests</span>
                  </li>

                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Skills to prioritize and practice</span>
                  </li>

                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Certification recommendations</span>
                  </li>

                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Beginner-friendly project ideas</span>
                  </li>

                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Save and revisit your recommendations</span>
                  </li>
                </ul>
              </section>
            </aside>

            {/* RIGHT PANEL */}

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Your Results
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Career Recommendations
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Personalized guidance based on the interests you share.
                </p>
              </div>

              <div className="p-5 sm:p-7">

                {/* ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
                  >
                    {error}
                  </div>
                )}

                {/* SUCCESS */}

                {notice && (
                  <div
                    role="status"
                    className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                  >
                    {notice}
                  </div>
                )}

                {/* LOADING */}

                {loading ? (
                  <div
                    className="space-y-4"
                    aria-label="Generating career recommendations"
                  >
                    <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />

                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />

                    <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />

                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />

                    <div className="mt-6 h-28 animate-pulse rounded-xl bg-slate-100" />

                    <div className="h-28 animate-pulse rounded-xl bg-slate-100" />

                    <p className="text-sm text-slate-500">
                      Preparing your career guidance. This may take a moment.
                    </p>
                  </div>
                ) : recommendation ? (
                  <>
                    {/* MARKDOWN RESULT */}

                    <div
                      className="
                        max-w-none break-words text-sm leading-7 text-slate-700
                        [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-950
                        [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-950
                        [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900
                        [&_p]:my-4
                        [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
                        [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
                        [&_li]:pl-1
                        [&_strong]:font-semibold [&_strong]:text-slate-950
                        [&_a]:text-indigo-700 [&_a]:underline [&_a]:underline-offset-2
                        [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-4
                        [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5
                      "
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto">
                              <table className="w-full min-w-[520px] border-collapse text-sm">
                                {children}
                              </table>
                            </div>
                          ),

                          th: ({ children }) => (
                            <th className="border border-slate-200 bg-slate-50 p-3 text-left font-bold text-slate-900">
                              {children}
                            </th>
                          ),

                          td: ({ children }) => (
                            <td className="border border-slate-200 p-3 align-top">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {recommendation}
                      </ReactMarkdown>
                    </div>

                    {/* SAVE BUTTON */}

                    <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-5 text-slate-500">
                        Review these recommendations against your goals
                        and current skill level before choosing a path.
                      </p>

                      <button
                        type="button"
                        onClick={handleSaveRecommendation}
                        disabled={saving || saved}
                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving
                          ? "Saving Recommendation..."
                          : saved
                            ? "Recommendation Saved ✓"
                            : "Save Recommendation"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* EMPTY STATE */

                  <div className="flex min-h-[340px] flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-700">
                      ✦
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-900">
                      Your Next Step Starts Here
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add your interests and skills, then generate a
                      recommendation to explore possible roles, learning
                      priorities, certifications, and projects.
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
      </main>
    </>
  );
}