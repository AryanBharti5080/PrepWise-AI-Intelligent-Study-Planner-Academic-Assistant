import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.utils.auth import get_current_user
from app.schemas.revision import (
    RevisionResponse,
    RevisionTaskItem,
    ToggleRevisionTaskRequest,
    AiAdviceRequest,
    AiAdviceResponse,
)
from app.services.revision_service import (
    build_revision_recommendations,
    generate_ai_revision_advice,
)

router = APIRouter(prefix="/revision", tags=["Revision Assistant"])
security = HTTPBearer()


def get_user_supabase_client(token: str):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        from pathlib import Path
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Database credentials not configured.")
    client = create_client(supabase_url, supabase_key)
    clean_token = str(token).replace("Bearer ", "").strip()
    client.postgrest.auth(clean_token)
    return client


@router.get("/recommendations", response_model=RevisionResponse)
async def get_revision_recommendations(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]
        client = get_user_supabase_client(credentials.credentials)

        # 1. Fetch user's study plans
        plans_res = (
            client.table("study_plans")
            .select("id, subject, topics, exam_date, study_hours, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        plans = plans_res.data or []

        # 2. Fetch user's quiz attempts
        quiz_res = (
            client.table("quiz_attempts")
            .select("id, subject, topic, difficulty, total_questions, score, created_at, answers")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        quizzes = quiz_res.data or []

        # 3. Build personalized recommendations
        raw_tasks = build_revision_recommendations(plans=plans, quizzes=quizzes)

        # 4. Check for persisted completed tasks in revision_tasks table
        completed_keys = set()
        db_tasks = (
            client.table("revision_tasks")
            .select("subject, topic, is_completed")
            .eq("user_id", user_id)
            .execute()
        )
        for row in (db_tasks.data or []):
            if row.get("is_completed"):
                completed_keys.add((str(row.get("subject", "")).strip().casefold(), str(row.get("topic", "")).strip().casefold()))

        # 5. Populate completion status
        task_items: List[RevisionTaskItem] = []
        for item in raw_tasks:
            key = (str(item["subject"]).strip().casefold(), str(item["topic"]).strip().casefold())
            is_comp = key in completed_keys
            task_items.append(RevisionTaskItem(
                id=item["id"],
                subject=item["subject"],
                topic=item["topic"],
                priority=item["priority"],
                suggested_duration=item["suggested_duration"],
                reason=item["reason"],
                suggested_activity=item["suggested_activity"],
                exam_date=item["exam_date"],
                days_until_exam=item["days_until_exam"],
                quiz_accuracy=item["quiz_accuracy"],
                quiz_attempts_count=item["quiz_attempts_count"],
                is_completed=is_comp,
                action_link=item["action_link"],
            ))

        total_tasks = len(task_items)
        high_count = sum(1 for t in task_items if t.priority == "High")
        med_count = sum(1 for t in task_items if t.priority == "Medium")
        low_count = sum(1 for t in task_items if t.priority == "Low")
        completed_count = sum(1 for t in task_items if t.is_completed)
        pct = round(completed_count / total_tasks * 100, 1) if total_tasks > 0 else 0.0

        insights = []
        if high_count > 0:
            insights.append(f"You have {high_count} high-priority revision task{'s' if high_count != 1 else ''} needing immediate attention.")
        if completed_count == total_tasks and total_tasks > 0:
            insights.append("Outstanding work! All recommended revision tasks are marked completed.")
        elif total_tasks == 0:
            insights.append("No revision tasks yet. Create a study plan or take a quiz to generate personalized recommendations.")

        return RevisionResponse(
            total_tasks=total_tasks,
            high_priority_count=high_count,
            medium_priority_count=med_count,
            low_priority_count=low_count,
            completed_count=completed_count,
            completion_percentage=pct,
            tasks=task_items,
            insights=insights,
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Revision recommendations error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to load revision recommendations.")


@router.patch("/tasks/{subject}/{topic}/toggle")
async def toggle_revision_task(
    subject: str,
    topic: str,
    request: ToggleRevisionTaskRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    clean_subject = subject.strip()
    clean_topic = topic.strip()
    if not clean_subject or not clean_topic:
        raise HTTPException(status_code=422, detail="Subject and topic cannot be empty.")

    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]
        client = get_user_supabase_client(credentials.credentials)

        completed_at = (
            datetime.now(timezone.utc).isoformat()
            if request.is_completed
            else None
        )

        upsert_res = (
            client.table("revision_tasks")
            .upsert(
                {
                    "user_id": user_id,
                    "subject": clean_subject,
                    "topic": clean_topic,
                    "is_completed": request.is_completed,
                    "completed_at": completed_at,
                },
                on_conflict="user_id,subject,topic",
            )
            .execute()
        )

        if not upsert_res.data:
            raise HTTPException(
                status_code=500,
                detail="Database rejected revision task update."
            )

        return {
            "success": True,
            "subject": clean_subject,
            "topic": clean_topic,
            "is_completed": request.is_completed,
            "completed_at": completed_at,
            "persisted_in_database": True,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Revision toggle error: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update revision task status: {str(exc)}",
        )


@router.post("/ai-advice", response_model=AiAdviceResponse)
async def get_ai_revision_advice_endpoint(
    request: AiAdviceRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        await get_current_user(credentials=credentials)
        result = generate_ai_revision_advice(
            subject=request.subject,
            topic=request.topic,
            priority=request.priority,
            exam_date=request.exam_date,
        )
        return AiAdviceResponse(
            subject=result["subject"],
            topic=result["topic"],
            advice=result["advice"],
            source=result["source"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Revision AI advice endpoint error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate AI revision advice.")

