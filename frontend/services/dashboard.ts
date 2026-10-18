import api from "@/lib/api";

// Recent study plan
export interface RecentPlan {
  id: string;
  subject: string;
  topics?: string;
  exam_date: string;
  study_hours: number;
  created_at: string;
}

// Subject-wise analytics
export interface SubjectCount {
  name: string;
  count: number;
  planned_study_hours: number;
}

// Subject distribution for pie chart
export interface SubjectDistribution {
  name: string;
  value: number;
}

// Daily study planning activity
export interface StudyActivity {
  date: string;
  plans_created: number;
}

// Upcoming exam details
export interface UpcomingExam {
  id: string;
  subject: string;
  exam_date: string;
  days_remaining: number;
  study_hours: number;
}

// Personalized study insight
export interface StudyInsight {
  type: "subject" | "exam" | "suggestion";
  title: string;
  message: string;
}

// Complete dashboard response
export interface DashboardStats {
  total_plans: number;
  subjects_studied: number;
  upcoming_exams: number;
  total_planned_study_hours: number;

  recent_plans: RecentPlan[];

  subject_counts: SubjectCount[];

  subject_distribution: SubjectDistribution[];

  study_activity: StudyActivity[];

  upcoming_exam_plans: UpcomingExam[];

  insights: StudyInsight[];
}

// Fetch dashboard analytics
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard/stats");

  return response.data;
}