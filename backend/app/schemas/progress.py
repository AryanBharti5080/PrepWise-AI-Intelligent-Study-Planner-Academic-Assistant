from typing import List, Optional, Literal
from pydantic import BaseModel, Field

TopicStatus = Literal["Not Started", "In Progress", "Completed"]


class TopicProgressItem(BaseModel):
    id: Optional[str] = None
    topic: str
    status: TopicStatus = "Not Started"
    completed_at: Optional[str] = None
    updated_at: Optional[str] = None


class PlanProgressSummary(BaseModel):
    plan_id: str
    subject: str
    exam_date: Optional[str] = None
    days_until_exam: Optional[int] = None
    study_hours: float = 2.0
    total_topics: int = 0
    completed_topics: int = 0
    in_progress_topics: int = 0
    not_started_topics: int = 0
    progress_percentage: float = 0.0
    created_at: Optional[str] = None
    topics: List[TopicProgressItem] = []


class PlanProgressDetail(BaseModel):
    plan_id: str
    subject: str
    exam_date: Optional[str] = None
    days_until_exam: Optional[int] = None
    study_hours: float = 2.0
    total_topics: int = 0
    completed_topics: int = 0
    in_progress_topics: int = 0
    not_started_topics: int = 0
    progress_percentage: float = 0.0
    topics: List[TopicProgressItem] = []
    created_at: Optional[str] = None


class UpdateTopicStatusRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    status: TopicStatus


class UpdateTopicStatusResponse(BaseModel):
    success: bool
    plan_id: str
    topic: str
    status: TopicStatus
    completed_at: Optional[str] = None
    persisted: bool = True


class OverallProgressResponse(BaseModel):
    total_plans: int = 0
    total_topics: int = 0
    completed_topics: int = 0
    in_progress_topics: int = 0
    not_started_topics: int = 0
    average_progress_percentage: float = 0.0
    plans: List[PlanProgressSummary] = []

