import api from "@/lib/api";

export interface RecentPlan {
  id: string;
  subject: string;
  exam_date: string;
  study_hours: number;
  created_at: string;
}

export interface DashboardStats {
  total_plans: number;
  subjects_studied: number;
  upcoming_exams: number;
  recent_plans: RecentPlan[];
  subject_counts: {
    name: string;
    count: number;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get("/dashboard/stats");

  return response.data;
}