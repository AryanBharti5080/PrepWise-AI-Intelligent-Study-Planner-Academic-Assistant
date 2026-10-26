import api from "@/lib/api";

export interface QuizGenerateRequest {
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  total_questions: 5 | 10 | 15;
}

export interface QuizQuestion {
  question: string;
  options: string[];
}

export interface GeneratedQuiz {
  quiz_id: string;
  subject: string;
  topic: string;
  difficulty: string;
  total_questions: number;
  questions: QuizQuestion[];
}

export interface QuizSubmitRequest {
  quiz_id: string;
  answers: Record<string, string>;
}

export async function generateQuiz(data: QuizGenerateRequest) {
  const response = await api.post<GeneratedQuiz>("/quiz/generate", data);
  return response.data;
}

export async function submitQuiz(data: QuizSubmitRequest) {
  const response = await api.post("/quiz/submit", data);
  return response.data;
}

export interface QuizHistoryItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  total_questions: number;
  score: number | null;
  percentage: number | null;
  submitted: boolean;
  created_at: string;
}

export async function getQuizHistory(): Promise<QuizHistoryItem[]> {
  const response = await api.get<QuizHistoryItem[]>("/quiz/history");
  return response.data;
}

export async function deleteQuizHistory(quizId: string) {
  const response = await api.delete(`/quiz/history/${quizId}`);
  return response.data;
}

export async function getWeakTopics() {
  const response = await api.get("/quiz/weak-topics");
  return response.data;
}