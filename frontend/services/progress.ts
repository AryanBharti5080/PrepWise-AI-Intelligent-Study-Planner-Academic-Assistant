import api from "@/lib/api";

export type TopicStatus = "Not Started" | "In Progress" | "Completed";

export interface TopicProgressItem {
  id?: string | null;
  topic: string;
  status: TopicStatus;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface PlanProgressSummary {
  plan_id: string;
  subject: string;
  exam_date?: string | null;
  days_until_exam?: number | null;
  study_hours: number;
  total_topics: number;
  completed_topics: number;
  in_progress_topics: number;
  not_started_topics: number;
  progress_percentage: number;
  created_at?: string | null;
  topics?: TopicProgressItem[];
}

export interface PlanProgressDetail {
  plan_id: string;
  subject: string;
  exam_date?: string | null;
  days_until_exam?: number | null;
  study_hours: number;
  total_topics: number;
  completed_topics: number;
  in_progress_topics: number;
  not_started_topics: number;
  progress_percentage: number;
  topics: TopicProgressItem[];
  created_at?: string | null;
}

export interface UpdateTopicStatusRequest {
  topic: string;
  status: TopicStatus;
}

export interface UpdateTopicStatusResponse {
  success: boolean;
  plan_id: string;
  topic: string;
  status: TopicStatus;
  completed_at?: string | null;
  persisted: boolean;
}

export interface OverallProgressResponse {
  total_plans: number;
  total_topics: number;
  completed_topics: number;
  in_progress_topics: number;
  not_started_topics: number;
  average_progress_percentage: number;
  plans: PlanProgressSummary[];
}

export async function getOverallProgress(): Promise<OverallProgressResponse> {
  const response = await api.get<OverallProgressResponse>("/progress/plans");
  return response.data;
}

export async function getPlanProgress(planId: string): Promise<PlanProgressDetail> {
  const response = await api.get<PlanProgressDetail>(
    `/progress/plans/${encodeURIComponent(planId)}`
  );
  return response.data;
}

export async function updateTopicStatus(
  planId: string,
  topic: string,
  status: TopicStatus
): Promise<UpdateTopicStatusResponse> {
  const response = await api.patch<UpdateTopicStatusResponse>(
    `/progress/plans/${encodeURIComponent(planId)}/topics`,
    {
      topic,
      status,
    }
  );
  return response.data;
}
