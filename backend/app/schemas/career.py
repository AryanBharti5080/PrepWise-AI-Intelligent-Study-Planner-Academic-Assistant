from pydantic import BaseModel


class CareerRecommendationRequest(BaseModel):
    interest: str


class SaveCareerRecommendationRequest(BaseModel):
    interest: str
    recommendation: str