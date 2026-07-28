import api from "@/lib/api";

export interface PlannerRequest {
  subject: string;
  topics: string;
  exam_date: string;
  study_hours: number;
}

export async function generateStudyPlan(data: PlannerRequest) {
  const response = await api.post("/planner/generate", data);
  return response.data;
}