import api from "@/lib/api";

export interface CareerRecommendationRequest {
  interest: string;
}

export interface SaveCareerRecommendationRequest {
  interest: string;
  recommendation: string;
}

export async function getCareerRecommendation(
  data: CareerRecommendationRequest
) {
  const response = await api.post("/career/recommend", data);
  return response.data;
}

export async function saveCareerRecommendation(
  data: SaveCareerRecommendationRequest
) {
  const response = await api.post("/career/save", data);
  return response.data;
}

export async function getSavedCareerRecommendations() {
  const response = await api.get("/career/saved");
  return response.data;
}

export async function deleteCareerRecommendation(id: string) {
  const response = await api.delete(`/career/saved/${id}`);
  return response.data;
}