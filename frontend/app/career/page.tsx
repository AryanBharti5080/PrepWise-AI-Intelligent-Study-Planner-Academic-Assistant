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

export default function CareerPage() {
  const router = useRouter();

  const [interest, setInterest] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!interest.trim()) {
      alert("Please enter your interests.");
      return;
    }

    setLoading(true);
    setSaved(false);
    setRecommendation("");
    

    try {
      const data = await getCareerRecommendation({
        interest: interest.trim(),
      });

      setRecommendation(data.recommendation);
      setSaved(Boolean(data.already_saved === true ));
    } catch (error) {
      console.error(error);
      alert("Unable to generate career recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRecommendation() {
    if (!recommendation || saved || saving) return;

    setSaving(true);

    try {
      await saveCareerRecommendation({
        interest: interest.trim(),
        recommendation,
      });

      setSaved(true);
      alert("Career recommendation saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save career recommendation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-4xl p-6 sm:p-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            AI Career Assistant
          </h1>

          <p className="mt-3 text-gray-600">
            Discover suitable career roles, required skills, certifications,
            and beginner-friendly projects based on your interests.
          </p>
        </section>

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/career/saved")}
            className="rounded-lg border border-blue-600 px-5 py-2 font-medium text-blue-600 hover:bg-blue-50"
          >
            View Saved Recommendations
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
        >
          <label
            htmlFor="interest"
            className="block font-semibold text-blue-600 sm:text-lg"
          >
            Your interests
          </label>

          <textarea
            id="interest"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="Example: Python, data analytics, artificial intelligence..."
            rows={4}
            required
            className="w-full rounded-lg border p-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 sm:text-lg"
          />

          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating..." : "Get Career Recommendations"}
          </button>
        </form>

        {recommendation && (
          <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-blue-600 sm:text-3xl">
              Your Career Recommendations
            </h2>

            <div className="max-w-none leading-7 text-gray-700 [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:my-4 [&_p]:text-justify [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:hover:no-underline">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 bg-gray-100 p-3 text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 p-3 align-top">
                      {children}
                    </td>
                  ),
                }}
              >
                {recommendation}
              </ReactMarkdown>
            </div>

            <button
              type="button"
              onClick={handleSaveRecommendation}
              disabled={saving || saved}
              className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : saved
                  ? "Recommendation Already Saved ✓"
                  : "Save Recommendation"}
            </button>
          </section>
        )}
      </main>
    </>
  );
}