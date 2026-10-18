"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateQuiz, submitQuiz } from "@/services/quiz";
import type { GeneratedQuiz } from "@/services/quiz";

interface QuizResult {
  score: number;
  total_questions: number;
  percentage: number;
  results: {
    question: string;
    selected_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }[];
}

export default function QuizPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );
  const [totalQuestions, setTotalQuestions] = useState<5 | 10 | 15>(5);

  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setQuiz(null);
    setResult(null);
    setAnswers({});

    try {
      const data = await generateQuiz({
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        total_questions: totalQuestions,
      });

      setQuiz(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to generate your quiz. Check that the backend is running and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!quiz) return;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await submitQuiz({
        quiz_id: quiz.quiz_id,
        answers,
      });

      setResult(data as QuizResult);
    } catch (err) {
      console.error(err);
      setError("Unable to submit your quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetQuiz() {
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setError("");
  }

  const correctCount = result?.score ?? 0;
  const percentage = result?.percentage ?? 0;

  return (
    <main className="min-h-screen bg-[#f5f7ff] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-200">
              P
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">PrepWise AI</h1>
              <p className="text-xs text-slate-500">Your intelligent study partner</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-7 text-white shadow-xl shadow-indigo-200 sm:p-10">
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-violet-300/10" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <span>✦</span>
              AI-POWERED LEARNING
            </div>

            <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">
              Test your knowledge.
              <br />
              <span className="text-indigo-200">Level up your learning.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
  Generate personalized quizzes, measure your understanding, and
  learn from every answer with AI-powered explanations.
</p>

<div className="mt-6 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={() => router.push("/quiz/history")}
    className="rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
  >
    View Quiz History →
  </button>
  <button
    type="button"
    onClick={() => router.push("/quiz/weak-topics")}
    className="rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
  >
    View Weak Topics →
  </button>
</div>

            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
                ✓ Instant scoring
              </span>
              <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
                ✓ Detailed explanations
              </span>
              <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
                ✓ Personalized practice
              </span>
            </div>
          </div>

          <div className="absolute bottom-5 right-8 hidden text-8xl opacity-20 lg:block">
            🎯
          </div>
        </section>

        {/* Quiz Setup */}
        {!quiz && !result && (
          <section className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7">
                <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                  Get started
                </p>
                <h3 className="mt-2 text-2xl font-bold">Create your quiz</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Customize your practice session to match your learning goals.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="e.g. Machine Learning"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="topic"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Topic
                  </label>

                  <input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="e.g. Supervised Learning, Neural Networks"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-800">
                    Select difficulty
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {(["Easy", "Medium", "Hard"] as const).map((level) => {
                      const selected = difficulty === level;

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`rounded-xl border px-3 py-4 text-center transition ${
                            selected
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                              : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                          }`}
                        >
                          <span className="block text-xl">
                            {level === "Easy"
                              ? "🌱"
                              : level === "Medium"
                                ? "⚡"
                                : "🔥"}
                          </span>
                          <span className="mt-2 block text-sm font-bold">
                            {level}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="questionCount"
                    className="mb-3 block text-sm font-semibold text-slate-800"
                  >
                    Number of questions
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {([5, 10, 15] as const).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTotalQuestions(count)}
                        className={`rounded-xl border px-3 py-4 transition ${
                          totalQuestions === count
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                        }`}
                      >
                        <span className="block text-xl font-extrabold">
                          {count}
                        </span>
                        <span className="text-xs">Questions</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating your quiz...
                    </>
                  ) : (
                    <>✦ Generate My Quiz →</>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Your quiz will be generated based on your selected topic.
                </p>
              </form>
            </div>

            {/* Right sidebar */}
            <aside className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">How it works</h3>

                <div className="mt-6 space-y-6">
                  {[
                    {
                      number: "01",
                      title: "Choose your topic",
                      description: "Select a subject and what you want to practice.",
                      icon: "📚",
                    },
                    {
                      number: "02",
                      title: "Challenge yourself",
                      description: "Answer AI-generated multiple-choice questions.",
                      icon: "🧠",
                    },
                    {
                      number: "03",
                      title: "Review your results",
                      description: "Understand mistakes and learn the correct answers.",
                      icon: "📈",
                    },
                  ].map((step) => (
                    <div key={step.number} className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                        {step.icon}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-indigo-600">
                          STEP {step.number}
                        </p>
                        <h4 className="mt-1 font-bold">{step.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6">
                <div className="text-3xl">💡</div>
                <h3 className="mt-3 font-bold">Study smarter</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Focus on understanding concepts rather than memorizing
                  answers. Review every explanation to strengthen your
                  knowledge.
                </p>
              </div>
            </aside>
          </section>
        )}

        {/* Active Quiz */}
        {quiz && !result && (
          <section className="mt-8">
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  YOUR PRACTICE SESSION
                </p>
                <h3 className="mt-1 text-xl font-bold">{quiz.subject}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {quiz.topic} · {quiz.difficulty}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="rounded-xl bg-indigo-50 px-4 py-3 text-center">
                  <p className="text-xl font-extrabold text-indigo-700">
                    {Object.keys(answers).length}/{quiz.questions.length}
                  </p>
                  <p className="text-xs text-slate-500">Answered</p>
                </div>
              </div>
            </div>

            <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${
                    (Object.keys(answers).length / quiz.questions.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="space-y-5">
              {quiz.questions.map((question, index) => (
                <article
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="flex-1">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Question {index + 1}
                      </p>
                      <h4 className="text-base font-bold leading-7 text-slate-900 sm:text-lg">
                        {question.question}
                      </h4>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 sm:ml-14">
                    {question.options.map((option, optionIndex) => {
                      const selected = answers[String(index)] === option;
                      const letter = String.fromCharCode(65 + optionIndex);

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setAnswers((previous) => ({
                              ...previous,
                              [String(index)]: option,
                            }))
                          }
                          className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                              selected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {letter}
                          </span>

                          <span className="flex-1 text-sm font-medium text-slate-800">
                            {option}
                          </span>

                          {selected && (
                            <span className="font-bold text-indigo-600">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
              <p className="text-sm text-slate-500">
                {quiz.questions.length - Object.keys(answers).length} questions
                remaining
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Evaluating answers..." : "Submit My Answers →"}
              </button>
            </div>
          </section>
        )}

        {/* Results */}
        {result && (
          <section className="mt-8 space-y-7">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-8 text-center text-white sm:py-12">
                <div className="text-5xl">🎉</div>
                <p className="mt-4 text-sm font-bold uppercase tracking-widest text-emerald-100">
                  Quiz completed
                </p>
                <h3 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                  Great effort!
                </h3>
                <p className="mt-3 text-sm text-emerald-50">
                  Every attempt is an opportunity to improve.
                </p>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-8">
                <div className="rounded-2xl bg-indigo-50 p-5 text-center">
                  <p className="text-sm font-medium text-slate-500">Your Score</p>
                  <p className="mt-2 text-3xl font-extrabold text-indigo-700">
                    {correctCount}/{result.total_questions}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-5 text-center">
                  <p className="text-sm font-medium text-slate-500">Accuracy</p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                    {percentage}%
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-5 text-center">
                  <p className="text-sm font-medium text-slate-500">Incorrect</p>
                  <p className="mt-2 text-3xl font-extrabold text-amber-700">
                    {result.total_questions - correctCount}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-8 sm:px-8">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    Overall performance
                  </span>
                  <span className="font-bold text-indigo-700">{percentage}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {percentage >= 80
                    ? "Excellent work! You have demonstrated a strong understanding of this topic."
                    : percentage >= 50
                      ? "Good progress! Review the explanations below to strengthen the concepts you missed."
                      : "Keep practicing! Review the correct answers and explanations, then try another quiz."}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                  Learn from your answers
                </p>
                <h3 className="mt-2 text-2xl font-extrabold">Answer review</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Review each question, your answer, and the correct explanation.
                </p>
              </div>

              <div className="space-y-4">
                {result.results.map((item, index) => (
                  <article
                    key={index}
                    className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-7 ${
                      item.is_correct
                        ? "border-emerald-200"
                        : "border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                          item.is_correct
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.is_correct ? "✓" : "✕"}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Question {index + 1}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.is_correct
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.is_correct ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        <h4 className="font-bold leading-7 text-slate-900">
                          {item.question}
                        </h4>

                        <div className="mt-4 space-y-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Your answer
                            </p>
                            <p className="mt-2 font-medium text-slate-800">
                              {item.selected_answer}
                            </p>
                          </div>

                          <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                              Correct answer
                            </p>
                            <p className="mt-2 font-semibold text-emerald-900">
                              {item.correct_answer}
                            </p>
                          </div>

                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                            <p className="font-bold text-indigo-900">
                              💡 Explanation
                            </p>
                            <p className="mt-2 leading-6 text-slate-700">
                              {item.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:justify-center sm:p-7">
              <button
                type="button"
                onClick={resetQuiz}
                className="rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white transition hover:bg-indigo-700"
              >
                ✦ Take Another Quiz
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border border-slate-200 px-8 py-4 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          PrepWise AI · Learn smarter, one question at a time.
        </footer>
      </div>
    </main>
  );
}