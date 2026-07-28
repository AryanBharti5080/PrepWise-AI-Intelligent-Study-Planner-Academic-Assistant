from fastapi import APIRouter

from app.schemas.planner import StudyPlanRequest
from app.services.groq import generate_study_plan

router = APIRouter(prefix="/planner", tags=["Study Planner"])


@router.post("/generate")
async def planner(request: StudyPlanRequest):

    plan = generate_study_plan(
        request.subject,
        request.topics,
        request.exam_date,
        request.study_hours,
    )

    return {
        "subject": request.subject,
        "plan": plan,
    }