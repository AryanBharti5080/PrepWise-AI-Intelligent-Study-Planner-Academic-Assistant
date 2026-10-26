from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class RevisionTaskItem(BaseModel):
    id: str
    subject: str
    topic: str
    priority: Literal["High", "Medium", "Low"]
    suggested_duration: str
    reason: str
    suggested_activity: str
    exam_date: Optional[str] = None
    days_until_exam: Optional[int] = None
    quiz_accuracy: Optional[float] = None
    quiz_attempts_count: int = 0
    is_completed: bool = False
    action_link: str = "/quiz"


class RevisionResponse(BaseModel):
    total_tasks: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    completed_count: int
    completion_percentage: float
    tasks: List[RevisionTaskItem]
    insights: List[str] = []


class ToggleRevisionTaskRequest(BaseModel):
    is_completed: bool


class AiAdviceRequest(BaseModel):
    subject: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    priority: Literal["High", "Medium", "Low"] = "Medium"
    exam_date: Optional[str] = None


class AiAdviceResponse(BaseModel):
    subject: str
    topic: str
    advice: str
    source: Literal["groq", "fallback"]

