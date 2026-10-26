"use client";

import React, { useState } from "react";
import { MessageSquare, Star, CheckCircle2, AlertCircle, Sparkles, Send } from "lucide-react";

const FEEDBACK_TAGS = [
  "Study Planner",
  "Career Assistant",
  "Quizzes & Tests",
  "Progress Tracking",
  "Overall Experience",
];

export default function HomeFeedbackForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("Overall Experience");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ratingDescriptions: Record<number, string> = {
    1: "Needs Improvement",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const trimmed = feedback.trim();
    if (!trimmed) {
      setErrorMessage("Please enter your feedback before submitting.");
      return;
    }

    if (trimmed.length < 5) {
      setErrorMessage("Please share a little more detail (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);

    // Frontend-only submission confirmation simulation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedName(name.trim() || "Student");
      setSubmitted(true);
    }, 400);
  }

  function handleReset() {
    setName("");
    setRating(5);
    setHoverRating(null);
    setSelectedTag("Overall Experience");
    setFeedback("");
    setErrorMessage("");
    setSubmitted(false);
  }

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Banner Header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white px-6 py-8 sm:px-10 dark:border-slate-800 dark:from-slate-850 dark:via-slate-900 dark:to-slate-900">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-400">
            <MessageSquare size={14} />
            <span>Community Feedback</span>
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Help Us Improve PrepWise AI
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
            Your feedback directly guides new features and updates. Let us know how PrepWise is working for your study workflow.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {submitted ? (
            /* Attractive Success State */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 size={32} />
              </div>

              <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
                Thank You, {submittedName}!
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                Your feedback and {rating}-star rating have been captured for this session. We appreciate you taking the time to share your perspective with PrepWise AI.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2 text-xs font-medium text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Ready to continue preparing? Explore your AI Study Planner or Career Guidance.</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Submit Another Response
              </button>
            </div>
          ) : (
            /* Interactive Feedback Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Rating Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2 dark:text-slate-200">
                  How would you rate your experience?
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = starValue <= activeRating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="rounded-lg p-1 text-slate-300 transition-colors hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-slate-600"
                          aria-label={`${starValue} of 5 stars`}
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              isFilled
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {ratingDescriptions[activeRating] || "Good"} ({activeRating}/5)
                  </span>
                </div>
              </div>

              {/* Topic / Feature Chips */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2 dark:text-slate-200">
                  What feature is this about?
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TAGS.map((tag) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="feedback-name" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Your Name
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Optional</span>
                </div>
                <input
                  id="feedback-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  maxLength={60}
                  placeholder="e.g. Alex (or leave blank for anonymous)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40"
                />
              </div>

              {/* Feedback Textarea (Required) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="feedback-text" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{feedback.length}/1000</span>
                </div>
                <textarea
                  id="feedback-text"
                  rows={4}
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  maxLength={1000}
                  required
                  placeholder="Tell us what you like, what was challenging, or any suggestions you have..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Feedback is shared locally within this browser session to help refine your experience.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-blue-900/60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

