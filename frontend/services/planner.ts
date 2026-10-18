import api from "@/lib/api";

export interface PlannerRequest {
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
}

export interface SaveStudyPlanRequest {
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
  generated_plan: string;
}

export interface SavedStudyPlan {
  id: string;
  user_id: string;
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
  generated_plan: string;
  created_at?: string;
}

export interface SaveStudyPlanResponse {
  message: string;
  duplicate: boolean;
  data: SavedStudyPlan | SavedStudyPlan[] | null;
}

export interface SavedStudyPlansResponse {
  data: SavedStudyPlan[];
}

/**
 * Normalize text so equivalent input strings produce
 * the same client-side duplicate key.
 */
function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Generate a key from the fields that define a unique plan.
 */
export function getStudyPlanKey(
  data: PlannerRequest,
): string {
  return JSON.stringify({
    subject: normalizeText(data.subject),
    topics: normalizeText(data.topics),
    exam_date: data.exam_date,
    study_hours: Number(data.study_hours),
  });
}

/**
 * Generate a study plan using the AI backend.
 */
export async function generateStudyPlan(
  data: PlannerRequest,
) {
  const response = await api.post(
    "/planner/generate",
    {
      subject: data.subject.trim(),
      topics: data.topics.trim(),
      exam_date: data.exam_date,
      study_hours: Number(data.study_hours),
    },
  );

  return response.data;
}

/**
 * Save a study plan.
 *
 * The backend checks for an existing equivalent plan
 * before inserting a new database record.
 */
export async function saveStudyPlan(
  data: SaveStudyPlanRequest,
): Promise<SaveStudyPlanResponse> {
  const response = await api.post<SaveStudyPlanResponse>(
    "/planner/save",
    {
      subject: data.subject.trim(),
      topics: data.topics.trim(),
      exam_date: data.exam_date,
      study_hours: Number(data.study_hours),
      generated_plan: data.generated_plan.trim(),
    },
  );

  return response.data;
}

/**
 * Fetch saved plans.
 *
 * The backend returns a deduplicated list for the
 * authenticated user.
 */
export async function getSavedPlans(): Promise<SavedStudyPlansResponse> {
  const response = await api.get<SavedStudyPlansResponse>(
    "/planner/saved",
  );

  return response.data;
}

/**
 * Delete a saved study plan by its database ID.
 */
export async function deleteStudyPlan(
  planId: string,
) {
  const response = await api.delete(
    `/planner/saved/${encodeURIComponent(planId)}`,
  );

  return response.data;
}