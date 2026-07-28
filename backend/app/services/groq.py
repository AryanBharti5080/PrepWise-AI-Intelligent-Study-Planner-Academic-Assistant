import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_study_plan(subject, topics, exam_date, study_hours):
    prompt = f"""
You are an expert study planner.

Generate a practical study plan.

Subject:
{subject}

Topics:
{topics}

Exam Date:
{exam_date}

Daily Study Hours:
{study_hours}

Return only:

1. Daily Study Schedule
2. Revision Strategy
3. Important Topics
4. Study Tips

Keep the response well formatted.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.5,
    )

    return response.choices[0].message.content