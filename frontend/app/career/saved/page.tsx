"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import {
  getSavedCareerRecommendations,
  deleteCareerRecommendation,
} from "@/services/career";

interface CareerRecommendation {
  id: string;
  interest: string;
  recommendation: string;
  created_at: string;
}

export default function SavedCareerPage() {
  const router = useRouter();

  const [recommendations, setRecommendations] = useState<
    CareerRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecommendations() {
    try {
      const result = await getSavedCareerRecommendations();
      setRecommendations(result.data ?? []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load saved recommendations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        const user = await getCurrentUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        await loadRecommendations();
      } catch (err) {
        console.error(err);
        router.replace("/login");
      }
    }

    initialize();
  }, [router]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recommendation?"
    );

    if (!confirmed) return;

    try {
      await deleteCareerRecommendation(id);

      setRecommendations((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(err);
      alert("Unable to delete recommendation.");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-8 text-center">
          Loading saved recommendations...
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl p-6 sm:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Saved Career Recommendations
            </h1>
            <p className="mt-2 text-gray-600">
              Review and manage your saved career recommendations.
            </p>
          </div>

          <button
            onClick={() => router.push("/career")}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Explore Careers
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                void loadRecommendations();
              }}
              className="mt-2 font-medium underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!error && recommendations.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No saved recommendations yet
            </h2>
            <p className="mt-2 text-gray-600">
              Generate and save a career recommendation to see it here.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {recommendations.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-blue-600">
                    {item.interest}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Saved on{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <details className="mt-4">
  <summary className="cursor-pointer rounded-lg bg-gray-50 p-4 font-medium text-blue-600 hover:bg-gray-100">
    View Full Recommendation
  </summary>

  <div className="mt-4 leading-7 text-gray-700 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {item.recommendation}
    </ReactMarkdown>
  </div>
</details>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}