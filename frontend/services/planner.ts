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

export async function generateStudyPlan(data: PlannerRequest) {
  const response = await api.post("/planner/generate", data);

  return response.data;
}

export async function saveStudyPlan(data: SaveStudyPlanRequest) {
  const response = await api.post("/planner/save", data);

  return response.data;
}

export async function getSavedPlans() {
  const response = await api.get("/planner/saved");

  return response.data;
}

export async function deleteStudyPlan(planId: string) {
  const response = await api.delete(`/planner/saved/${planId}`);

  return response.data;
}