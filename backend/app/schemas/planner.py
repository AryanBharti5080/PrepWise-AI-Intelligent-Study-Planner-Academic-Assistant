from pydantic import BaseModel

class StudyPlanRequest(BaseModel):
    subject: str
    topics: str
    exam_date: str
    study_hours: int