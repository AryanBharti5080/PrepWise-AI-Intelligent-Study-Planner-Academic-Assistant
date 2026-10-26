import api from "@/lib/api";

// Recent study plan
export interface RecentPlan {
  id: string;
  subject: string;
  topics?: string;
  exam_date: string;
  study_hours: number;
  created_at: string;
  progress_percentage?: number;
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
  progress_percentage?: number;
  completed_topics?: number;
  total_topics?: number;
}

// Personalized study insight
export interface StudyInsight {
  type: "subject" | "exam" | "suggestion";
  title: string;
  message: string;
}

// Phase 2: Quiz Score Time-series point
export interface QuizScorePoint {
  id: string;
  date: string;
  full_date?: string;
  subject: string;
  topic: string;
  score: number;
  total_questions: number;
  percentage: number;
  difficulty: string;
}

// Phase 2: Subject Quiz Performance
export interface SubjectQuizPerformance {
  subject: string;
  attempts: number;
  average_percentage: number;
}

// Phase 2: Weak Topic Summary Item
export interface WeakTopicItem {
  subject: string;
  topic: string;
  attempts: number;
  average_percentage: number;
  needs_practice: boolean;
}

// Phase 2: Combined Activity Timeline Item
export interface DashboardActivityItem {
  id: string;
  type: "study_plan" | "quiz";
  title: string;
  description: string;
  timestamp: string;
  subject: string;
  badge: string;
  link: string;
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

  // Enhanced Phase 2 fields
  total_quiz_attempts?: number;
  submitted_quiz_attempts?: number;
  average_quiz_score?: number | null;
  weak_topics_count?: number;
  weak_topics_summary?: WeakTopicItem[];
  quiz_score_trend?: QuizScorePoint[];
  subject_quiz_performance?: SubjectQuizPerformance[];
  recent_activity?: DashboardActivityItem[];

  // Phase 4: Study Progress Tracker summary
  study_progress_summary?: {
    total_topics: number;
    completed_topics: number;
    in_progress_topics: number;
    not_started_topics: number;
    progress_percentage: number;
  };

  // Phase 3: AI Revision Assistant summary
  revision_summary?: {
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
  };
}

// Fetch dashboard analytics
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard/stats");
  return response.data;
}