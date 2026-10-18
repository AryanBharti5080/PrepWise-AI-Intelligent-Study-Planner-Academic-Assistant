import os
from datetime import date, timedelta

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


def generate_study_plan(subject, topics, exam_date, study_hours):
    if not client:
        raise RuntimeError("GROQ_API_KEY is missing from the environment.")

    subject = subject.strip()
    topics = topics.strip()
    study_hours = int(study_hours)

    try:
        exam_day = date.fromisoformat(str(exam_date))
    except (ValueError, TypeError):
        raise ValueError("Please provide a valid exam date.")

    today = date.today()
    days_remaining = (exam_day - today).days

    if not subject or not topics:
        raise ValueError("Subject and topics cannot be empty.")

    if not 1 <= study_hours <= 12:
        raise ValueError("Daily study hours must be between 1 and 12.")

    if days_remaining < 0:
        preparation_period = (
            "The exam date has passed. Create a short recovery and revision "
            "plan for future preparation. Do not create a schedule with past dates."
        )
    elif days_remaining == 0:
        preparation_period = (
            "The exam is today. Create a realistic, short exam-day revision "
            "plan focused on key concepts, active recall, and staying calm. "
            "Do not create a multi-day schedule."
        )
    else:
        preparation_period = (
            f"There are {days_remaining} days remaining before the exam. "
            f"Create a day-wise schedule for the available preparation period. "
            f"Use calendar dates starting from {today.isoformat()} and ending "
            f"before or on the exam date {exam_day.isoformat()}. "
            "Do not invent dates or schedule study sessions after the exam."
        )

    prompt = f"""
You are PrepWise AI, a professional AI study planner and academic mentor.

Create a personalized, practical, student-friendly study plan using the
student details and requirements below.

## STUDENT DETAILS
- Subject: {subject}
- Topics supplied by the student: {topics}
- Today's date: {today.isoformat()}
- Exam date: {exam_day.isoformat()}
- Available study time: {study_hours} hours per day
- Preparation period: {preparation_period}

## CORE PLANNING RULES

1. Use only the supplied subject and topics. Do not invent unrelated syllabus topics.
2. Break the supplied topics into manageable learning units.
3. Prioritize topics based on conceptual importance, dependencies, and practice needs.
   Do not claim to know the actual exam paper or guaranteed exam questions.
4. Allocate time across learning, practice, active recall, and revision.
5. The total scheduled study time for any day must never exceed {study_hours} hours.
6. Show each session duration clearly and ensure daily durations add up correctly.
7. If there are many topics and few days, prioritize essential coverage and explain
   that some topics may need brief review rather than pretending everything can be
   mastered in depth.
8. Reserve preparation time for practice questions and reviewing mistakes when possible.
9. Include spaced revision on later days when the preparation period permits.
10. Use short breaks between sessions, but do not count breaks as study hours.
11. Use the actual calendar dates. Never schedule study dates in the past.
12. On the exam day, recommend only light revision if appropriate. Do not schedule
    an unrealistic full study day.
13. If the exam date has passed, provide a short plan for future learning and revision
    without inventing a new exam date.
14. If the preparation period is very short, prioritize high-value revision and practice.
15. Do not guarantee grades, exam questions, or results.

## OUTPUT FORMATTING RULES

- Return valid GitHub-Flavored Markdown.
- Use clear headings with ## and ###.
- Use relevant emojis in headings and important sections.
- Use concise bullet points instead of long paragraphs.
- Use **bold text** for important concepts.
- Use numbered lists for ordered activities.
- Do not use HTML tags.
- Avoid large Markdown tables.
- Do not wrap the entire response in a code block.
- Keep the response practical and easy to scan.
- Ensure the output renders correctly using ReactMarkdown.

## REQUIRED RESPONSE STRUCTURE

# 📚 Your Personalized Study Plan

Start with a brief overview of the subject, available daily study time, exam date,
and preparation goal.

## 🗓️ 1. Daily Study Schedule

Create a day-wise schedule using this format:

### 📅 Day 1: [Actual Date] | [Main Topic]

- **📖 Learning — [Duration]:** Explain the concepts to study.
- **✍️ Practice — [Duration]:** Solve relevant questions or examples.
- **🧠 Active Recall — [Duration]:** Recall concepts without looking at notes.
- **🔁 Revision — [Duration]:** Review previously studied material when appropriate.

**🎯 Daily Goal:** One specific, achievable outcome.

Adapt the number and type of sessions to the daily study-hour limit.
Not every day must use the same session structure.

Requirements:
- Include actual dates for future study days.
- Total study duration must not exceed {study_hours} hours per day.
- Do not include zero-duration or negative-duration sessions.
- Do not create more study days than the available preparation period.
- Keep the schedule concise but sufficiently specific.
- Use only the supplied topics.
- If the exam is today or has passed, follow the special preparation-period instructions.

## 🧠 2. Revision Strategy

Provide 4-6 practical strategies.

For each strategy, include:
### 🔹 [Strategy Name]
- **How to apply:** A specific action.
- **When to use it:** A suitable time in the preparation period.

Consider active recall, spaced repetition, practice questions, and error review where relevant.

## ⭐ 3. Important Topics

Select the most important topics from the student's supplied topic list.

For each topic, include:
- **📌 Topic:** Topic name.
- **💡 Why it matters:** A brief, reasonable explanation.
- **✅ What to prepare:** Relevant concepts, definitions, examples, or problem-solving skills.

Do not claim that a topic is guaranteed to appear in the examination.

## 🚀 4. Smart Study Tips

Provide 5-7 concise, actionable tips. Explain briefly how each tip helps.

## 🏁 Final Motivation

End with one short, encouraging sentence.

## FINAL QUALITY CHECK

Before returning the plan, verify:
- All four required sections are present.
- Dates match the actual preparation period.
- Daily study hours do not exceed {study_hours}.
- Session durations add up correctly.
- Topics are relevant to the supplied subject and topic list.
- The plan includes realistic learning, practice, and revision.
- No HTML tags or oversized tables are included.
- The response is valid, readable Markdown.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are PrepWise AI, an accurate and practical academic "
                    "planner. Follow the student's constraints strictly. "
                    "Never fabricate dates or claim that a topic is guaranteed "
                    "to appear in an examination."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.3,
    )

    content = response.choices[0].message.content

    if not content or not content.strip():
        raise RuntimeError("The AI returned an empty study plan.")

    return content.strip()