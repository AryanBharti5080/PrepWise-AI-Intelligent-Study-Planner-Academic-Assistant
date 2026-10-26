from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client
from dotenv import load_dotenv

import os
from app.schemas.quiz import QuizGenerateRequest
from app.services.quiz_service import generate_quiz
from app.utils.auth import get_current_user
from app.schemas.quiz import QuizSubmitRequest

load_dotenv()

router = APIRouter(prefix="/quiz", tags=["AI Quiz"])
security = HTTPBearer()


@router.post("/generate")
async def create_quiz(
    request: QuizGenerateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        questions = generate_quiz(
            subject=request.subject.strip(),
            topic=request.topic.strip(),
            difficulty=request.difficulty,
            total_questions=request.total_questions,
        )

        # Keep correct answers and explanations on the server.
        server_questions = questions

        # Remove answers and explanations before returning the quiz.
        public_questions = [
            {
                "question": q["question"],
                "options": q["options"],
            }
            for q in server_questions
        ]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
        user_supabase.postgrest.auth(credentials.credentials)

        result = user_supabase.table("quiz_attempts").insert({
            "user_id": user_id,
            "subject": request.subject.strip(),
            "topic": request.topic.strip(),
            "difficulty": request.difficulty,
            "total_questions": request.total_questions,
            "score": 0,
            "questions": server_questions,
            "answers": {},
        }).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save quiz.",
            )

        saved_quiz = result.data[0]

        return {
            "quiz_id": saved_quiz["id"],
            "subject": saved_quiz["subject"],
            "topic": saved_quiz["topic"],
            "difficulty": saved_quiz["difficulty"],
            "total_questions": saved_quiz["total_questions"],
            "questions": public_questions,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Quiz generation error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Unable to generate the quiz. Please try again.",
        )

@router.post("/submit")
async def submit_quiz(
    request: QuizSubmitRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
        user_supabase.postgrest.auth(credentials.credentials)

        result = (
            user_supabase.table("quiz_attempts")
            .select("*")
            .eq("id", request.quiz_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Quiz not found.")

        quiz = result.data[0]

        if quiz["answers"]:
            raise HTTPException(
                status_code=400,
                detail="This quiz has already been submitted.",
            )

        questions = quiz["questions"]
        submitted_answers = request.answers

        if any(
            not isinstance(answer, str)
            for answer in submitted_answers.values()
        ):
            raise HTTPException(
                status_code=422,
                detail="Answers must be text values.",
            )

        if (
            len(submitted_answers) != quiz["total_questions"]
            or set(submitted_answers.keys())
            != {str(i) for i in range(len(questions))}
        ):
            raise HTTPException(
                status_code=422,
                detail="Submit an answer for every question.",
            )

        score = 0
        results = []

        for index, question in enumerate(questions):
            selected_answer = submitted_answers[str(index)]

            if selected_answer not in question["options"]:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid option for question {index + 1}.",
                )

            correct_answer = question["correct_answer"]
            is_correct = selected_answer == correct_answer

            if is_correct:
                score += 1

            results.append({
                "question": question["question"],
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": question["explanation"],
            })

        update_result = (
            user_supabase.table("quiz_attempts")
            .update({
                "score": score,
                "answers": submitted_answers,
            })
            .eq("id", request.quiz_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not update_result.data:
            raise HTTPException(
               status_code=403,
               detail="Quiz update was blocked. Check Supabase UPDATE permissions and RLS policies.",
    )

        return {
            "quiz_id": request.quiz_id,
            "score": score,
            "total_questions": len(questions),

            "percentage": round(score / len(questions) * 100, 2),
            "results": results,
        }

    except Exception as exc:
        import traceback
        traceback.print_exc()
        print(f"QUIZ SUBMIT ERROR: {repr(exc)}")
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
@router.get("/history")
async def get_quiz_history(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
        user_supabase.postgrest.auth(credentials.credentials)

        result = (
            user_supabase.table("quiz_attempts")
            .select(
                "id, subject, topic, difficulty, total_questions, score, created_at, answers"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        history = []
        rows = result.data if isinstance(getattr(result, "data", None), list) else []

        for quiz in rows:
            answers_val = quiz.get("answers")
            if isinstance(answers_val, str):
                import json
                try:
                    answers_dict = json.loads(answers_val)
                except Exception:
                    answers_dict = {}
            elif isinstance(answers_val, dict):
                answers_dict = answers_val
            else:
                answers_dict = {}

            submitted = bool(answers_dict)
            score_val = quiz.get("score")
            total_questions = int(quiz.get("total_questions") or 1)

            percentage = None
            if submitted and score_val is not None and total_questions > 0:
                percentage = round((float(score_val) / float(total_questions)) * 100, 2)

            history.append({
                "id": str(quiz.get("id")),
                "subject": quiz.get("subject") or "Untitled Subject",
                "topic": quiz.get("topic") or "General",
                "difficulty": quiz.get("difficulty") or "Medium",
                "total_questions": total_questions,
                "score": int(score_val) if (submitted and score_val is not None) else None,
                "percentage": percentage,
                "submitted": submitted,
                "created_at": quiz.get("created_at"),
            })

        return history

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Quiz history error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve quiz history.",
        )


@router.delete("/history/{quiz_id}")
async def delete_quiz_history(
    quiz_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
        user_supabase.postgrest.auth(credentials.credentials)

        result = (
            user_supabase.table("quiz_attempts")
            .delete()
            .eq("id", quiz_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Quiz attempt not found.",
            )

        return {"message": "Quiz attempt deleted successfully."}

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Quiz deletion error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Unable to delete quiz attempt.",
        )

@router.get("/weak-topics")
async def get_weak_topics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        user = await get_current_user(credentials=credentials)
        user_id = user["id"]

        user_supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
        user_supabase.postgrest.auth(credentials.credentials)

        response = (
            user_supabase.table("quiz_attempts")
            .select("subject, topic, score, total_questions, answers")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        topic_stats = {}

        for attempt in response.data:
            if not attempt["answers"]:
                continue

            key = (attempt["subject"], attempt["topic"])
            stats = topic_stats.setdefault(
                key,
                {"attempts": 0, "total_score": 0, "total_questions": 0},
            )

            stats["attempts"] += 1
            stats["total_score"] += attempt["score"]
            stats["total_questions"] += attempt["total_questions"]

        weak_topics = []

        for (subject, topic), stats in topic_stats.items():
            percentage = round(
                stats["total_score"] / stats["total_questions"] * 100, 2
            )

            weak_topics.append({
                "subject": subject,
                "topic": topic,
                "attempts": stats["attempts"],
                "average_percentage": percentage,
                "needs_practice": percentage < 60,
            })

        weak_topics.sort(key=lambda item: item["average_percentage"])

        return {
            "topics_analyzed": len(weak_topics),
            "weak_topics": [
                topic for topic in weak_topics if topic["needs_practice"]
            ],
            "topic_performance": weak_topics,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Weak topic analysis error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Unable to analyze weak topics.",
        )