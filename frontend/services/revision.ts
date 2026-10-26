import api from "@/lib/api";

export interface RevisionTaskItem {
  id: string;
  subject: string;
  topic: string;
  priority: "High" | "Medium" | "Low";
  suggested_duration: string;
  reason: string;
  suggested_activity: string;
  exam_date?: string | null;
  days_until_exam?: number | null;
  quiz_accuracy?: number | null;
  quiz_attempts_count: number;
  is_completed: boolean;
  action_link: string;
}

export interface RevisionResponse {
  total_tasks: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  completed_count: number;
  completion_percentage: number;
  tasks: RevisionTaskItem[];
  insights: string[];
}

export interface AiAdviceRequest {
  subject: string;
  topic: string;
  priority: "High" | "Medium" | "Low";
  exam_date?: string | null;
}

export interface AiAdviceResponse {
  subject: string;
  topic: string;
  advice: string;
  source: "groq" | "fallback";
}

export async function getRevisionRecommendations(): Promise<RevisionResponse> {
  const response = await api.get<RevisionResponse>("/revision/recommendations");
  return response.data;
}

export async function toggleRevisionTask(
  subject: string,
  topic: string,
  isCompleted: boolean
) {
  const response = await api.patch(
    `/revision/tasks/${encodeURIComponent(subject)}/${encodeURIComponent(topic)}/toggle`,
    { is_completed: isCompleted }
  );
  return response.data;
}

export async function getAiRevisionAdvice(
  data: AiAdviceRequest
): Promise<AiAdviceResponse> {
  const response = await api.post<AiAdviceResponse>("/revision/ai-advice", data);
  return response.data;
}
