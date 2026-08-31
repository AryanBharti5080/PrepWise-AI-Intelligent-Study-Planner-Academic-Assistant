from pydantic import BaseModel


class StudyPlanRequest(BaseModel):
    subject: str
    topics: str
    exam_date: str
    study_hours: int


class SaveStudyPlanRequest(BaseModel):
    subject: str
    topics: str
    exam_date: str
    study_hours: int
    generated_plan: str