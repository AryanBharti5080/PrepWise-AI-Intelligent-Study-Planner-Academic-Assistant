import json
import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_quiz(subject: str, topic: str, difficulty: str, total_questions: int):
    prompt = f"""
Generate exactly {total_questions} multiple-choice questions.

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

Return ONLY valid JSON in this format:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_answer": "Exact text of the correct option",
            "explanation": "Brief explanation of the correct answer"
        }}
    ]
}}

Rules:
- Generate exactly {total_questions} questions.
- Provide exactly four distinct options per question.
- Ensure one correct answer per question.
- The correct_answer must exactly match one option.
- Keep questions relevant to the specified subject and topic.
- Return valid JSON without Markdown or additional text.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    questions = result.get("questions", [])

    if len(questions) != total_questions:
        raise ValueError("The AI returned an incorrect number of questions.")

    for question in questions:
        options = question.get("options", [])
        correct_answer = question.get("correct_answer")

        if (
            len(options) != 4
            or len(set(options)) != 4
            or correct_answer not in options
            or not question.get("question")
            or not question.get("explanation")
        ):
            raise ValueError("The AI returned an invalid quiz question.")

    return questions