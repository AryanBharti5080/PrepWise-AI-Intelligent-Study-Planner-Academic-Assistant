import os
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.utils.auth import get_current_user
from app.schemas.progress import (
    TopicProgressItem,
    PlanProgressSummary,
    PlanProgressDetail,
    UpdateTopicStatusRequest,
    UpdateTopicStatusResponse,
    OverallProgressResponse,
)
from app.services.progress_service import (
    extract_plan_topics,
    calculate_progress_percentage,
    parse_exam_date_and_days,
    build_quiz_stats_map,
    resolve_topic_progress,
)

router = APIRouter(prefix="/progress", tags=["Study Progress Tracker"])
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database credentials not configured.",
        )
    client = create_client(supabase_url, supabase_key)
    clean_token = str(token).replace("Bearer ", "").strip()
    client.postgrest.auth(clean_token)
    return client


@router.get("/plans", response_model=OverallProgressResponse)
async def get_all_plans_progress(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Fetch all saved study plans for the authenticated student,
    along with calculated topic counts and progress percentages.
    Includes both explicit study_progress records and submitted quiz mastery.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]
        client = get_user_supabase_client(credentials.credentials)

        # 1. Fetch user's saved study plans
        plans_res = (
            client.table("study_plans")
            .select("id, subject, topics, exam_date, study_hours, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        plans = plans_res.data if isinstance(getattr(plans_res, "data", None), list) else []

        # 2. Fetch all progress records for this user
        progress_rows = []
        try:
            progress_res = (
                client.table("study_progress")
                .select("id, plan_id, topic, status, completed_at, updated_at")
                .eq("user_id", user_id)
                .execute()
            )
            progress_rows = progress_res.data if isinstance(getattr(progress_res, "data", None), list) else []
        except Exception as p_err:
            print(f"Notice: study_progress query skipped: {p_err}")

        # Index progress by (plan_id, topic_name_casefold)
        progress_map: Dict[tuple, dict] = {}
        for row in progress_rows:
            p_id = str(row.get("plan_id", "")).strip()
            top = str(row.get("topic", "")).strip().casefold()
            progress_map[(p_id, top)] = row

        # 3. Fetch user's submitted quiz attempts
        quiz_rows = []
        try:
            quiz_res = (
                client.table("quiz_attempts")
                .select("subject, topic, score, total_questions, answers, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            quiz_rows = quiz_res.data if isinstance(getattr(quiz_res, "data", None), list) else []
        except Exception as q_err:
            print(f"Notice: quiz_attempts query skipped: {q_err}")

        quiz_stats = build_quiz_stats_map(quiz_rows)

        plan_summaries: List[PlanProgressSummary] = []
        total_all_topics = 0
        completed_all_topics = 0
        in_progress_all_topics = 0
        not_started_all_topics = 0

        for plan in plans:
            plan_id = str(plan.get("id")).strip()
            subject = str(plan.get("subject", "Untitled Subject")).strip()
            raw_topics = plan.get("topics")
            exam_date_str, days_left = parse_exam_date_and_days(plan.get("exam_date"))
            study_hours = float(plan.get("study_hours") or 2.0)
            created_at = plan.get("created_at")

            topics = extract_plan_topics(raw_topics)
            total_topics = len(topics)

            completed = 0
            in_prog = 0
            not_started = 0
            plan_topic_items: List[TopicProgressItem] = []

            for topic_name in topics:
                status, comp_at, upd_at, item_id = resolve_topic_progress(
                    plan_id=plan_id,
                    subject=subject,
                    topic_name=topic_name,
                    progress_map=progress_map,
                    quiz_stats=quiz_stats,
                )
                if status == "Completed":
                    completed += 1
                elif status == "In Progress":
                    in_prog += 1
                else:
                    not_started += 1

                plan_topic_items.append(
                    TopicProgressItem(
                        id=item_id,
                        topic=topic_name,
                        status=status,
                        completed_at=comp_at,
                        updated_at=upd_at,
                    )
                )

            pct = calculate_progress_percentage(total_topics, completed)

            total_all_topics += total_topics
            completed_all_topics += completed
            in_progress_all_topics += in_prog
            not_started_all_topics += not_started

            plan_summaries.append(
                PlanProgressSummary(
                    plan_id=plan_id,
                    subject=subject,
                    exam_date=exam_date_str,
                    days_until_exam=days_left,
                    study_hours=study_hours,
                    total_topics=total_topics,
                    completed_topics=completed,
                    in_progress_topics=in_prog,
                    not_started_topics=not_started,
                    progress_percentage=pct,
                    created_at=created_at,
                    topics=plan_topic_items,
                )
            )

        avg_pct = calculate_progress_percentage(total_all_topics, completed_all_topics)

        return OverallProgressResponse(
            total_plans=len(plan_summaries),
            total_topics=total_all_topics,
            completed_topics=completed_all_topics,
            in_progress_topics=in_progress_all_topics,
            not_started_topics=not_started_all_topics,
            average_progress_percentage=avg_pct,
            plans=plan_summaries,
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error fetching study progress: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load study progress plans.",
        )


@router.get("/plans/{plan_id}", response_model=PlanProgressDetail)
async def get_plan_progress_detail(
    plan_id: str,
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Fetch topic-level progress details for a specific saved study plan,
    verifying plan ownership for the authenticated student.
    Integrates both explicit study_progress records and submitted quiz mastery.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]
        client = get_user_supabase_client(credentials.credentials)

        # 1. Verify plan ownership
        plan_res = (
            client.table("study_plans")
            .select("id, subject, topics, exam_date, study_hours, created_at")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not plan_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study plan not found or access denied.",
            )

        plan = plan_res.data[0]
        subject = str(plan.get("subject", "Untitled Subject")).strip()
        exam_date_str, days_left = parse_exam_date_and_days(plan.get("exam_date"))
        study_hours = float(plan.get("study_hours") or 2.0)
        created_at = plan.get("created_at")

        # 2. Fetch progress records for this plan
        progress_rows = []
        try:
            progress_res = (
                client.table("study_progress")
                .select("id, topic, status, completed_at, updated_at")
                .eq("user_id", user_id)
                .eq("plan_id", plan_id)
                .execute()
            )
            progress_rows = progress_res.data if isinstance(getattr(progress_res, "data", None), list) else []
        except Exception as p_err:
            print(f"Notice: study_progress query skipped: {p_err}")

        progress_map = {
            (plan_id, str(row.get("topic", "")).strip().casefold()): row
            for row in progress_rows
        }

        # 3. Fetch user's submitted quiz attempts
        quiz_rows = []
        try:
            quiz_res = (
                client.table("quiz_attempts")
                .select("subject, topic, score, total_questions, answers, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            quiz_rows = quiz_res.data if isinstance(getattr(quiz_res, "data", None), list) else []
        except Exception as q_err:
            print(f"Notice: quiz_attempts query skipped: {q_err}")

        quiz_stats = build_quiz_stats_map(quiz_rows)

        # 4. Extract topics and construct detailed topic items
        topics = extract_plan_topics(plan.get("topics"))
        topic_items: List[TopicProgressItem] = []

        completed = 0
        in_prog = 0
        not_started = 0

        for topic_name in topics:
            current_status, comp_at, upd_at, item_id = resolve_topic_progress(
                plan_id=plan_id,
                subject=subject,
                topic_name=topic_name,
                progress_map=progress_map,
                quiz_stats=quiz_stats,
            )

            if current_status == "Completed":
                completed += 1
            elif current_status == "In Progress":
                in_prog += 1
            else:
                not_started += 1

            topic_items.append(
                TopicProgressItem(
                    id=item_id,
                    topic=topic_name,
                    status=current_status,
                    completed_at=comp_at,
                    updated_at=upd_at,
                )
            )

        total_topics = len(topic_items)
        pct = calculate_progress_percentage(total_topics, completed)

        return PlanProgressDetail(
            plan_id=plan_id,
            subject=subject,
            exam_date=exam_date_str,
            days_until_exam=days_left,
            study_hours=study_hours,
            total_topics=total_topics,
            completed_topics=completed,
            in_progress_topics=in_prog,
            not_started_topics=not_started,
            progress_percentage=pct,
            topics=topic_items,
            created_at=created_at,
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error fetching plan progress details: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load study plan progress details.",
        )


@router.patch("/plans/{plan_id}/topics", response_model=UpdateTopicStatusResponse)
async def update_topic_status(
    plan_id: str,
    request: UpdateTopicStatusRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Update the progress status of a topic within a saved study plan.
    Sets completed_at to the current UTC timestamp if Completed, or NULL otherwise.
    Persists status in Supabase study_progress table.
    """
    clean_topic = request.topic.strip()
    if not clean_topic:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Topic name cannot be empty.",
        )

    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]
        client = get_user_supabase_client(credentials.credentials)

        # 1. Enforce authenticated user access & verify plan ownership
        plan_check = (
            client.table("study_plans")
            .select("id, topics")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not plan_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study plan not found or access denied.",
            )

        # Canonicalize topic name against plan topics if available
        raw_plan_topics = plan_check.data[0].get("topics")
        plan_topics = extract_plan_topics(raw_plan_topics)
        canonical_topic = clean_topic
        for t in plan_topics:
            if t.strip().casefold() == clean_topic.casefold():
                canonical_topic = t.strip()
                break

        # 2. Set completed_at timestamp
        completed_at = (
            datetime.now(timezone.utc).isoformat()
            if request.status == "Completed"
            else None
        )

        # 3. Upsert status into study_progress
        upsert_res = (
            client.table("study_progress")
            .upsert(
                {
                    "user_id": user_id,
                    "plan_id": plan_id,
                    "topic": canonical_topic,
                    "status": request.status,
                    "completed_at": completed_at,
                },
                on_conflict="user_id,plan_id,topic",
            )
            .execute()
        )

        if not upsert_res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database rejected progress update.",
            )

        return UpdateTopicStatusResponse(
            success=True,
            plan_id=plan_id,
            topic=canonical_topic,
            status=request.status,
            completed_at=completed_at,
            persisted=True,
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error updating topic progress: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update topic progress status: {str(exc)}",
        )

